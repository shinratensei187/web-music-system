import React, { useState, useContext, useRef } from 'react'
import { AuthContext } from '../context'
import ProfileService from '../API/ProfileService'
import userIcon from '../image/userIcon.png'
import '../styles/Profile.css'

function useToast() {
  const [toast, setToast] = useState(null)
  function show(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  return { toast, show }
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="profEye" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.8-2.27 2.27-4.22 4.17-5.56"/>
      <path d="M9.9 4.24A10.8 10.8 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.16 3.19"/>
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/><path d="M1 1l22 22"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="profEye" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="profPasswordWrap">
      <input
        type={show ? 'text' : 'password'}
        className="profInput"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button type="button" className="profEyeBtn" onClick={() => setShow(s => !s)}>
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

/* ════════════════════════════════
   Main view
════════════════════════════════ */
function MainView({ user, setUser, setView }) {
  const { toast, show } = useToast()
  const fileRef = useRef(null)

  const defaultNickname = user?.nickname || user?.email?.split('@')[0] || ''

  const [nickname,   setNickname]   = useState(defaultNickname)
  const [avatar,     setAvatar]     = useState(user?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving,     setSaving]     = useState(false)

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatar(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!nickname.trim()) { show('Введіть нікнейм', 'error'); return }
    setSaving(true)
    try {
      let updated = { ...user }

      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        const avatarRes = await ProfileService.uploadAvatar(fd)
        updated = { ...updated, ...avatarRes.data }
        setAvatarFile(null)
      }

      const profileRes = await ProfileService.updateProfile({ nickname: nickname.trim() })
      updated = { ...updated, ...profileRes.data }

      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      show('Профіль оновлено')
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      if (status === 401 || status === 403) {
        show('Сесія застаріла — увійдіть знову', 'error')
      } else if (detail) {
        show(detail, 'error')
      } else {
        show('Помилка збереження', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {toast && <div className={`profToast ${toast.type}`}>{toast.message}</div>}

      {/* ── Шапка профілю ── */}
      <div className="profHeaderCard">
        <div className="profHeaderLeft">
          <div className="profAvatarWrap" onClick={() => fileRef.current.click()}>
            <img src={avatar || userIcon} alt="avatar" className="profAvatarImg" />
            <div className="profAvatarOverlay">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>
          <div className="profHeaderMeta">
            <h2 className="profHeaderName">{nickname}</h2>
            <p className="profHeaderEmail">{user?.email}</p>
          </div>
        </div>
        <button type="button" className="profUploadBtn" onClick={() => fileRef.current.click()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Завантажити фото
        </button>
      </div>

      {/* ── Дані аккаунту ── */}
      <form className="profSectionCard" onSubmit={handleSave}>
        <h3 className="profSectionTitle">Дані аккаунту</h3>

        <div className="profField">
          <label className="profLabel">Нікнейм</label>
          <input
            className="profInput"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Введіть нікнейм"
            maxLength={50}
          />
        </div>

        <button type="submit" className="profSaveBtn" disabled={saving}>
          {saving ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </form>

      {/* ── Безпека ── */}
      <div className="profSectionCard">
        <h3 className="profSectionTitle">Безпека</h3>
        <div className="profSecurityRow">
          <button type="button" className="profSecurityBtn" onClick={() => setView('email')}>
            <div className="profSecurityIcon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="profSecurityText">
              <span>Змінити email</span>
              <p>{user?.email}</p>
            </div>
            <svg className="profSecurityArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <button type="button" className="profSecurityBtn" onClick={() => setView('password')}>
            <div className="profSecurityIcon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="profSecurityText">
              <span>Змінити пароль</span>
              <p>Оновіть пароль аккаунту</p>
            </div>
            <svg className="profSecurityArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════
   Change email
════════════════════════════════ */
function ChangeEmailView({ user, setUser }) {
  const { toast, show } = useToast()
  const [email,    setEmail]    = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [saving,   setSaving]   = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!email.trim())    { show('Введіть email', 'error'); return }
    if (!password.trim()) { show('Введіть поточний пароль', 'error'); return }
    setSaving(true)
    try {
      await ProfileService.changeEmail(email.trim(), password)
      const updated = { ...user, email: email.trim() }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setPassword('')
      show('Email оновлено')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Помилка зміни email'
      show(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {toast && <div className={`profToast ${toast.type}`}>{toast.message}</div>}
      <form className="profSectionCard" onSubmit={handleSave}>
        <h3 className="profSectionTitle">Змінити email</h3>

        <div className="profField">
          <label className="profLabel">Новий email</label>
          <input className="profInput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Введіть новий email" />
        </div>

        <div className="profField">
          <label className="profLabel">Поточний пароль</label>
          <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Введіть поточний пароль" />
        </div>

        <button type="submit" className="profSaveBtn" disabled={saving}>
          {saving ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </form>
    </>
  )
}

/* ════════════════════════════════
   Change password
════════════════════════════════ */
function ChangePasswordView() {
  const { toast, show } = useToast()
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving,  setSaving]  = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!current.trim()) { show('Введіть поточний пароль', 'error'); return }
    if (next.length < 6) { show('Новий пароль — мінімум 6 символів', 'error'); return }
    if (next !== confirm) { show('Паролі не збігаються', 'error'); return }
    setSaving(true)
    try {
      await ProfileService.changePassword(current, next)
      setCurrent(''); setNext(''); setConfirm('')
      show('Пароль змінено')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Помилка зміни паролю'
      show(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {toast && <div className={`profToast ${toast.type}`}>{toast.message}</div>}
      <form className="profSectionCard" onSubmit={handleSave}>
        <h3 className="profSectionTitle">Змінити пароль</h3>

        <div className="profField">
          <label className="profLabel">Поточний пароль</label>
          <PasswordInput value={current} onChange={e => setCurrent(e.target.value)} placeholder="Введіть поточний пароль" />
        </div>

        <div className="profField">
          <label className="profLabel">Новий пароль</label>
          <PasswordInput value={next} onChange={e => setNext(e.target.value)} placeholder="Введіть новий пароль" />
        </div>

        <div className="profField">
          <label className="profLabel">Підтвердіть пароль</label>
          <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Повторіть новий пароль" />
        </div>

        <button type="submit" className="profSaveBtn" disabled={saving}>
          {saving ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </form>
    </>
  )
}

/* ════════════════════════════════
   Page root
════════════════════════════════ */
export default function Profile() {
  const { user, setUser } = useContext(AuthContext)
  const [view, setView] = useState('main')

  const viewLabel = { email: 'Змінити email', password: 'Змінити пароль' }

  return (
    <div className="profPage">
      <div className="profInner">

        <div className="profPageHeader">
          <h1 className="profTitle">Налаштування аккаунту</h1>
          {view !== 'main' && (
            <div className="profBreadcrumb">
              <button className="profBackLink" onClick={() => setView('main')}>← Назад</button>
              <span className="profBreadcrumbSep">/</span>
              <span className="profBreadcrumbLabel">{viewLabel[view]}</span>
            </div>
          )}
        </div>

        {view === 'main'     && <MainView         user={user} setUser={setUser} setView={setView} />}
        {view === 'email'    && <ChangeEmailView   user={user} setUser={setUser} />}
        {view === 'password' && <ChangePasswordView />}

      </div>
    </div>
  )
}
