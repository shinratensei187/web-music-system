import AdminUserService from "../API/AdminUserService";
import React, { useEffect, useState, useContext } from "react";
import TrackService from "../API/TrackService";
import MyButton from "../Components/UI/button/MyButton";
import MyInput from "../Components/UI/input/MyInput";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context";
import "../styles/AdminTracks.css";
import AdminStatsService from "../API/AdminStatsService";
import {translateGenre,translateMood,translateKey} from "../utils/trackTranslations";

const emptyTrack = {
  title: "",
  genre: "",
  mood: [],
  bpm: "",
  key: "",
  price: "",
  duration: "",
  image_url: "",
  demo_file_url: "",
  full_file_url: "",
  description: ""
};

const emptyPeriod = { unique_buyers: 0, total_income: 0, sold_tracks: 0, top_tracks: [] };

export default function AdminTracks() {
  const navigate = useNavigate();
  const { setIsAuth, setUser } = useContext(AuthContext);

  const [tracks, setTracks] = useState([]);
  const [users, setUsers] = useState([]);
  const [trackSearch, setTrackSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [stats, setStats] = useState({
    periods: { day: emptyPeriod, week: emptyPeriod, month: emptyPeriod, total: emptyPeriod }
  });
  const [topPeriod, setTopPeriod] = useState("total");
  const [form, setForm] = useState(emptyTrack);
  const [editId, setEditId] = useState(null);
  const [demoFile, setDemoFile] = useState(null);
  const [fullFile, setFullFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  async function fetchUsers() {
    try {
      const response = await AdminUserService.getAll();
      setUsers(response.data);
    } catch (e) {
      console.log(e.response?.data || e);
    }
  }

  async function toggleUserBlock(id) {
    try {
      await AdminUserService.toggleBlock(id);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.detail || "Помилка блокування користувача");
    }
  }

  async function fetchStats() {
    try {
      const response = await AdminStatsService.getStats();
      setStats(response.data);
    } catch (e) {
      console.log(e.response?.data || e);
    }
  }

  async function deleteUser(id) {
    const isConfirm = window.confirm("Видалити користувача?");

    if (!isConfirm) return;

    try {
      await AdminUserService.delete(id);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.detail || "Помилка видалення користувача");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    localStorage.removeItem("user");

    setIsAuth(false);
    setUser(null);

    navigate("/login");
  }

  async function fetchTracks() {
    const response = await TrackService.getAdminInfo();
    setTracks(response.data);
  }

  useEffect(() => {
    fetchTracks();
    fetchUsers();
    fetchStats();
  }, []);

  function changeForm(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function parseDuration(val) {
    if (!val) return null;
    const str = String(val).trim();
    if (str.includes(':')) {
      const [m, s] = str.split(':').map(Number);
      if (isNaN(m) || isNaN(s)) return null;
      return m * 60 + s;
    }
    const n = Number(str);
    return isNaN(n) || n <= 0 ? null : n;
  }

  function handleDurationChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (!digits) {
      setForm(prev => ({ ...prev, duration: '' }));
      return;
    }
    const formatted = digits.length <= 2
      ? digits
      : `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`;
    setForm(prev => ({ ...prev, duration: formatted }));
  }

  function toggleMood(selectedMood) {
    setForm(prevForm => {
      const currentMoods = Array.isArray(prevForm.mood) ? prevForm.mood : [];

      if (currentMoods.includes(selectedMood)) {
        return {
          ...prevForm,
          mood: currentMoods.filter(m => m !== selectedMood)
        };
      }

      return {
        ...prevForm,
        mood: [...currentMoods, selectedMood]
      };
    });
  }

  async function saveTrack(e) {
    e.preventDefault();

    const moodValue = Array.isArray(form.mood)
      ? form.mood.join(", ")
      : form.mood;

    if (!form.price || Number(form.price) <= 0) {
      alert("Вкажіть коректну ціну");
      return;
    }

    const durSeconds = parseDuration(form.duration);
    if (form.duration && (!durSeconds || durSeconds <= 0)) {
      alert("Вкажіть коректну тривалість у форматі хв:сс (наприклад 3:45)");
      return;
    }

    if (!editId && (!demoFile || !fullFile)) {
      alert("Завантажте demo файл і повний трек");
      return;
    }

    try {
      if (editId) {
        const trackData = {
          ...form,
          mood: moodValue,
          bpm: form.bpm ? Number(form.bpm) : null,
          price: Number(Number(form.price).toFixed(2)),
          duration: durSeconds
        };

        await TrackService.update(editId, trackData);
      } else {
        const formData = new FormData();

        formData.append("title", form.title);
        formData.append("genre", form.genre);
        formData.append("mood", moodValue);
        formData.append("bpm", form.bpm || "");
        formData.append("key", form.key);
        formData.append("price", Number(Number(form.price).toFixed(2)));
        formData.append("duration", durSeconds || "");
        formData.append("description", form.description || "");
        formData.append("demo_file", demoFile);
        formData.append("full_file", fullFile);

        if (imageFile) {
          formData.append("image_file", imageFile);
        }

        await TrackService.createWithFiles(formData);
      }

      setForm(emptyTrack);
      setDemoFile(null);
      setFullFile(null);
      setImageFile(null);
      setEditId(null);

      fetchTracks();
      fetchStats();
    } catch (e) {
      console.log(e.response?.data || e);
      alert("Помилка: " + JSON.stringify(e.response?.data));
    }
  }

  const genres = [
    "Фонк",
    "Хіп-хоп",
    "Треп",
    "Лоу-фай",
    "Поп",
    "Рок",
    "Електроніка",
    "Хаус",
    "Техно",
    "R&B"
  ];

  const moods = [
    "Темний",
    "Сумний",
    "Веселий",
    "Агресивний",
    "Розслаблений",
    "Енергійний",
    "Меланхолійний",
    "Романтичний",
    "Епічний",
    "Спокійний"
  ];

  const keys = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
    "Cm",
    "C#m",
    "Dm",
    "D#m",
    "Em",
    "Fm",
    "F#m",
    "Gm",
    "G#m",
    "Am",
    "A#m",
    "Bm"
  ];

  function startEdit(track) {
    setEditId(track.id);

    setForm({
      title: track.title || "",
      genre: translateGenre(track.genre),
      mood: track.mood
        ? track.mood.split(", ").map(mood => translateMood(mood))
        : [],
      bpm: track.bpm || "",
      key: translateKey(track.key),
      price: track.price || "",
      duration: track.duration
        ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`
        : "",
      image_url: track.image_url || "",
      demo_file_url: track.demo_file_url || "",
      full_file_url: track.full_file_url || "",
      description: track.description || ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function deleteTrack(id) {
    const isConfirm = window.confirm("Видалити трек?");

    if (!isConfirm) return;

    try {
      await TrackService.delete(id);

      fetchTracks();
      fetchStats();
    } catch (e) {
      console.log("Помилка видалення треку:", e);
      console.log("Response:", e.response);
      console.log("Message:", e.message);

      alert(
        e.response?.data?.detail ||
        e.message ||
        "Помилка видалення треку"
      );
    }
  }

  function formatPrice(price) {
    return `${Number(price).toFixed(2)}₴`;
  }

  function formatLastSeen(lastSeen) {
    if (!lastSeen) return null;
    return new Date(lastSeen).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const filteredTracks = tracks.filter(t => {
    const q = trackSearch.toLowerCase();
    return !q || t.title?.toLowerCase().includes(q) || t.genre?.toLowerCase().includes(q);
  });

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return !q ||
      u.name?.toLowerCase().includes(q) ||
      u.nickname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="adminPage">
      <div className="adminContainer">
        <div className="adminHeader">
          <div>
            <p className="adminSubtitle">Керування каталогом</p>
            <h1 className="adminTitle">Адмін-панель треків</h1>
          </div>

          <button className="adminLogoutBtn" onClick={logout}>
            Вийти
          </button>
        </div>

        <div className="adminLayout">
          <form className="adminForm adminFixedPanel" onSubmit={saveTrack}>
            <div className="adminFormHeader">
              <h2>{editId ? "Редагування треку" : "Додавання треку"}</h2>
              <p>
                Заповніть інформацію про трек, додайте файли та збережіть зміни.
              </p>
            </div>

            <div className="adminField">
              <label>Назва треку</label>
              <MyInput
                name="title"
                placeholder="Наприклад: Midnight Phonk"
                value={form.title}
                onChange={changeForm}
              />
            </div>

            <div className="adminFieldsGrid">
              <div className="adminField">
                <label>Жанр</label>
                <select
                  className="adminSelect"
                  name="genre"
                  value={form.genre}
                  onChange={changeForm}
                >
                  <option value="">Оберіть жанр</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="adminField">
                <label>Тональність</label>
                <select
                  className="adminSelect"
                  name="key"
                  value={form.key}
                  onChange={changeForm}
                >
                  <option value="">Оберіть тональність</option>
                  {keys.map(k => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adminField">
              <label>Настрій</label>

              <div className="adminMoodList">
                {moods.map(mood => {
                  const isSelected =
                    Array.isArray(form.mood) && form.mood.includes(mood);

                  return (
                    <button
                      type="button"
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={
                        isSelected
                          ? "adminMoodBtn adminMoodBtnActive"
                          : "adminMoodBtn"
                      }
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="adminFieldsGrid">
              <div className="adminField">
                <label>Темп</label>
                <MyInput
                  name="bpm"
                  placeholder="Наприклад: 140"
                  value={form.bpm}
                  onChange={changeForm}
                />
              </div>

              <div className="adminField">
                <label>Ціна</label>
                <MyInput
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="700"
                  value={form.price}
                  onChange={changeForm}
                />
              </div>
            </div>

            <div className="adminField">
              <label>Тривалість (хв:сс)</label>
              <MyInput
                name="duration"
                type="text"
                placeholder="0:00"
                value={form.duration}
                onChange={handleDurationChange}
              />
            </div>

            <div className="adminField">
              <label>
                Опис треку
                <span className={`adminCharCount ${form.description.length > 480 ? "adminCharCountWarn" : ""}`}>
                  {form.description.length}/500
                </span>
              </label>
              <textarea
                className="adminTextarea"
                name="description"
                placeholder="Розкажіть про трек..."
                value={form.description}
                onChange={changeForm}
                maxLength={500}
                rows={4}
              />
            </div>

            <div className="adminFilesGrid">
              <div className="adminFileBox">
                <span>Обкладинка</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                />
              </div>

              <div className="adminFileBox">
                <span>Demo файл</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => setDemoFile(e.target.files[0])}
                />
              </div>

              <div className="adminFileBox">
                <span>Повний файл</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => setFullFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="adminFormActions">
              <MyButton>
                {editId ? "Зберегти зміни" : "Додати трек"}
              </MyButton>

              {editId && (
                <button
                  type="button"
                  className="adminCancelBtn"
                  onClick={() => {
                    setEditId(null);
                    setForm(emptyTrack);
                    setDemoFile(null);
                    setFullFile(null);
                    setImageFile(null);
                  }}
                >
                  Скасувати
                </button>
              )}
            </div>
          </form>

          <div className="adminTrackListWrapper">
          <div className="adminTrackList adminFixedPanel">
            <div className="adminListHeader">
              <div>
                <p className="adminSubtitle">Каталог</p>
                <h2>Список треків</h2>
              </div>

              <span className="adminCounter">{filteredTracks.length}</span>
            </div>

            <div className="adminSearchBox">
              <input
                className="adminSearchInput"
                type="text"
                placeholder="Пошук за назвою або жанром..."
                value={trackSearch}
                onChange={e => setTrackSearch(e.target.value)}
              />
            </div>

            {filteredTracks.length === 0 ? (
              <div className="adminEmpty">
                {trackSearch ? "Нічого не знайдено." : "Поки що треків немає."}
              </div>
            ) : (
              <div className="adminTrackScroll">
                {filteredTracks.map(track => (
                  <div className={`adminTrackItem ${track.is_sold ? "adminTrackSold" : ""}`} key={track.id}>
                    <div className="adminTrackTitleRow">
                      <h3
                        title={track.title}
                        className="adminTrackTitleLink"
                        onClick={() => navigate(`/posts/${track.id}`)}
                      >
                        {track.title}
                      </h3>
                      {track.is_sold
                        ? <span className="adminSoldBadge">Продано</span>
                        : <span className="adminAvailableBadge">Доступний</span>
                      }
                    </div>

                    <div className="adminTrackInfo">
                      <div className="adminTrackMeta">
                        <span>{translateGenre(track.genre)}</span>
                        <span>{track.bpm ? `${track.bpm} BPM` : "BPM не вказано"}</span>
                        <span>{formatPrice(track.price)}</span>
                      </div>

                      {track.is_sold && track.buyer && (
                        <div className="adminTrackBuyer">
                          <span>Покупець: </span>
                          <strong>{track.buyer.nickname || track.buyer.name || track.buyer.email}</strong>
                          <span className="adminTrackBuyerEmail"> ({track.buyer.email})</span>
                        </div>
                      )}
                    </div>

                    <div className="adminTrackActions">
                      <button
                        className="adminEditBtn"
                        onClick={() => startEdit(track)}
                      >
                        Редагувати
                      </button>

                      <button
                        className="adminDeleteBtn"
                        onClick={() => deleteTrack(track.id)}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="adminStatsSection">
          <div className="adminListHeader">
            <div>
              <p className="adminSubtitle">Аналітика продажів</p>
              <h2>Статистика магазину</h2>
            </div>
            <div className="adminPeriodTabs">
              {[
                { key: "day",   label: "День" },
                { key: "week",  label: "Тиждень" },
                { key: "month", label: "Місяць" },
                { key: "total", label: "Підсумок" }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`adminPeriodTab ${topPeriod === key ? "adminPeriodTabActive" : ""}`}
                  onClick={() => setTopPeriod(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="adminStatsGrid">
            <div className="adminStatCard">
              <span>Унікальних покупців</span>
              <strong>{stats.periods[topPeriod]?.unique_buyers ?? 0}</strong>
            </div>

            <div className="adminStatCard">
              <span>Загальний дохід</span>
              <strong>{formatPrice(stats.periods[topPeriod]?.total_income ?? 0)}</strong>
            </div>

            <div className="adminStatCard">
              <span>Продано треків</span>
              <strong>{stats.periods[topPeriod]?.sold_tracks ?? 0}</strong>
            </div>
          </div>

          <div className="adminTopTracks">
            <div className="adminTopTracksHeader">
              <h3>Топ продажів</h3>
            </div>

            {(stats.periods[topPeriod]?.top_tracks || []).length === 0 ? (
              <div className="adminEmpty">
                Продажів за цей період немає.
              </div>
            ) : (
              (stats.periods[topPeriod]?.top_tracks || []).map((track, index) => (
                <div className="adminTopTrackItem" key={track.id}>
                  <div className="adminTopTrackLeft">
                    <span className="adminTopTrackPlace">#{index + 1}</span>
                    <div>
                      <h4>{track.title}</h4>
                      <p>{translateGenre(track.genre)}</p>
                    </div>
                  </div>
                  <div className="adminTopTrackRight">
                    <span>{track.sales_count} продажів</span>
                    <strong>{formatPrice(track.income)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="adminUsersSection">
          <div className="adminListHeader">
            <div>
              <p className="adminSubtitle">Користувачі системи</p>
              <h2>Список користувачів</h2>
            </div>

            <span className="adminCounter">{filteredUsers.length}</span>
          </div>

          <div className="adminSearchBox">
            <input
              className="adminSearchInput"
              type="text"
              placeholder="Пошук за ніком, ім'ям або поштою..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="adminEmpty">
              {userSearch ? "Нічого не знайдено." : "Користувачів поки що немає."}
            </div>
          ) : (
            <div className="adminUsersTable">
              {filteredUsers.map(user => {
                const seen = formatLastSeen(user.last_seen);
                return (
                <div className="adminUserItem" key={user.id}>
                  <div className="adminUserInfo">
                    <div className="adminUserNameRow">
                      <h3>{user.nickname || user.name}</h3>
                      {seen && (
                        <span className="adminLastSeenBadge">
                          {seen}
                        </span>
                      )}
                    </div>

                    <div className="adminUserMeta">
                      {user.name && user.name !== user.email && user.name !== user.nickname && (
                        <span>{user.name}</span>
                      )}
                      <span>{user.email}</span>
                      <span>{user.role}</span>

                      <span className={user.is_blocked ? "userBlocked" : "userActive"}>
                        {user.is_blocked ? "Заблокований" : "Активний"}
                      </span>
                    </div>
                  </div>

                  <div className="adminUserActions">
                    <button
                      className={user.is_blocked ? "adminUnblockBtn" : "adminBlockBtn"}
                      onClick={() => toggleUserBlock(user.id)}
                      disabled={user.role === "admin"}
                    >
                      {user.is_blocked ? "Розблокувати" : "Заблокувати"}
                    </button>

                    <button
                      className="adminDeleteBtn"
                      onClick={() => deleteUser(user.id)}
                      disabled={user.role === "admin"}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}