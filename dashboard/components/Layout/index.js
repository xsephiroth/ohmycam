import Head from 'next/head';

const Layout = ({ children }) => {
  return (
    <>
      <Head>
        <title>简单看 OhMyCam - WebRTC视频监控</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="简单看 OhMyCam - 基于浏览器WebRTC的视频监控工具，让你在内网环境中快速搭建使用的视频监控工具。"
        />
        <meta
          name="keywords"
          content="视频监控,内网视频监控,手机视频监控,WebRTC,webrtc,WebRTC监控,camera,surveillance"
        />
        <meta name="author" content="Eric Song" />
        <meta name="baidu-site-verification" content="tmkSSVwtrt" />
      </Head>
      {children}
    </>
  );
};

export default Layout;
