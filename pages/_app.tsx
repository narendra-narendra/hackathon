import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Sweat Socks Society connects athletes for training sessions, local events, and community support." />
  <title>Sweat Socks Society</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
