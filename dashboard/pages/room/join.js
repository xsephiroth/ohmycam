import { useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useJoinUser } from '../../hooks/webrtc';

const Join = () => {
  const {
    query: { roomId }
  } = useRouter();

  const videoRef = useRef(null);
  useJoinUser(videoRef, roomId);

  return (
    <Layout>
      <div>
        <div>{roomId}</div>
        <video ref={videoRef} playsInline autoPlay muted />
      </div>
    </Layout>
  );
};

export default Join;
