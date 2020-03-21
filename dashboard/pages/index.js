import { useState } from 'react';
import Router from 'next/router';
import Layout from '../components/Layout';
import Button from '../components/Button';

const Home = () => {
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
      Router.push({ pathname: '/room/master', query: { roomId: data.roomId } });
    } catch (e) {
      console.error(e);
    }
  };

  const joinRoom = () => {
    Router.push({ pathname: '/room/join', query: { roomId } });
  };

  return (
    <Layout>
      <div>
        <input value={roomId} onChange={e => setRoomId(e.target.value)} />
        <Button onClick={createNewRoom}>Create</Button>
        <Button onClick={joinRoom}>Join</Button>
      </div>
    </Layout>
  );
};

export default Home;
