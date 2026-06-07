import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import trackImage from '../../image/trackImage.png';
import styles from './Player.module.css';

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function IconPrev() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
    </svg>
  );
}
function IconNext() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/>
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}
function IconPause() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  );
}
function IconVolume({ level }) {
  if (level === 0) return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
    </svg>
  );
  if (level < 0.5) return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  );
}

export default function Player() {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, isMuted, queue, queueIndex,
    togglePlay, next, prev, seek, changeVolume, toggleMute,
  } = usePlayer();

  if (!currentTrack) return null;

  const progress   = duration ? (currentTime / duration) * 100 : 0;
  const volDisplay = isMuted ? 0 : volume;
  const canPrev    = queueIndex > 0;
  const canNext    = queueIndex < queue.length - 1;

  return (
    <div className={styles.player}>

      {/* ── thin progress bar across the top ── */}
      <div className={styles.topBar}>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          style={{ '--fill': `${progress}%` }}
          className={styles.seekInput}
        />
      </div>

      <div className={styles.inner}>

        {/* ── track info ── */}
        <div className={styles.info}>
          <img
            src={currentTrack.image_url || trackImage}
            alt={currentTrack.title}
            className={styles.thumb}
          />
          <div className={styles.meta}>
            <span className={styles.trackTitle}>{currentTrack.title}</span>
            {currentTrack.genre && (
              <span className={styles.trackGenre}>{currentTrack.genre}</span>
            )}
          </div>
        </div>

        {/* ── controls ── */}
        <div className={styles.controls}>
          <button
            className={`${styles.ctrlBtn} ${!canPrev ? styles.ctrlDisabled : ''}`}
            onClick={prev}
            disabled={!canPrev}
            title="Попередній"
          >
            <IconPrev />
          </button>

          <button
            className={styles.playBtn}
            onClick={() => togglePlay(currentTrack, queue, queueIndex)}
            title={isPlaying ? 'Пауза' : 'Грати'}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          <button
            className={`${styles.ctrlBtn} ${!canNext ? styles.ctrlDisabled : ''}`}
            onClick={next}
            disabled={!canNext}
            title="Наступний"
          >
            <IconNext />
          </button>

          <span className={styles.time}>
            {fmt(currentTime)}<span className={styles.timeSep}> / </span>{fmt(duration)}
          </span>
        </div>

        {/* ── volume ── */}
        <div className={styles.volBlock}>
          <button className={styles.muteBtn} onClick={toggleMute} title="Вимкнути звук">
            <IconVolume level={volDisplay} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volDisplay}
            onChange={e => changeVolume(Number(e.target.value))}
            style={{ '--fill': `${volDisplay * 100}%` }}
            className={styles.volInput}
          />
        </div>

      </div>
    </div>
  );
}
