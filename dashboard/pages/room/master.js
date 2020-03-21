import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import Layout from '../../components/Layout';
import { useMasterUser } from '../../hooks/webrtc';

const Master = () => {
  const {
    query: { roomId }
  } = useRouter();

  const videoRef = useRef(null);

  useMasterUser(videoRef, roomId);

  const [qrCode, setQRCode] = useState(null);
  useEffect(() => {
    QRCode.toDataURL(window.location.href.replace('master', 'join'))
      .then(url => setQRCode(url))
      .catch(e => console.error('generate QRCode error', e));
  }, []);

  return (
    <Layout>
      <div>
        <div>{roomId}</div>
        {qrCode && <img src={qrCode} alt="QRCode" />}
        <video ref={videoRef} autoPlay playsInline />
      </div>
    </Layout>
  );
};

export default Master;
