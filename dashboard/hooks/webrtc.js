import { useState, useEffect, useRef } from 'react';

/**
 *
 * @returns {RTCPeerConnection}
 */
const useWebRTCPeerConnection = () => {
  const [peer, setPeer] = useState(null);

  useEffect(() => {
    const p = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.google.com:19302' }
      ]
    });
    setPeer(p);
    return () => {
      p.close();
    };
  }, []);

  return peer;
};

/**
 *
 * @param peer {RTCPeerConnection|null}
 * @param roomId {string}
 */
const useIceCandidateStateChange = (peer, roomId) => {
  const requested = useRef(false);

  useEffect(() => {
    if (peer && roomId)
      peer.oniceconnectionstatechange = () => {
        console.log(peer.iceConnectionState);

        if (
          (!requested.current && peer.iceConnectionState === 'connected') ||
          'disconnected'
        ) {
          apiClearSdp(roomId).finally(() => (requested.current = true));
        }
      };
  }, [peer, roomId]);
};

/**
 *
 * @param peer {RTCPeerConnection|null}
 * @returns {boolean}
 */
const useIceCandidateNull = peer => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (peer)
      peer.onicecandidate = e => {
        if (e.candidate) return;
        setReady(true);
      };
  }, [peer]);

  return ready;
};

/**
 *
 * @param peer {RTCPeerConnection|null}
 * @param stream {MediaStream|null}
 */
const usePeerGotStream = (peer, stream) => {
  useEffect(() => {
    peer &&
      stream &&
      stream.getTracks().map(track => peer.addTrack(track, stream));
  }, [peer, stream]);
};

/**
 *
 * @param roomId {string}
 * @param sdp {RTCSessionDescription}
 * @param isJoin {boolean}
 * @returns {Promise<Response>}
 */
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

/**
 *
 * @param roomId {string}
 * @param isJoin {boolean}
 * @returns {Promise<Response>}
 */
const apiGetSdp = (roomId, isJoin = false) => {
  return fetch(
    `${process.env.apiUrl}/room/${roomId}${isJoin ? '?join=1' : ''}`
  );
};

/**
 *
 * @param roomId {string}
 * @returns {Promise<Response>}
 */
const apiClearSdp = roomId => {
  return fetch(`${process.env.apiUrl}/room/${roomId}`, {
    method: 'DELETE'
  });
};

/**
 *
 * @param roomId {string | null}
 * @param isJoin {boolean}
 * @param duration {number}
 * @returns {RTCSessionDescription}
 */
const useApiGetSdpInterval = (roomId, isJoin = false, duration = 5000) => {
  const [remoteSdp, setRemoteSdp] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await apiGetSdp(roomId, isJoin);
        if (!res.ok) return;
        const { sdp } = await res.json();

        setRemoteSdp(new RTCSessionDescription(sdp));
        clearInterval(intervalId);
      } catch (e) {
        console.error(e);
      }
    }, duration);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId, isJoin, duration]);

  return remoteSdp;
};

/**
 *
 * @param peer {RTCPeerConnection|null}
 * @param options {RTCOfferOptions|null}
 */
const useOffer = (peer, options) => {
  useEffect(() => {
    peer
      ?.createOffer(options)
      .then(offer => peer.setLocalDescription(offer))
      .catch(e => console.error(e));
  }, [peer]);
};

/**
 *
 * @param ready {boolean}
 * @param peer {RTCPeerConnection |null}
 * @param roomId {string | null}
 * @returns {boolean}
 */
const useOfferSend = (ready = false, peer, roomId) => {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!ready || !peer || !roomId) return;

    apiPutSdp(roomId, peer.localDescription, false)
      .then(res => {
        if (!res.ok) {
          console.error('put sdp error, ', res);
        } else {
          setOk(true);
        }
      })
      .catch(e => console.error(e));
  }, [ready, peer, roomId]);

  return ok;
};

