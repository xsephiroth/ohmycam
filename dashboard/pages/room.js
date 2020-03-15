import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const Room = () => {
  const {
    query: { roomId, join }
  } = useRouter();
  console.log(roomId, join);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const localPeer = useRef();
  const localStream = useRef();

  const getRemoteSdp = useCallback(async () => {
    const res = await fetch(
      `${process.env.apiUrl}/room/${roomId}${join ? '?join=1' : ''}`,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    if (res.status !== 200) {
      return null;
    }
    const { sdp } = await res.json();
    return sdp;
  }, [roomId, join]);

  // create session description
  useEffect(() => {
    let getRemoteSdpIntervalId = 0;

    if (!roomId) return;

    const onIceCandidate = async (e) => {
      console.log(e);
      if (e.candidate === null) {
        // send local sdp to server
        try {
          const putRres = await fetch(
            `${process.env.apiUrl}/room/${roomId}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sdp: localPeer.current.localDescription,
                join
              })
            }
          );
          if (putRres.status !== 204) {
            console.log('put sdp failed');
            return;
          }

          let remoteSdp = await getRemoteSdp();
          if (remoteSdp) {
            localPeer.current
              .setRemoteDescription(new RTCSessionDescription(rSdp))
              .then(() => console.log('set remote description success'))
              .catch(e => console.error(err));
          } else {
            getRemoteSdpIntervalId = setInterval(() => {
              getRemoteSdp().then(rSdp => {
                if (rSdp) {
                  clearInterval(getRemoteSdpIntervalId);
                  localPeer.current
                    .setRemoteDescription(new RTCSessionDescription(rSdp))
                    .then(() => console.log('set remote description success'))
                    .catch(e => console.error(err));
                }
              });
            }, 5000);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    const run = async () => {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        localVideoRef.current.srcObject = localStream.current;
        localVideoRef.current.autoplay = true;
      } catch (e) {
        console.error(`getUserMedia() error: ${e}`);
        alert('get media error');
        return;
      }

      localPeer.current = new RTCPeerConnection();
      localPeer.current.addEventListener('track', e => {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.autoplay = true;
      });
      localPeer.current.addEventListener('icecandidate', onIceCandidate);

      localStream.current
        .getTracks()
        .map(track => localPeer.current.addTrack(track, localStream.current));

      const localSdp = await localPeer.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      localPeer.current.setLocalDescription(localSdp);
    };

    run().catch();

    return () => {
      clearInterval(getRemoteSdpIntervalId);
      localPeer.current &&
        localPeer.current.removeEventListener('icecandidate', onIceCandidate);
      localPeer.current && localPeer.current.close();
    };
  }, [roomId]);

  return (
    <Layout>
      <div>
        <div>Room:{roomId}</div>
        <video
          ref={localVideoRef}
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          muted
        ></video>
        <video
          ref={remoteVideoRef}
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          muted
        ></video>
      </div>
    </Layout>
  );
};

export default Room;
