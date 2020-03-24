import { useState } from 'react';
import Router from 'next/router';
import Layout from '../components/Layout';
import Button from '../components/Button';

import styles from './index.module.scss';

const Home = () => {
  const [joinUser, setJoinUser] = useState(false);
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
          <div className={styles.Left}>hello</div>
          <div className={styles.UserForm}>
            {joinUser ? (
              <>
                <input
                  className={styles.RoomIdInput}
                  placeholder="房间ID"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                />
                <Button onClick={joinRoom}>加入</Button>
                <a onClick={() => setJoinUser(false)}>创建房间?</a>
              </>
            ) : (
              <>
                <Button onClick={createNewRoom}>创建</Button>
                <a onClick={() => setJoinUser(true)}>加入房间?</a>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
