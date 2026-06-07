import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PurchaseService from "../API/PurchaseService";
import API from "../API/api";
import Loader from "../Components/UI/loader/Loader";
import { AuthContext } from "../context";
import { usePlayer } from "../context/PlayerContext";

import "../styles/MyTracks.css";
import userIcon from "../image/userIcon.png";
import trackImage from "../image/trackImage.png";

export default function MyTracks() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { togglePlay, currentTrack, isPlaying } = usePlayer();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  async function secureDownload(track) {
    try {
      const response = await API.get(`/tracks/${track.id}/download`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = track.title || 'track'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Помилка завантаження файлу')
      console.error(e)
    }
  }

  const fetchMyTracks = async () => {
    try {
      setIsLoading(true);
      const response = await PurchaseService.getMyTracks();
      setTracks(response.data);
    } catch (e) {
      console.error("Помилка завантаження треків:", e);
      alert("Не вдалося завантажити ваші покупки.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTracks();
  }, []);

  const formatDate = (date) => {
    if (!date) return "невідомо";
    return new Date(date).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const nickname = user?.nickname || user?.email?.split("@")[0] || "Користувач";

  if (isLoading) {
    return (
      <div className="myTracksLoader">
        <Loader />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="myTracksPage">

        {/* Картка профілю */}
        <section className="profileCard" onClick={() => navigate("/profile")}>
          <img
            src={user?.avatar_url || userIcon}
            alt="Профіль"
            className="profileAvatar"
          />
          <h2 className="profileName">{nickname}</h2>
          <button
            className="profileButton"
            onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Редагувати профіль
          </button>
        </section>

        {/* Секція покупок */}
        <section className="purchasesSection">
          <div className="purchaseHeader">
            <h2 className="purchaseTitle">Ваші покупки</h2>
          </div>

          {tracks.length === 0 ? (
            <h3 className="emptyTracks">У вас ще немає куплених треків</h3>
          ) : (
            <div className="trackGridMyTracks">
              {tracks.map((track) => (
                <article className="trackCard" key={track.id}>
                  <div
                    className="trackImageBox"
                    onClick={() => navigate(`/posts/${track.id}`)}
                  >
                    <img
                      src={track.image_url || trackImage}
                      alt={track.title}
                      className="trackImage"
                    />
                    <button
                      className={`playButton ${currentTrack?.id === track.id && isPlaying ? "isPlaying" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (track.demo_file_url) togglePlay(track, tracks, tracks.findIndex(t => t.id === track.id));
                      }}
                    >
                      <span className={currentTrack?.id === track.id && isPlaying ? "pauseIcon" : "playIcon"}>
                        {currentTrack?.id === track.id && isPlaying ? "⏸" : "▶"}
                      </span>
                    </button>
                  </div>

                  <div className="trackTitleWrapper">
                    <div className="trackTitleTrack">
                      <span className="trackTitleText">{track.title}</span>
                    </div>
                  </div>

                  <p className="licenseText">
                    Придбано: {formatDate(track.purchased_at)}
                  </p>

                  <div className="trackActions">
                    <button
                      className="priceButton"
                      onClick={() => navigate(`/posts/${track.id}`)}
                    >
                      Детальніше
                    </button>
                    <button
                      className="priceButton downloadButton"
                      onClick={() => secureDownload(track)}
                      disabled={!track.full_file_url}
                    >
                      Завантажити
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
