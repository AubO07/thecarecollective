import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Connecting the Dots</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <iframe
        title="Connecting the Dots"
        src="/connecting-the-dots.html"
        style={{ border: 0, display: 'block', width: '100%', height: '100vh' }}
      />
    </>
  );
}
