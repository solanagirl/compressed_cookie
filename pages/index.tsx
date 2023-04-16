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
    const { signature, imageURI, mintPubkey, tokenPubkey, masterEditionPubKey } = await createMasterNFT(wallet, publicKey, name, 0, maxSupply, description, file, signTransaction);
    console.log(signature)
    setUri(imageURI);
    setMintAddress(mintPubkey);
    setMetadataAddress(tokenPubkey);
    setMasterTokenAddress(masterEditionPubKey);
    if (signature) {
      setState('master_created')
    }
  }

  console.log(mintAddress);
  console.log(metadataAddress);
  console.log(masterTokenAddress);

  async function createCompressedCookie() {
    const sig = await createCompressedNFT(connection, wallet, collection);
  }

  switch (state) {
    case 'master':
      return (
        <div className=''>
          <Head>
            <title>NFT Cookie</title>
            <meta name="description" content="Solana compressed nft cookies" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          
          <main className='w-full h-screen flex flex-col gap-4 justify-center items-center bg-pink-200'>
          <div className='bg-white p-4 rounded-md'>
            <h1 className='text-2xl font-black tracking-wide'>Create Compressed NFT cookies</h1>
            <WalletMultiButton />
            <div className='w-full flex flex-row justify-center items-start gap-4'>
              <input type='text' placeholder='Cookie Name' onChange={(e) => setName(e.currentTarget.value)}/>
              <textarea className='rounded-2xl px-4 py-1 border-2 border-pink-300 shadow-xl' placeholder='Description' onChange={(e) => setDescription(e.currentTarget.value)}/>
              <input type='number' placeholder='Max Supply' onChange={(e) => setMaxSupply(parseInt(e.currentTarget.value))}/>
              <input type='file' onChange={(e) => setFile(e.currentTarget.files)} />
              <button className='w-fit h-fit bg-purple-200 px-2 rounded-l-full border-black border' type='submit' onClick={() => {createMaster()}}>Create Cookie Template</button>
            </div>
            </div>
          </main>
          </div>
        
      )
    case 'master_created':
      return (
        <div>
          <main className='w-full h-screen flex flex-col gap-4 justify-center items-center bg-pink-200'>
            <h1 className='text-2xl font-black tracking-wide'>Successfully created compressed NFT!</h1>
          </main>          
        </div>
      )
    
    default: 
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-purple-50" style={{backgroundImage: "url('../public/homepage_bg.jpg')"}}>
          <h1 className="text-4xl font-bold text-purple-900 mb-12">Welcome to Crumbs</h1>
          <div className='w-fit h-fit rounded-2xl cursor-pointer bg-purple-300 px-2 py-1 text-2xl mb-2' onClick={() => setState('master')}>Create Cookie Template</div>
          <div className="max-w-4xl mt-12 bg-purple-300 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Discover Decentralized Cookies</h2>
            <p className="text-gray-600">
              <span style={{fontWeight: 'bold', fontSize: '1.5em'}}>C</span> ryptographically-secure <br/>
              <span style={{fontWeight: 'bold', fontSize: '1.5em'}}>R</span> eusable <br/>
              <span style={{fontWeight: 'bold', fontSize: '1.5em'}}>U</span> nique <br/>
              <span style={{fontWeight: 'bold', fontSize: '1.5em'}}>M</span> etadata-based <br/>
              <span style={{fontWeight: 'bold', fontSize: '1.5em'}}>B</span> lockchain-backed on<br/>
              <span style={{fontWeight: 'bold', fontSize: '1.5em'}}>S</span> olana
            </p>

          </div>
        </div>
      ) 
  }
}

export default Home
