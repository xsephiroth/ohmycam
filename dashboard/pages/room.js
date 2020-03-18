import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import Layout from '../components/Layout';

const createPeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun1.google.com:19302' },
      { urls: 'stun:stun2.google.com:19302' }
    ]
  });
};

const apiPutSdp = (roomId, sdp, isJoin = false) => {
  const payload = { sdp };
  if (isJoin) {
    payload['join'] = true;
  }

  return fetch(`${process.env.apiUrl}/room/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

const apiGetSdp = (roomId, isJoin = false) => {
  return fetch(
    `${process.env.apiUrl}/room/${roomId}${isJoin ? '?join=1' : ''}`
  );
};

const useMasterUser = (roomId, player) => {
  useEffect(() => {
    if (!roomId || !player.current) return;

    let intervalId = 0;

    const peer = createPeerConnection();
    peer.oniceconnectionstatechange = () =>
      console.log(peer.iceConnectionState);

    const connectRemote = () => {
      intervalId = setInterval(async () => {
        try {
          const res = await apiGetSdp(roomId, false);

          if (!res.ok) return;

          // got remote response, no more interval check
          clearInterval(intervalId);

          const { sdp } = await res.json();
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log('got remote description');
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    };

    peer.onicecandidate = async e => {
      if (e.candidate === null) {
        try {
          const res = await apiPutSdp(roomId, peer.localDescription, false);

          if (!res.ok) {
            console.error(res.statusText);
            return;
          }

          connectRemote();
        } catch (e) {
          console.error(e);
        }
      }
    };

    peer.ontrack = e => {
      player.current.srcObject = null;
      player.current.srcObject = e.streams?.[0];
      player.current.autoplay = true;
    };

    peer
      .createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      .then(offer => peer.setLocalDescription(offer))
      .catch(err => {
        console.error('create offer error', err);
      });

    return () => {
      clearInterval(intervalId);
      peer.close();
      if (player.current) player.current.srcObject = null;
    };
  }, [roomId, player]);
};

const useJoinUser = (roomId, player) => {
  useEffect(() => {
    if (!roomId || !player.current) return;

    let intervalId = 0;

    const peer = createPeerConnection();
    peer.oniceconnectionstatechange = () =>
      console.log(peer.iceConnectionState);

    peer.onicecandidate = async e => {
      if (e.candidate === null) {
        apiPutSdp(roomId, peer.localDescription, true)
          .then(res => !res.ok && console.error(res.statusText))
          .catch(e => console.error(e));
      }
    };

    const connectRemote = () => {
      intervalId = setInterval(async () => {
        try {
          const res = await apiGetSdp(roomId, true);

          if (!res.ok) return;

          // got remote response, no more interval check
          clearInterval(intervalId);

          const { sdp } = await res.json();
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log('got remote description');

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    };

    let localStream;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => {
        player.current.srcObject = null;
        player.current.srcObject = stream;
        player.current.autoplay = true;

        stream.getTracks().map(track => peer.addTrack(track, stream));
        localStream = stream;
      })
      .then(connectRemote)
      .catch(e => {
        console.error(`getUserMedia error: ${e}`);
        alert('get media error');
      });

    return () => {
      clearInterval(intervalId);
      localStream && localStream.getTracks().map(track => track.stop());
      peer.close();
      if (player.current) player.current.srcObject = null;
    };
  }, [roomId, player]);
};

const Room = () => {
  const {
    query: { roomId, join }
  } = useRouter();

  const videoRef = useRef(null);

  if (!!join) {
    useJoinUser(roomId, videoRef);
  } else {
    useMasterUser(roomId, videoRef);
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