/**
 *
 * @param peer {RTCPeerConnection}
 * @param remoteSdp {RTCSessionDescription}
 */
const useAnswer = (peer, remoteSdp) => {
  useEffect(() => {
    if (!peer || !remoteSdp) return;
    peer
      .setRemoteDescription(remoteSdp)
      .then(() => peer.createAnswer())
      .then(answer => peer.setLocalDescription(answer))
      .catch(e => console.error(e));
  }, [peer, remoteSdp]);
};

/**
 *
 * @param ready {boolean}
 * @param peer {RTCPeerConnection | null}
 * @param roomId {string}
 */
const useAnswerSend = (ready = false, peer, roomId) => {
  useEffect(() => {
    if (!ready || !peer || !roomId) return;

    const request = async () => {
      const res = await apiPutSdp(roomId, peer.localDescription, true);
      if (!res.ok) {
        console.error('send sdp error', res);
      }
    };

    request().catch(e => console.error(e));
  }, [ready, peer, roomId]);
};

/**
 *
 * @param peer {RTCPeerConnection | null}
 * @param videoRef {current: {HTMLVideoElement}}
 */
const usePlayRemoteTrack = (peer, videoRef) => {
  useEffect(() => {
    if (peer)
      peer.ontrack = e => {
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = e.streams?.[0];
      };

    return () => {
      videoRef.current.srcObject = null;
    };
  }, [peer, videoRef]);
};

/**
 *
 * @param constraints {MediaStreamConstraints|null}
 * @returns {MediaStream|null}
 */
const useMediaStream = constraints => {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    navigator?.mediaDevices
      ?.getUserMedia(constraints)
      .then(stream => setStream(stream))
      .catch(e => {
        console.error(`getUserMedia error: ${e}`);
        alert('get media error');
      });
  }, [constraints]);

  return stream;
};

/**
 *
 * @param videoRef {current: {HTMLVideoElement}}
 * @param stream {MediaStream|null}
 */
const usePlayLocalMediaStream = (videoRef, stream) => {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = null;
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
      stream?.getTracks().map(track => track.stop());
    };
  }, [videoRef, stream]);
};

const offerOptions = {
  offerToReceiveVideo: true,
  offerToReceiveAudio: true
};

/**
 *
 * @param videoRef {current: {HTMLVideoElement}}
 * @param roomId {string}
 */
export const useMasterUser = (videoRef, roomId) => {
  const peer = useWebRTCPeerConnection();
  useIceCandidateStateChange(peer, roomId);

  usePlayRemoteTrack(peer, videoRef);

  const gotCandidates = useIceCandidateNull(peer);
  useOffer(peer, offerOptions);

  const [offerSendRoomId, setOfferSendRoomId] = useState(null);
  const offerIsSend = useOfferSend(gotCandidates, peer, roomId);
  useEffect(() => {
    setOfferSendRoomId(roomId);
  }, [offerIsSend]);
  const remoteSdp = useApiGetSdpInterval(offerSendRoomId, false, 5000);
  useEffect(() => {
    if (!peer || !remoteSdp) return;
    peer.setRemoteDescription(remoteSdp).catch(e => console.error(e));
  }, [peer, remoteSdp]);
};

const joinUserMediaConstraints = {
  video: true,
  audio: true
};

/**
 *
 * @param videoRef {current: {HTMLVideoElement}}
 * @param roomId {string}
 */
export const useJoinUser = (videoRef, roomId) => {
  const peer = useWebRTCPeerConnection();
  useIceCandidateStateChange(peer, roomId);
  const gotCandidates = useIceCandidateNull(peer);

  const remoteSdp = useApiGetSdpInterval(roomId, true, 5000);
  useAnswer(peer, remoteSdp);
  useAnswerSend(gotCandidates, peer, roomId);

  const stream = useMediaStream(joinUserMediaConstraints);
  usePlayLocalMediaStream(videoRef, stream);
  usePeerGotStream(peer, stream);
};
