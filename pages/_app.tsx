import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,minimal-ui"
      />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <Component {...pageProps} />
    </>
  );
}
