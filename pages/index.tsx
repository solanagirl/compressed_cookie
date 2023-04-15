import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { createCompressedNFT } from '../src/mint'
import { Connection, PublicKey } from '@solana/web3.js'
//@ts-ignore
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { createMasterNFT } from '../src/master'

const Home: NextPage = () => {
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [mintAddress, setMintAddress] = useState<PublicKey>();
  const [metadataAddress, setMetadataAddress] = useState<PublicKey>();
  const [masterTokenAddress, setMasterTokenAddress] = useState<PublicKey>();
  const [maxSupply, setMaxSupply] = useState(0);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<any>();
  const connection = new Connection(process.env.QN_DEVNET!);
  const { wallet, signTransaction } = useWallet();
  const collection = {
    name: name,
    uri: uri,
    mintAddress: mintAddress,
    metadataAddress: metadataAddress,
    masterTokenAddress: masterTokenAddress
  }

  async function createMaster() {
    const { signature, imageURI, mintPubkey, tokenPubkey, masterEditionPubKey  } = await createMasterNFT(wallet, name, 0, maxSupply, description, file, signTransaction);
    setUri(imageURI);
    setMintAddress(mintPubkey);
    setMetadataAddress(tokenPubkey);
    setMasterTokenAddress(masterEditionPubKey);

  }

  async function createCompressedCookie() {
    const sig = await createCompressedNFT(connection, wallet, collection);
  }

  console.log(collection)

  console.log(mintAddress);
  return (
    <div className=''>
      <Head>
        <title>NFT Cookie</title>
        <meta name="description" content="Solana compressed nft cookies" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className='w-full h-screen flex flex-col gap-4 justify-center items-center bg-pink-200'>
        <h1 className='text-2xl font-black tracking-wide'>Create Compressed NFT cookies</h1>
        <div className='w-full flex flex-row justify-center items-start gap-4'>
          <input type='text' placeholder='Cookie Name' onChange={(e) => setName(e.currentTarget.value)}/>
          <textarea className='rounded-2xl px-4 py-1 border-2 border-pink-300 shadow-xl' placeholder='Description' onChange={(e) => setDescription(e.currentTarget.value)}/>
          <input type='number' placeholder='Max Supply' onChange={(e) => setMaxSupply(parseInt(e.currentTarget.value))}/>
          <input type='file' onChange={(e) => setFile(e.currentTarget.files)} />
          <button className='w-fit h-fit bg-purple-200 px-2 rounded-l-full border-black border' type='submit' onClick={() => {createMaster()}}>Create Cookie Template</button>
        </div>
      </main>
    </div>
  )
}

export default Home
