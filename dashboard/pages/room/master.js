import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import classNames from 'classnames/bind';
import Layout from '../../components/Layout';
import IceStateIcon from '../../components/IceStateIcon';
import { useMasterUser } from '../../hooks/webrtc';

import styles from './room.module.scss';

const cx = classNames.bind(styles);

const Master = () => {
  const {
    query: { roomId }
  } = useRouter();

  const videoRef = useRef(null);

  const { iceConnectionState } = useMasterUser(videoRef, roomId);

  const [joinHref, setJoinHref] = useState('');
  useEffect(() => {
    setJoinHref(window.location.href.replace('master', 'join'));
  }, []);

  const handleRoomIdCopy = () => {
    navigator.clipboard
      .writeText(joinHref)
      .then(() => console.log('copied'))
      .catch(e => console.error(e));
  };

  const [qrCode, setQRCode] = useState(null);
  useEffect(() => {
    if (!joinHref) return;
    QRCode.toDataURL(joinHref)
      .then(url => setQRCode(url))
      .catch(e => console.error('generate QRCode error', e));
  }, [joinHref]);

  const [canplay, setCanplay] = useState(false);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('canplay', () => {
        setQRCode(null);
        setCanplay(true);
      });
    }
  }, [videoRef]);

  return (
    <Layout>
      <div className={styles.Container}>
        <div className={cx({ Box: true, Box__Playing: canplay })}>
          <IceStateIcon
            className={cx('IceStateIcon')}
            waiting={iceConnectionState === ''}
            checking={iceConnectionState === 'checking'}
            connected={iceConnectionState === 'connected'}
            disconnected={iceConnectionState === 'disconnected'}
          />
          {qrCode && (
            <div>
              <img className={styles.QRCode} src={qrCode} alt="QRCode" />
              <p className={styles.RoomId} onClick={handleRoomIdCopy}>
                {roomId}
                <i />
              </p>
            </div>
          )}
          <video
            className={cx({ Video: true, Video__Playing: canplay })}
            ref={videoRef}
            autoPlay
            playsInline
          />
        </div>
      </div>
    </Layout>
  );
};

export default Master;
