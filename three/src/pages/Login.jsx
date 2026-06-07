import React, { useContext, useState } from 'react'
import MyInput from '../Components/UI/input/MyInput'
import MyButton from '../Components/UI/button/MyButton'
import { AuthContext } from '../context'
import '../styles/Login.css'
import logo from '../image/logo.png'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthService from '../API/AuthService'

export default function Login() {
  const { setIsAuth, setUser } = useContext(AuthContext)

  const navigate = useNavigate()
  const location = useLocation()
  const hint = location.state?.hint

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'error'
  })

  const showToast = (message, type = 'error') => {
    setToast({
      show: true,
      message,
      type
    })

    setTimeout(() => {
      setToast({
        show: false,
        message: '',
        type: 'error'
      })
    }, 3000)
  }

  const login = async (event) => {
    event.preventDefault()

    const emailValue = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailValue) {
      showToast('Введіть електронну пошту')
      return
    }

    if (!emailRegex.test(emailValue)) {
      showToast('Недостовірний ввід пошти')
      return
    }

    if (!password.trim()) {
      showToast('Введіть пароль')
      return
    }

    try {
      const response = await AuthService.login(emailValue, password)

      console.log(response.data)

      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('auth', 'true')
      localStorage.setItem('user', JSON.stringify(response.data.user))

      setIsAuth(true)
      setUser(response.data.user)

      showToast('Вхід виконано успішно', 'success')

      setTimeout(() => {
        if (response.data.user.role === 'admin') {
          navigate('/admin/tracks')
        } else {
          navigate('/posts')
        }
      }, 700)
    } catch (e) {
      console.log(e)

      if (e.response?.status === 401) {
        showToast('Невірний email або пароль')
      } else if (e.response?.data?.detail) {
        showToast(e.response.data.detail)
      } else {
        showToast('Помилка авторизації. Спробуйте ще раз')
      }
    }
  }

  return (
    <div className="loginPage">

      {toast.show && (
        <div className={`toastMessage ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="loginContainer">

        <div className="loginHeader">
          <img
            src={logo}
            alt="logo"
            className="loginLogo"
          />
        </div>

        {hint && (
          <div className="loginHint">
            <span className="loginHintIcon">🔒</span>
            {hint}
          </div>
        )}

        <div className="loginCard">

          <form onSubmit={login} className="loginForm">
            <div className="loginField">
              <label className="loginLabel">
                Email
              </label>

              <MyInput
                type="text"
                placeholder="Введіть email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="loginField">
              <label className="loginLabel">
                Пароль
              </label>

              <div className="passwordBox">
                <MyInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введіть пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="showPasswordBtn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="eyeIcon">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.8-2.27 2.27-4.22 4.17-5.56" />
                      <path d="M9.9 4.24A10.8 10.8 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="eyeIcon">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="loginActions">
              <MyButton>
                Продовжити
              </MyButton>
            </div>

            <p className="authText">
              Немає акаунта?{' '}
              <Link to="/register">
                Зареєструватися
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}