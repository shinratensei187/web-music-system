import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PostItem from '../Components/PostItem';
import TrackService from '../API/TrackService';
import autorPhoto from '../image/autorPhoto.png';
import '../styles/Home.css';

const GENRES = [
  { id: 'hiphop',     name: 'Хіп-хоп',    color: '#ec625f' },
  { id: 'trap',       name: 'Треп',        color: '#9b59b6' },
  { id: 'fonk',       name: 'Фонк',        color: '#f39c12' },
  { id: 'lofi',       name: 'Лоу-фай',     color: '#27ae60' },
  { id: 'rnb',        name: 'R&B',    color: '#2980b9' },
  { id: 'electronic', name: 'Електроніка', color: '#e91e8c' },
];

function GenreCard({ genre, onClick }) {
  return (
    <div
      className="genreCard"
      style={{ '--genreAccent': genre.color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div
        className="genreCardBg"
        style={{
          background: `radial-gradient(ellipse at center, ${genre.color}50 0%, transparent 70%)`,
        }}
      />
      <span className="genreCardName">{genre.name}</span>
    </div>
  );
}

function SectionHeader({ title, to, linkState }) {
  return (
    <div className="sectionHeader">
      <h2 className="sectionTitle">{title}</h2>
      {to && <Link to={to} state={linkState} className="sectionAllLink">Всі ›</Link>}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [showPlatforms, setShowPlatforms] = useState(false);

  const PLATFORMS = [
    {
      name: 'Spotify',
      url: 'https://open.spotify.com',
      color: '#1DB954',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.307a.748.748 0 01-1.029.249c-2.819-1.722-6.365-2.111-10.542-1.157a.748.748 0 01-.332-1.459c4.571-1.045 8.492-.595 11.655 1.338a.748.748 0 01.248 1.029zm1.472-3.276a.936.936 0 01-1.287.308c-3.226-1.983-8.143-2.557-11.958-1.399a.937.937 0 01-.543-1.791c4.358-1.322 9.776-.682 13.48 1.595a.936.936 0 01.308 1.287zm.127-3.409c-3.868-2.298-10.246-2.51-13.938-1.389a1.122 1.122 0 11-.651-2.147c4.243-1.287 11.298-1.039 15.752 1.607a1.122 1.122 0 01-1.163 1.929z"/>
        </svg>
      ),
    },
    {
      name: 'SoundCloud',
      url: 'https://soundcloud.com',
      color: '#FF5500',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1.175 12.225c-.015 0-.023.01-.023.025l-.312 2.017.312 1.99c0 .016.008.025.023.025s.023-.009.023-.025l.353-1.99-.353-2.017c0-.015-.008-.025-.023-.025zm.734-.272c-.02 0-.034.014-.034.033l-.268 2.256.268 2.2c0 .02.014.033.034.033s.034-.013.034-.033l.306-2.2-.306-2.256c0-.02-.014-.033-.034-.033zm.773-.112c-.024 0-.044.02-.044.044l-.224 2.368.224 2.278c0 .025.02.044.044.044s.044-.02.044-.044l.255-2.278-.255-2.368c0-.024-.02-.044-.044-.044zm.796-.043c-.03 0-.053.023-.053.053l-.18 2.411.18 2.337c0 .03.023.053.053.053s.053-.023.053-.053l.204-2.337-.204-2.411c0-.03-.023-.053-.053-.053zm.826.147c-.035 0-.063.028-.063.063l-.135 2.264.135 2.315c0 .035.028.063.063.063s.063-.028.063-.063l.154-2.315-.154-2.264c0-.035-.028-.063-.063-.063zm.854-.287c-.04 0-.072.032-.072.072l-.09 2.551.09 2.31c0 .04.032.072.072.072s.072-.032.072-.072l.103-2.31-.103-2.551c0-.04-.032-.072-.072-.072zm.882.019c-.044 0-.08.036-.08.08l-.047 2.532.047 2.3c0 .044.036.08.08.08s.08-.036.08-.08l.053-2.3-.053-2.532c0-.044-.036-.08-.08-.08zm5.63-3.876c-.201 0-.397.035-.58.099C10.01 4.62 8.88 3.52 7.49 3.52c-.358 0-.699.073-1.007.205-.116.047-.147.095-.148.139v8.18c.001.047.038.085.085.09h8.58c.046-.005.083-.044.083-.09V8.75c0-2.413-1.956-4.37-4.369-4.37zm5.623 1.693c-.604 0-1.172.154-1.668.424-.146-3.058-2.648-5.5-5.742-5.5a5.75 5.75 0 00-3.36 1.077c-.13.095-.164.206-.165.313v10.87c.001.11.09.2.201.2h10.734c.11 0 .2-.09.2-.2V12.3c0-1.994-1.617-3.613-3.611-3.613z"/>
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com',
      color: '#FF0000',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    TrackService.getAll()
      .then(res => {
        const data = res.data || [];
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setTracks(sorted);
      })
      .catch(() => {});
  }, []);

  const newReleases  = tracks.slice(0, 6);
  const cheapest     = [...tracks]
    .filter(t => t.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 6);

  return (
    <div className="homePage">

      {/* ── Hero ── */}
      <section className="homeHero">
        <h1 className="heroTitle">
          BuyMyBeats — Слухайте. Обирайте. Творіть.
        </h1>
        <div className="heroContent">
          <div className="heroLeft">
            <p className="heroDesc">
              Мене звати SHINRATENSEI&nbsp;&mdash; я бітмейкер та музичний продюсер з понад
              10-річним досвідом у створенні музики. За ці роки я пройшов шлях від перших
              експериментів зі звуком до формування власного впізнаваного почерку, який
              неможливо сплутати ні з ким іншим.
            </p>
            <p className="heroDesc">
              Я розробив власне фірмове звучання, яке поєднує сучасні тренди, чистий продакшн
              та сиру, неприборкану енергію. Для мене музика&nbsp;&mdash; це не просто набір
              звуків, а спосіб передати настрій, характер та історію кожного артиста, з яким
              я працюю.
            </p>
            <p className="heroDesc">
              Тут ви знайдете оригінальні біти, створені для артистів, які хочуть виділитися
              та звучати по-справжньому. Мій діапазон охоплює багато напрямків&nbsp;&mdash;
              від хіп-хопу та трепу до R&amp;B та експериментальних жанрів, тож кожен зможе
              знайти щось своє. Кожен трек створений з увагою до деталей, високоякісним
              зведенням та сильним відчуттям ритму, відточеним роками практики й постійного
              пошуку.
            </p>
            <p className="heroDesc">
              Я вірю, що правильний біт здатен повністю змінити трек&nbsp;&mdash; підкреслити
              сильні сторони голосу, задати темп і вдихнути життя в кожен рядок. Саме тому
              я ставлюся до кожного проєкту як до унікального, а не просто черговного замовлення.
            </p>

            <div className="heroBtns">
              <button
                className="heroCta"
                onClick={() => {
                  const target = document.getElementById('catalog-start').offsetTop;
                  const start = window.scrollY;
                  const distance = target - start;
                  const duration = 900;
                  let startTime = null;
                  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
                  const step = timestamp => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = Math.min((timestamp - startTime) / duration, 1);
                    window.scrollTo(0, start + distance * ease(elapsed));
                    if (elapsed < 1) requestAnimationFrame(step);
                  };
                  requestAnimationFrame(step);
                }}
              >
                Переглянути
              </button>
              <button
                className="heroCtaSecondary"
                onClick={() => setShowPlatforms(true)}
              >
                ♪ Слухати
              </button>
            </div>
          </div>
          <div className="heroRight">
            <img src={autorPhoto} alt="SHINRATENSEI" className="heroPhoto" />
          </div>
        </div>
      </section>

      {/* ── Популярні жанри ── */}
      <section id="catalog-start" className="homeSection">
        <SectionHeader title="Популярні жанри" />
        <div className="genreGrid">
          {GENRES.map(genre => (
            <GenreCard
              key={genre.id}
              genre={genre}
              onClick={() => navigate('/posts', { state: { genre: genre.name } })}
            />
          ))}
        </div>
      </section>

      {/* ── Нові релізи ── */}
      {newReleases.length > 0 && (
        <section className="homeTrackSection">
          <SectionHeader title="Нові релізи" to="/posts" linkState={{ sort: 'new' }} />
          <div className="trackGrid">
            {newReleases.map(track => (
              <PostItem
                key={track.id}
                post={track}
                queue={newReleases}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Доступні біти ── */}
      {cheapest.length > 0 && (
        <section className="homeTrackSection">
          <SectionHeader title="Доступні біти" to="/posts" linkState={{ sort: 'priceLow' }} />
          <div className="trackGrid">
            {cheapest.map(track => (
              <PostItem
                key={track.id}
                post={track}
                queue={cheapest}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Platform overlay ── */}
      {showPlatforms && (
        <div className="platformOverlay" onClick={() => setShowPlatforms(false)}>
          <div className="platformModal" onClick={e => e.stopPropagation()}>
            <button className="platformClose" onClick={() => setShowPlatforms(false)}>✕</button>
            <p className="platformModalTitle">Де слухати автора</p>
            <div className="platformList">
              {PLATFORMS.map(p => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platformBtn"
                >
                  <span className="platformIcon" style={{ color: p.color }}>{p.icon}</span>
                  <span className="platformName">{p.name}</span>
                  <span className="platformArrow">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
