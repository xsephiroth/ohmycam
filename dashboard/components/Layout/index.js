import Head from 'next/head';

const Layout = ({ children }) => {
  return (
    <>
      <Head>
        <title>Oh My Cam</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {children}
    </>
  );
};

export default Layout;
