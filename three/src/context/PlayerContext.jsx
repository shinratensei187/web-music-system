import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

const PlayerCtx = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue]               = useState([]);
  const [queueIndex, setQueueIndex]     = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolumeState]        = useState(0.8);
  const [isMuted, setIsMuted]           = useState(false);

  const queueRef      = useRef([]);
  const queueIndexRef = useRef(0);

  useEffect(() => { queueRef.current = queue; },      [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = 0.8;

    const onTime     = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(isNaN(audio.duration) ? 0 : audio.duration);
    const onPlay     = () => setIsPlaying(true);
    const onPause    = () => setIsPlaying(false);
    const onEnded    = () => {
      const q   = queueRef.current;
      const idx = queueIndexRef.current;
      if (idx < q.length - 1) {
        _startPlay(q[idx + 1], q, idx + 1);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate',      onTime);
    audio.addEventListener('durationchange',  onDuration);
    audio.addEventListener('play',            onPlay);
    audio.addEventListener('pause',           onPause);
    audio.addEventListener('ended',           onEnded);

    return () => {
      audio.removeEventListener('timeupdate',      onTime);
      audio.removeEventListener('durationchange',  onDuration);
      audio.removeEventListener('play',            onPlay);
      audio.removeEventListener('pause',           onPause);
      audio.removeEventListener('ended',           onEnded);
    };
  }, []);

  function _startPlay(track, q, idx) {
    const audio = audioRef.current;
    setCurrentTrack(track);
    setQueue(q);
    setQueueIndex(idx);
    setCurrentTime(0);
    setDuration(0);
    audio.src = track.demo_file_url || '';
    audio.play().catch(() => {});
  }

  function togglePlay(track, q = [], idx = 0) {
    const audio = audioRef.current;
    if (currentTrack?.id === track.id) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    } else {
      _startPlay(track, q, idx);
    }
  }

  function next() {
    const idx = queueIndexRef.current;
    const q   = queueRef.current;
    if (idx < q.length - 1) _startPlay(q[idx + 1], q, idx + 1);
  }

  function prev() {
    const audio = audioRef.current;
    const idx   = queueIndexRef.current;
    const q     = queueRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else if (idx > 0) {
      _startPlay(q[idx - 1], q, idx - 1);
    } else {
      audio.currentTime = 0;
    }
  }

  function seek(time) {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function changeVolume(vol) {
    audioRef.current.volume = vol;
    audioRef.current.muted  = false;
    setVolumeState(vol);
    setIsMuted(false);
  }

  function toggleMute() {
    const audio    = audioRef.current;
    audio.muted    = !audio.muted;
    setIsMuted(audio.muted);
  }

  function pause() {
    audioRef.current.pause();
  }

  return (
    <PlayerCtx.Provider value={{
      currentTrack, isPlaying, currentTime, duration,
      volume, isMuted, queue, queueIndex,
      togglePlay, next, prev, seek, changeVolume, toggleMute, pause,
    }}>
      {children}
    </PlayerCtx.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerCtx);
}
