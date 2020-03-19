import { useState, useRef, useEffect } from 'react';

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
            p.close()
        }
    }, [])

    return peer
};

const useIceCandidateNull = peer => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        peer?.onicecandidate = e => {
            if (e.candidate) return;
            setReady(true);
        }
    }, [peer])

    return ready
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

const useApiGetSdpInterval = (roomId, isJoin = false, duration = 5000) => {
    const [remoteSdp, setRemoteSdp] = useState(null);

    useEffect(() => {
        let intervalId = 0;

        setInterval(() => {
            apiGetSdp(roomId, isJoin)
                .then(res => res.json())
                .then(({ sdp }) => {
                    setRemoteSdp(sdp)
                    // TODO
                })
                .catch(e => {
                })
        }, duration);

        return () => {
            clearInterval(intervalId);
        }
    }, [roomId, isJoin, duration])

    return remoteSdp
}

const useOffer = (peer, start = false) => {
    useEffect(() => {
        let intervalId = 0;

        const fn = async () => {
            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                await apiPutSdp('xxx', offer, false);

            } catch (e) {
                console.error(e);
            }
        }

        peer && start && fn();

        return () => {
            clearInterval(intervalId);
        }

    }, [peer, start])
}

const useAnswer = (peer, stream) => { }

const usePlayRemoteTrack = (peer, videoRef) => {
    useEffect(() => {
        peer?.ontrack = e => {
            videoRef.current.srcObject = null;
            videoRef.current.srcObject = e.streams?.[0];
            videoRef.current.autoplay = true;
        };

        return () => {
            videoRef.current.srcObject = null;
        }
    }, [peer, videoRef])
}

const useMediaStream = (videoRef, constraints) => {
    const [stream, setStream] = useState(null);

    useEffect(() => {
        navigator?.mediaDevices
            ?.getUserMedia(constraints)
            .then(stream => {
                videoRef.current.srcObject = null;
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                videoRef.current.autoplay = true;

                setStream(stream);

                // stream.getTracks().map(track => peer.addTrack(track, stream));
            })
            .catch(e => {
                console.error(`getUserMedia error: ${e}`);
                alert('get media error');
            });

        return () => {
            videoRef.current.srcObject = null;
            stream?.getTracks().map(track => track.stop());
        }
    }, [videoRef, constraints])

    return stream
}

const MasterUser = () => {
    const videoRef = useRef(null);
    const peer = useWebRTCPeerConnection();

    const isGotAllCandidate = useIceCandidateNull(peer);
    const answer = useOffer(peer, stream);
    usePlayRemoteTrack(peer, videoRef);

    const stream = useMediaStream(videoRef, { video: true, audio: true });
}

const JoinUser = () => {
    const videoRef = useRef(null);
    const peer = useWebRTCPeerConnection();

    const isGotAllCandidate = useIceCandidateNull(peer);
    const stream = useMediaStream(videoRef, { video: true, audio: true });
    useAnswer(peer, isGotAllCandidate);
}