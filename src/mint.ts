import {
    getConcurrentMerkleTreeAccountSize,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
  } from "@solana/spl-account-compression";

  import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
  } from "@solana/web3.js";

  import {
    createCreateTreeInstruction,
    createMintToCollectionV1Instruction,
    createRedeemInstruction,
    createTransferInstruction,
    MetadataArgs,
    TokenProgramVersion,
    TokenStandard,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  } from "@metaplex-foundation/mpl-bubblegum";
import { CreateMetadataAccountArgsV3, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { BN } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
//@ts-ignore
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Signer } from "@metaplex-foundation/js";

  
export async function getBubblegumAuthorityPDA(merkleRollPubKey: PublicKey) {
    const [bubblegumAuthorityPDAKey] = await PublicKey.findProgramAddress(
      [merkleRollPubKey.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );
    return bubblegumAuthorityPDAKey;
  }
  
export function bufferToArray(buffer: Buffer): number[] {
    const nums = [];
    for (let i = 0; i < buffer.length; i++) {
      nums.push(buffer[i]);
    }
    return nums;
  }
  
export async function getVoucherPDA(
    tree: PublicKey,
    leafIndex: number
  ): Promise<PublicKey> {
    const [voucher] =  PublicKey.findProgramAddressSync(
      [
        Buffer.from("voucher", "utf8"),
        tree.toBuffer(),
        Uint8Array.from(new BN(leafIndex).toArray("le", 8)),
      ],
      BUBBLEGUM_PROGRAM_ID
    );
    return voucher;
  }
  
export const getCompressedNftId = async (
    treeKeypair: Keypair,
    leafIndex: number
  ) => {
    const node = new BN.BN(leafIndex);
    const [assetId] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("asset", "utf8"),
        treeKeypair.publicKey.toBuffer(),
        Uint8Array.from(node.toArray("le", 8)),
      ],
      BUBBLEGUM_PROGRAM_ID
    );
    return assetId;
  };

  // Creates a new merkle tree for compression.
  export const initTree = async (
    connection: any,
    wallet: WalletContextState,
    treeKeypair: Keypair,
    maxDepth: number = 14,
    maxBufferSize: number = 64
  ) => {
    const payer = wallet.publicKey!;
    const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);
    let tx: TransactionInstruction[] = [];
    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
      [treeKeypair.publicKey.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );
    const allocTreeIx = SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: treeKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(space),
      space: space,
      programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    });
    tx.push(allocTreeIx);
    const createTreeIx = createCreateTreeInstruction(
      {
        merkleTree: treeKeypair.publicKey,
        treeAuthority,
        treeCreator: payer,
        payer,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      },
      {
        maxBufferSize,
        maxDepth,
        public: false,
      },
      BUBBLEGUM_PROGRAM_ID
    );
    tx.push(createTreeIx);
    let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;

    const V0Message = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: tx
    }).compileToV0Message([]);

    const transaction = new VersionedTransaction(V0Message);

    const tree_signer:Signer = treeKeypair;
    //@ts-ignore
    const signedTransaction = await wallet.signTransaction(transaction);
    signedTransaction.sign([tree_signer]);
    console.log('User Signed')

    try {
      await connection.sendTransaction(
        signedTransaction,
        {maxRetries: 5}
      );
      console.log(
        "Successfull created merkle tree for account: " + treeKeypair.publicKey
      );
    } catch (e) {
      console.error("Failed to create merkle tree: ", e);
      throw e;
    }
  };  

export const mintCompressedNft = async (
    connection: any,
    nftArgs: MetadataArgs,
    wallet: WalletContextState,
    treeKeypair: Keypair,
    collectionMint: any,
    collectionMetadata: PublicKey,
    collectionMasterEditionAccount: PublicKey
  ) => {
    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
      [treeKeypair.publicKey.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );
    const [bgumSigner, __] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_cpi", "utf8")],
      BUBBLEGUM_PROGRAM_ID
    );
    const mintIx = createMintToCollectionV1Instruction(
      {
        merkleTree: treeKeypair.publicKey,
        treeAuthority,
        treeDelegate: wallet.publicKey!,
        payer: wallet.publicKey!,
        leafDelegate: wallet.publicKey!,
        leafOwner: wallet.publicKey!,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        collectionAuthority: wallet.publicKey!,
        collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
        collectionMint: collectionMint.publicKey,
        collectionMetadata: collectionMetadata,
        editionAccount: collectionMasterEditionAccount,
        bubblegumSigner: bgumSigner,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      },
      {
        metadataArgs: Object.assign(nftArgs, {
          collection: { key: collectionMint.publicKey, verified: false },
        }),
      }
    );
    let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    const tx = new Transaction().add(mintIx);
    tx.feePayer = wallet.publicKey!;
    tx.recentBlockhash = blockhash;

    const { signTransaction } = wallet;
    //@ts-ignore
    const signedTransaction = await wallet.signTransaction(tx);
    console.log('User Signed')

    try {
      const sig = await connection.sendTransaction(
        signedTransaction,
        {maxRetries: 5}
      );
      return sig;
    } catch (e) {
      console.error("Failed to mint compressed NFT", e);
      throw e;
    }
  };
  
