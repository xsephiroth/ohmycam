import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import Layout from '../components/Layout';
import { useMasterUser, useJoinUser } from '../hooks/webrtc';

const Room = () => {
  const {
    query: { roomId, join }
  } = useRouter();

  const videoRef = useRef(null);

  if (!!join) {
    useJoinUser(videoRef, roomId);
  } else {
    useMasterUser(videoRef, roomId);
  }

  const [qrCode, setQRCode] = useState(null);
  useEffect(() => {
    if (!join) {
      QRCode.toDataURL(`${window.location.href}&join=1`)
        .then(url => setQRCode(url))
        .catch(e => console.error('generate QRCode error', e));
    }
  }, [join]);

  return (
    <Layout>
      <div>
        <div>Room:{roomId}</div>
        {!join && qrCode && <img src={qrCode} alt="QRCode" />}
        <video
          ref={videoRef}
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          playsInline
        />
      </div>
    </Layout>
  );
};

export default Room;
