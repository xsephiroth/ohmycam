import { useRef } from 'react';
import { useRouter } from 'next/router';
import classNames from 'classnames/bind';
import Layout from '../../components/Layout';
import { useJoinUser } from '../../hooks/webrtc';

import styles from './room.module.scss';

const cx = classNames.bind(styles);

const Join = () => {
  const {
    query: { roomId }
  } = useRouter();

  const videoRef = useRef(null);
  useJoinUser(videoRef, roomId);

  return (
    <Layout>
      <div className={styles.Container}>
        <div className={cx({ Box: true, Box__Playing: true })}>
          <video
            className={cx({ Video: true, Video__Playing: true })}
            ref={videoRef}
            playsInline
            autoPlay
            muted
          />
        </div>
      </div>
    </Layout>
  );
};

export default Join;
