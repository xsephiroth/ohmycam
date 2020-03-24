import { useState } from 'react';
import Router from 'next/router';
import Layout from '../components/Layout';
import Button from '../components/Button';

import styles from './index.module.scss';

const Home = () => {
  const [isJoinUser, setIsJoinUser] = useState(false);
  const [roomId, setRoomId] = useState('');

  const createNewRoom = async () => {
    try {
      const res = await fetch(`${process.env.apiUrl}/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      await Router.push({
        pathname: '/room/master',
        query: { roomId: data.roomId }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const joinRoom = async () => {
    await Router.push({ pathname: '/room/join', query: { roomId } });
  };

  return (
    <Layout>
      <div className={styles.Container}>
        <div className={styles.Wrapper}>
          <div className={styles.Left}>
            {isJoinUser ? (
              <>
                <img src="/aperture-art-blur-camera-414781.jpg" alt="join" />
                <h5>开启摄像头，成为内网监控设备</h5>
              </>
            ) : (
                <>
                  <img
                    src="/design-templates-on-a-flat-screen-computer-monitor-1714202.jpg"
                    alt="watch"
                  />
                  <h5>创建房间，接入内网监控设备</h5>
                </>
              )}
          </div>
          <div className={styles.UserForm}>
            {isJoinUser ? (
              <>
                <input
                  className={styles.RoomIdInput}
                  placeholder="房间ID"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                />
                <Button onClick={joinRoom}>加入</Button>
                <a onClick={() => setIsJoinUser(false)}>创建房间?</a>
              </>
            ) : (
                <>
                  <Button onClick={createNewRoom}>创建</Button>
                  <a onClick={() => setIsJoinUser(true)}>加入房间?</a>
                </>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