export const transferAsset = async (
    connection: any,
    owner: Keypair,
    newOwner: Keypair,
    assetId: string
  ) => {
    console.log(
      `Transfering asset ${assetId} from ${owner.publicKey.toBase58()} to ${newOwner.publicKey.toBase58()}. 
      This will depend on indexer api calls to fetch the necessary data.`
    );
    let assetProof = await connection.getAssetProof(assetId);
    if (!assetProof?.proof || assetProof.proof.length === 0) {
      throw new Error("Proof is empty");
    }
    let proofPath = assetProof.proof.map((node: string) => ({
      pubkey: new PublicKey(node),
      isSigner: false,
      isWritable: false,
    }));
    console.log("Successfully got proof path from RPC.");
  
    const rpcAsset = await connection.getAsset(assetId);
    console.log(
      "Successfully got asset from RPC. Current owner: " +
        rpcAsset.ownership.owner
    );
    if (rpcAsset.ownership.owner !== owner.publicKey.toBase58()) {
      throw new Error(
        `NFT is not owned by the expected owner. Expected ${owner.publicKey.toBase58()} but got ${
          rpcAsset.ownership.owner
        }.`
      );
    }
  
    const leafNonce = rpcAsset.compression.leaf_id;
    const treeAuthority = await getBubblegumAuthorityPDA(
      new PublicKey(assetProof.tree_id)
    );
    const leafDelegate = rpcAsset.ownership.delegate
      ? new PublicKey(rpcAsset.ownership.delegate)
      : new PublicKey(rpcAsset.ownership.owner);
    let transferIx = createTransferInstruction(
      {
        treeAuthority,
        leafOwner: new PublicKey(rpcAsset.ownership.owner),
        leafDelegate: leafDelegate,
        newLeafOwner: newOwner.publicKey,
        merkleTree: new PublicKey(assetProof.tree_id),
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        anchorRemainingAccounts: proofPath,
      },
      {
        root: bufferToArray(bs58.decode(assetProof.root)),
        dataHash: bufferToArray(
          bs58.decode(rpcAsset.compression.data_hash.trim())
        ),
        creatorHash: bufferToArray(
          bs58.decode(rpcAsset.compression.creator_hash.trim())
        ),
        nonce: leafNonce,
        index: leafNonce,
      }
    );
    const tx = new Transaction().add(transferIx);
    tx.feePayer = owner.publicKey;
    try {
      const sig = await connection.sendAndConfirmTransaction(
        connection,
        tx,
        [owner],
        {
          commitment: "confirmed",
          skipPreflight: true,
        }
      );
      return sig;
    } catch (e) {
      console.error("Failed to transfer compressed asset", e);
      throw e;
    }
  };
  
  export const redeemAsset = async (
    connection: any,
    owner: Keypair,
    assetId?: string
  ) => {
    let assetProof = await connection.getAssetProof(assetId);
    const rpcAsset = await connection.getAsset(assetId);
    const voucher = await getVoucherPDA(new PublicKey(assetProof.tree_id), 0);
    const leafNonce = rpcAsset.compression.leaf_id;
    const treeAuthority = await getBubblegumAuthorityPDA(
      new PublicKey(assetProof.tree_id)
    );
    const leafDelegate = rpcAsset.ownership.delegate
      ? new PublicKey(rpcAsset.ownership.delegate)
      : new PublicKey(rpcAsset.ownership.owner);
    const redeemIx = createRedeemInstruction(
      {
        treeAuthority,
        leafOwner: new PublicKey(rpcAsset.ownership.owner),
        leafDelegate,
        merkleTree: new PublicKey(assetProof.tree_id),
        voucher,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      },
      {
        root: bufferToArray(bs58.decode(assetProof.root)),
        dataHash: bufferToArray(
          bs58.decode(rpcAsset.compression.data_hash.trim())
        ),
        creatorHash: bufferToArray(
          bs58.decode(rpcAsset.compression.creator_hash.trim())
        ),
        nonce: leafNonce,
        index: leafNonce,
      }
    );
    const tx = new Transaction().add(redeemIx);
    tx.feePayer = owner.publicKey;
    try {
      const sig = await connection.sendAndConfirmTransaction(
        connection,
        tx,
        [owner],
        {
          commitment: "confirmed",
          skipPreflight: true,
        }
      );
      return sig;
    } catch (e) {
      console.error("Failed to redeem compressed asset", e);
      throw e;
    }
  };

export const createCompressedNFT = async(connection: any, wallet: WalletContextState, collection: any) => {
  const treeKeypair = Keypair.generate(); 
  console.log(wallet)
  const metadataArgs: MetadataArgs = {
    name: collection.name.slice(0,9),
    symbol: 'crumbs',
    uri: collection.uri,
    sellerFeeBasisPoints: collection.royalties,
    creators: [
        {
            address: wallet.publicKey!,
            verified: true,
            share: 100
        }
    ],
    collection: {
      verified: true,
      key: collection.address,
    },
    uses: null,
    isMutable: true,
    primarySaleHappened: false,
    tokenStandard: TokenStandard.NonFungibleEdition,
    tokenProgramVersion: TokenProgramVersion.Token2022,
    editionNonce: 0
  }

  await initTree(connection, wallet, treeKeypair);
  const sig = await mintCompressedNft(connection, metadataArgs, wallet, treeKeypair, collection.mintAddress, collection.metadataAddress, collection.masterTokenAddress)
  return sig;
}
