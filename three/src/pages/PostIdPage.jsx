import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TrackService from '../API/TrackService'
import CartService from '../API/CartService'
import CommentService from '../API/CommentService'
import API from '../API/api'
import Loader from '../Components/UI/loader/Loader'
import trackImage from '../image/trackImage.png'
import { usePlayer } from '../context/PlayerContext'
import { useCart } from '../context/CartContext'
import { AuthContext } from '../context'

import '../styles/TrackPage.css'

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"

function UserAvatar({ src, alt = '', className }) {
  return <img className={className} src={src || DEFAULT_AVATAR} alt={alt} />
}

export default function PostIdPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSold, setIsSold] = useState(false)

  const { togglePlay, currentTrack, isPlaying } = usePlayer()
  const { addItem } = useCart()
  const { isAuth, user } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin'
  const isCurrentlyPlaying = currentTrack?.id === post.id && isPlaying

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    fetchTrack()
  }, [])

  useEffect(() => {
    if (params.id) fetchComments()
  }, [params.id])

  async function fetchComments() {
    try {
      const res = await CommentService.getComments(params.id)
      setComments(res.data)
    } catch {}
  }

  async function submitComment(e) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text || commentLoading) return
    if (!isAuth) {
      showMessage('Увійдіть, щоб залишити коментар', 'error')
      return
    }
    try {
      setCommentLoading(true)
      const res = await CommentService.addComment(params.id, text)
      setComments(prev => [...prev, res.data])
      setCommentText('')
    } catch (e) {
      showMessage('Помилка додавання коментаря', 'error')
    } finally {
      setCommentLoading(false)
    }
  }

  async function deleteComment(commentId) {
    try {
      await CommentService.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
  }

  async function fetchTrack() {
    try {
      const response = await TrackService.getById(params.id)
      setPost(response.data)
    } catch (e) {
      if (e.response?.status === 403) {
        setIsSold(true)
      }
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }

  function showMessage(text, type) {
    setMessage(text)
    setMessageType(type)

    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)
  }

  async function downloadTrack() {
    try {
      const response = await API.get(`/tracks/${post.id}/download`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = post.title || 'track'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      showMessage('Помилка завантаження файлу', 'error')
    }
  }

  async function addToCart() {
    if (!isAuth) {
      showMessage('Увійдіть або зареєструйтесь, щоб додати трек у кошик', 'error')
      return
    }
    try {
      await addItem(post.id)
      showMessage('Трек додано в кошик', 'success')
    } catch (e) {
      const errorText = e.response?.data?.detail

      if (errorText === 'Трек уже в корзине') {
        showMessage('Цей трек уже є у вашому кошику', 'error')
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        showMessage('Увійдіть в акаунт, щоб додати трек у кошик', 'error')
      } else {
        showMessage('Помилка додавання треку в кошик', 'error')
      }

      console.log(e)
    }
  }

  if (isLoading) {
    return <Loader />
  }

  if (isSold) {
    return (
      <div className="trackPage">
        <div className="trackInfoCard" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#ec625f', marginBottom: 12 }}>Трек продано</h2>
          <p style={{ color: '#aaa', marginBottom: 24 }}>
            Цей трек вже придбано іншим користувачем і недоступний для перегляду.
          </p>
          <button className="addCartBtn" onClick={() => navigate('/posts')}>
            Повернутись до каталогу
          </button>
        </div>
      </div>
    )
  }

  function handleTogglePlay() {
    if (!post.demo_file_url) return
    togglePlay(post, [post], 0)
  }

  function formatDate(date) {
    if (!date) return '—'

    return new Date(date).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="trackPage">
      {isAdmin && (
        <button className="adminBackBar" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          Повернутись
        </button>
      )}

      {message && (
        <div className={`cartMessage ${messageType}`}>
          {message}
        </div>
      )}

      <div className="trackInfoCard">
        <div className="trackPageImageBox" onClick={handleTogglePlay}>
          <img
            src={post.image_url || trackImage}
            alt={post.title}
            className="trackPageImage"
          />

          <button
            className={`trackPagePlayButton ${isCurrentlyPlaying ? 'isPlaying' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleTogglePlay()
            }}
          >
            <span className={isCurrentlyPlaying ? 'trackPagePauseIcon' : 'trackPagePlayIcon'}>
              {isCurrentlyPlaying ? '⏸' : '▶'}
            </span>
          </button>
        </div>

        <h2 className="trackPageTitle">{post.title}</h2>

        <div className="infoDivider"></div>

        <h3 className="infoTitle">Інформація</h3>

        <div className="infoRow">
          <span>Завантажено</span>
          <span>{formatDate(post.created_at)}</span>
        </div>

        <div className="infoRow">
          <span>Жанр</span>
          <span>{post.genre}</span>
        </div>

        <div className="infoRow">
          <span>Настрій</span>
          <span>{post.mood}</span>
        </div>

        <div className="infoRow">
          <span>Темп</span>
          <span>{post.bpm}</span>
        </div>

        <div className="infoRow">
          <span>Тональність</span>
          <span>{post.key}</span>
        </div>

        <div className="infoRow">
          <span>Тривалість</span>
          <span>
            {post.duration
              ? `${Math.floor(post.duration / 60)}:${String(post.duration % 60).padStart(2, '0')}`
              : '—'}
          </span>
        </div>

        <div className="infoRow">
          <span>Ціна</span>
          <span>
            {post.price ? `${Number(post.price).toLocaleString('uk-UA')} ₴` : '—'}
          </span>
        </div>

        {post.is_sold ? (
          <>
            {!isAdmin && (
              <div style={{ textAlign: 'center', color: '#50c878', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Ви вже купили цей трек
              </div>
            )}
            <button
              className="addCartBtn"
              onClick={downloadTrack}
              disabled={!post.full_file_url}
            >
              Завантажити трек
            </button>
          </>
        ) : (
          !isAdmin && (
            <button className="addCartBtn" onClick={addToCart}>
              Додати в кошик
            </button>
          )
        )}

      </div>

      <div className="trackRightCol">
        {post.description && (
          <div className="trackDescription">
            <h2>Опис</h2>
            <p>{post.description}</p>
          </div>
        )}

        <div className="commentsBlock">
          <h2>Коментарі</h2>

          <form className="commentInput" onSubmit={submitComment}>
            <UserAvatar className="commentAvatar" src={user?.avatar_url} />
            <input
              placeholder="Поділіться своєю думкою..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              maxLength={200}
            />
            <button type="submit" disabled={!commentText.trim() || commentLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>

          <div className="commentsList">
            {comments.length === 0 && (
              <p className="commentsEmpty">Коментарів ще немає. Будьте першим!</p>
            )}
            {comments.map(comment => (
              <div className="commentItem" key={comment.id}>
                <UserAvatar className="commentAvatar" src={comment.user.avatar_url} alt={comment.user.nickname} />
                <div className="commentBody">
                  <span className="commentNick">{comment.user.nickname}</span>
                  <p className="commentText">{comment.content}</p>
                </div>
                {(user?.id === comment.user.id || user?.role === 'admin') && (
                  <button
                    className="commentDeleteBtn"
                    onClick={() => deleteComment(comment.id)}
                    title="Видалити"
                  >×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}