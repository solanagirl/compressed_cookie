import { Connection, PublicKey, TransactionMessage, VersionedTransaction, SystemProgram, Signer, TransactionInstruction, Keypair } from '@solana/web3.js';
import { createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToCheckedInstruction, TOKEN_PROGRAM_ID, MINT_SIZE } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction, createCreateMasterEditionV3Instruction, PROGRAM_ID} from '@metaplex-foundation/mpl-token-metadata';
import { Buffer } from 'buffer';
//@ts-ignore
import { Metaplex, toMetaplexFileFromBrowser, walletAdapterIdentity, bundlrStorage, BundlrStorageDriver } from '@metaplex-foundation/js';

async function createMasterNFT(wallet: any, pubkey:string, name: string, royalties: number, maxSupply: number, description: string, file: FileList, signTransaction: any) {
    window['Buffer'] = Buffer;
    const connection = new Connection(process.env.QN_DEVNET!)
    let Blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    const lastValidBlockHeight = (await connection.getBlockHeight('finalized'));
    const metaplex = new Metaplex(connection).use(walletAdapterIdentity(wallet)).use(bundlrStorage({
        address: 'https://devnet.bundlr.network/',
        providerUrl: process.env.QN_DEVNET,
        timeout: 6000,
    }));;
    const bundlr = metaplex.storage().driver() as BundlrStorageDriver;
    
    const mint = Keypair.generate();
    const mint_signer:Signer = mint;
    const creatorPubKey = new PublicKey(pubkey);
    const associatedTokenPubkey = await getAssociatedTokenAddress(mint.publicKey, creatorPubKey);

    const tokenPubkey = PublicKey.findProgramAddressSync(
        [ Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer()],
        PROGRAM_ID,
    )[0];

    const masterEditionPubKey = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer(), Buffer.from('edition')],
        PROGRAM_ID
    )[0];
    
    const token_transaction : TransactionInstruction[] = [];

    try {
        console.log('Create Image Metadata Instructions')


        const metaplexImage = await toMetaplexFileFromBrowser(file[0]);
        const price = await bundlr.getUploadPriceForFiles([metaplexImage])
        await bundlr.fund(price);
        const imageURI = await bundlr.upload(metaplexImage);  
        console.log(imageURI)

        const { uri } = await metaplex.nfts().uploadMetadata({
            name: name,
            description: description,
            image: imageURI,
            attributes: {
                email: 'true'
            }
        });
        
        
        console.log('Create Mint Account Instructions')
        const createMintAccountInstruction = SystemProgram.createAccount({
            fromPubkey: creatorPubKey,
            newAccountPubkey: mint.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
        });
        token_transaction.push(createMintAccountInstruction);
    
        console.log('Create Mint Instructions');
        const initializeMintInstruction = createInitializeMintInstruction(
            mint.publicKey,
            0,
            creatorPubKey,
            creatorPubKey,
        );
        token_transaction.push(initializeMintInstruction);
    
        console.log('Create Token Instruction')
        const initializeTokenInstruction = createAssociatedTokenAccountInstruction(
            creatorPubKey, 
            associatedTokenPubkey,
            creatorPubKey,
            mint.publicKey
        )
        token_transaction.push(initializeTokenInstruction);
    
        console.log('Create Mint to Token Instruction')
        const initializeMintToTokenInstruction = createMintToCheckedInstruction(
            mint.publicKey,
            associatedTokenPubkey,
            creatorPubKey,
            1,
            0
        )
        token_transaction.push(initializeMintToTokenInstruction);
    
        console.log('Create Metadata Account')
        const createV3MetadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: tokenPubkey,
                mint: mint.publicKey,
                mintAuthority: creatorPubKey,
                payer: creatorPubKey,
                updateAuthority: creatorPubKey,
            }, {
                createMetadataAccountArgsV3: {
                    data: {
                        name: name.slice(0,9),
                        symbol: 'crumbs',
                        uri: uri,
                        sellerFeeBasisPoints: royalties,
                        creators: [
                            {
                                address: creatorPubKey,
                                verified: true,
                                share: 100
                            }
                        ],
                        collection: null,
                        uses: null
                    },
                    isMutable: true,
                    collectionDetails: {
                        size: maxSupply,
                        __kind: 'V1'
                    }
                }
            }
        )
    
        token_transaction.push(createV3MetadataInstruction);
    
        console.log('Create Master Edition')
        const initializeMasterEditionV3Instruction = createCreateMasterEditionV3Instruction(
            {
              edition: masterEditionPubKey,
              mint: mint.publicKey,
              updateAuthority: creatorPubKey,
              mintAuthority: creatorPubKey,
              payer: creatorPubKey,
              metadata: tokenPubkey,
            },
            {
              createMasterEditionArgs: {
                maxSupply: maxSupply,
              },
            }
          )
      
        token_transaction.push(initializeMasterEditionV3Instruction);
    
        let blockheight = await connection.getBlockHeight();
        let V0Message;
        if (blockheight < lastValidBlockHeight) {
            V0Message = new TransactionMessage({
                payerKey: creatorPubKey,
                recentBlockhash: Blockhash,
                instructions: token_transaction
            }).compileToV0Message([]);            
        } else {
            Blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;

            V0Message = new TransactionMessage({
                payerKey: creatorPubKey,
                recentBlockhash: Blockhash,
                instructions: token_transaction
            }).compileToV0Message([]);    
        }

    
        const transaction = new VersionedTransaction(V0Message);
    
        const mintSign = transaction.sign([mint_signer]);
    
        console.log('Mint Account Signed');
    
        const mintPubkey = mint.publicKey
    
        const signedTransaction = await signTransaction(transaction, connection, {maxRetries: 5});
        console.log('User Signed')
    
        const signature = await connection.sendTransaction(signedTransaction, {maxRetries: 5});


        console.log(`Transaction signature: ${signature}`)
        return {signature, imageURI, mintPubkey, tokenPubkey, masterEditionPubKey};
    
    } catch (err) {
        console.log(err)
        throw new Error('An Error Occurred');
    }}
    
export { createMasterNFT }