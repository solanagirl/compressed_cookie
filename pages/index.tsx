import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { createCompressedNFT } from '../src/mint'
import { Connection, PublicKey } from '@solana/web3.js'
//@ts-ignore
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { createMasterNFT } from '../src/master'
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Home: NextPage = () => {
  const [state, setState] = useState('');
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [mintAddress, setMintAddress] = useState<PublicKey>();
  const [metadataAddress, setMetadataAddress] = useState<PublicKey>();
  const [masterTokenAddress, setMasterTokenAddress] = useState<PublicKey>();
  const [maxSupply, setMaxSupply] = useState(0);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<any>();
  const connection = new Connection(process.env.QN_DEVNET!);
  const { publicKey, signTransaction } = useWallet();
  const wallet = useWallet();
  const collection = {
    name: name,
    uri: uri,
    mintAddress: mintAddress,
    metadataAddress: metadataAddress,
    masterTokenAddress: masterTokenAddress
  }

  async function createMaster() {
    wallet.connect();
    const { signature, imageURI, mintPubkey, tokenPubkey, masterEditionPubKey } = await createMasterNFT(wallet, publicKey!, name, 0, maxSupply, description, file, signTransaction);
    console.log(signature)
    setUri(imageURI);
    setMintAddress(mintPubkey);
    setMetadataAddress(tokenPubkey);
    setMasterTokenAddress(masterEditionPubKey);
    if (signature) {
      setState('created')
    }
    return signature;
  }
  
  async function createCompressedCookie() {
    const sig = await createCompressedNFT(connection, wallet, collection);
    console.log(sig);
  }

  async function create() {
    setState('loading');
    await createMaster();
    // await createCompressedCookie();
  }

  switch (state) {
    case 'loading': 
      return (
        <main className='w-full min-h-screen flex flex-col gap-4 justify-center items-center bg-[#d3d3d3]'>
            <div className='bg-gradient-to-r from-indigo-600 via-blue-500 to-green-400 animate-spin w-16 h-16 border-8 border-t-8 rounded-full'> </div>
            <div className="text-lg font-bold ml-4 py-4">Loading...</div>
        </main>
      )
    case 'created':
      return (
        <div>
          <main className='w-full h-screen flex flex-col gap-4 justify-center items-center bg-[#d3d3d3]'>
            <h1 className='text-2xl font-black tracking-wide'>Successfully created compressed NFT!</h1>
          </main>          
        </div>
      )
    default: 
      return (
        <div className=''>
          <Head>
            <title>NFT Cookie</title>
            <meta name="description" content="Solana compressed nft cookies" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <main className='w-full min-h-screen flex flex-col gap-4 justify-center items-center bg-[#d3d3d3]'>
            <h1 className='text-2xl font-black text-white text-4xl tracking-wide'>Compress a Cookie into Crumbs</h1>
            <div className='w-full lg:w-1/2 bg-pink-100 shadow-lg flex flex-col rounded-2xl justify-center items-center gap-4 py-8'>
              <input type='text' className='rounded-2xl px-4 py-1 my-1' placeholder='Cookie Name' onChange={(e) => setName(e.currentTarget.value)}/>
              <input type='number' className='rounded-2xl px-4 py-1 my-1' placeholder='Quantity' onChange={(e) => setMaxSupply(parseInt(e.currentTarget.value))}/>
              <textarea className='rounded-2xl px-6 py-1 my-1 border-0 h-3/5 border-pink-300 shadow-xl' placeholder='Description' onChange={(e) => setDescription(e.currentTarget.value)}/>
              <div className='inline-flex w-1/2 justify-between items-center'>
                <input type='file' className='my-4 px-1 py-1' onChange={(e) => setFile(e.currentTarget.files)} />
                <WalletMultiButton />
              </div>
              <button className='w-fit h-fit bg-[#dafab0] px-6 rounded-2xl py-2 border-black border-2 shadow-mint' type='submit' onClick={() => {create()}}>Compress</button>
            </div>
          </main>
        </div>
    )
  }
}

export default Home
