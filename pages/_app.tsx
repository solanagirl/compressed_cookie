import { useMemo } from 'react';
import '../styles/globals.css'
import type { AppProps } from 'next/app'
//@ts-ignore
import { SolflareWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
//@ts-ignore
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

function MyApp({ Component, pageProps }: AppProps) {
  const network = process.env.QN_DEVNET!;
  const endpoint = useMemo(() => network, [network]);

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new PhantomWalletAdapter()
    ],
    [network]
);


  return (
    <>
      <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets}>
            <WalletModalProvider>
              <Component {...pageProps} />
            </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  )
}

export default MyApp
