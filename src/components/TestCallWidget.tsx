import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, ConnectionState, Track } from 'livekit-client';
import { getToken } from '../api';

type CallState = 'idle' | 'connecting' | 'connected' | 'error';

export default function TestCallWidget() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const roomRef = useRef<Room | null>(null);
  // Holds every <audio> element we create so we can clean them all up on hang-up.
  const audioElemsRef = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  async function startCall() {
    setErrorMsg('');
    setCallState('connecting');
    try {
      const { token, url } = await getToken();
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) setCallState('connected');
        if (state === ConnectionState.Disconnected) setCallState('idle');
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setSpeaking(speakers.some((p) => p.isLocal));
      });

      // livekit-client v2 auto-subscribes but does NOT attach tracks to the DOM.
      // We must call track.attach() ourselves to get audible playback.
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) return;
        const el = track.attach(); // creates <audio>, sets srcObject
        el.autoplay = true;
        audioElemsRef.current.push(el);
      });

      // Detach when the remote side stops sending (agent hangs up, etc.)
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) track.detach();
      });

      await room.connect(url, token);
      await room.startAudio();
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setCallState('error');
      roomRef.current = null;
    }
  }

  async function endCall() {
    await roomRef.current?.disconnect();
    roomRef.current = null;
    // Remove every <audio> element that was injected during the call.
    for (const el of audioElemsRef.current) {
      el.srcObject = null;
      el.remove();
    }
    audioElemsRef.current = [];
    setSpeaking(false);
    setCallState('idle');
  }

  const isConnected = callState === 'connected';
  const isConnecting = callState === 'connecting';

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Test Call</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Connect your browser microphone to speak with the agent live.
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isConnected
              ? speaking
                ? 'bg-green-400 animate-pulse'
                : 'bg-green-500'
              : isConnecting
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-gray-600'
          }`}
        />
        <span className="text-xs text-gray-400">
          {isConnected
            ? speaking
              ? 'You are speaking…'
              : 'Connected — say something'
            : isConnecting
              ? 'Connecting…'
              : callState === 'error'
                ? 'Error'
                : 'Not connected'}
        </span>
      </div>

      {callState === 'error' && (
        <p className="text-xs text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
          {errorMsg || 'Failed to connect. Make sure the backend exposes GET /token.'}
        </p>
      )}

      <button
        onClick={isConnected ? endCall : startCall}
        disabled={isConnecting}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isConnected
            ? 'bg-red-700 hover:bg-red-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {isConnected ? 'End Call' : isConnecting ? 'Connecting…' : 'Start Call'}
      </button>
    </div>
  );
}
