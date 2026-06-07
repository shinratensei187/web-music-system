import React, { useContext, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import classes from './Navbar.module.css'

import logo from '../../../image/logo.png'
import brandText from '../../../image/brandText.png'
import dots from '../../../image/dots.png'
import searchIcon from '../../../image/searchIcon.png'
import userIcon from '../../../image/userIcon.png'
import cartIcon from '../../../image/cartIcon.png'
import arrowDown from '../../../image/arrowDown.png'
import trackImage from '../../../image/trackImage.png'
import { AuthContext, SearchContext } from '../../../context'
import { useCart } from '../../../context/CartContext'
import TrackService from '../../../API/TrackService'



function Navbar({ filter, setFilter }) {
  const { isAuth, setIsAuth, user, setUser } = useContext(AuthContext)
  const { items: cartItems, removeItem: removeCartItem } = useCart()
  const [userMenu, setUserMenu] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { searchQuery, setSearchQuery } = useContext(SearchContext)

  const [allTracks, setAllTracks] = useState([])
  const [tracksLoaded, setTracksLoaded] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const isOnCatalog = location.pathname === '/posts'

  const userMenuRef = useRef(null)
  const searchDropdownRef = useRef(null)
  const searchRef = useRef(null)
  const cartRef = useRef(null)

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    setIsAuth(false);
    setUser(null)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSearchFocus() {
    if (isOnCatalog || tracksLoaded) return
    try {
      const response = await TrackService.getAll()
      setAllTracks(response.data)
      setTracksLoaded(true)
    } catch (e) {}
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value)
    if (!isOnCatalog) setShowDropdown(true)
  }

  const normalizedQuery = searchQuery.toLowerCase().trim()
  const dropdownResults = !isOnCatalog && normalizedQuery
    ? allTracks.filter(t =>
        t.title?.toLowerCase().includes(normalizedQuery) ||
        t.genre?.toLowerCase().includes(normalizedQuery) ||
        t.mood?.toLowerCase().includes(normalizedQuery)
      ).slice(0, 6)
    : []

  function handleSelectTrack(track) {
    setSearchQuery(track.title)
    setShowDropdown(false)
    navigate('/posts')
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Escape') setShowDropdown(false)
    if (e.key === 'Enter' && !isOnCatalog) {
      setShowDropdown(false)
      navigate('/posts')
    }
  }

  return (
    <header className={classes.navbar}>
      <div className={classes.topRow}>

        <div className={classes.logoBox}>
          <img src={dots} alt="" className={classes.dotsImg} />
          <img src={logo} alt="" className={classes.logoFlashImg} />
          <img src={brandText} alt="" className={classes.brandImg} />
        </div>

        <div className={classes.searchWrapper} ref={searchRef}>
          <div className={classes.searchBox}>
            <img src={searchIcon} alt="" className={classes.searchImg} />

            <input
              type="text"
              placeholder="Знайти трек..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {showDropdown && normalizedQuery && (
            <div className={classes.searchDropdown} ref={searchDropdownRef}>
              {dropdownResults.length > 0 ? (
                dropdownResults.map(track => (
                  <button
                    key={track.id}
                    className={classes.searchDropdownItem}
                    onMouseDown={() => handleSelectTrack(track)}
                  >
                    {track.image_url
                      ? <img src={track.image_url} alt="" className={classes.searchDropdownThumb} />
                      : <div className={classes.searchDropdownThumbPlaceholder} />
                    }
                    <div className={classes.searchDropdownInfo}>
                      <span className={classes.searchDropdownTitle}>{track.title}</span>
                      {track.genre && <span className={classes.searchDropdownGenre}>{track.genre}</span>}
                    </div>
                    {track.price && (
                      <span className={classes.searchDropdownPrice}>{Number(track.price).toLocaleString('uk-UA')} ₴</span>
                    )}
                  </button>
                ))
              ) : (
                <div className={classes.searchDropdownEmpty}>Нічого не знайдено</div>
              )}
            </div>
          )}
        </div>

        <div className={classes.rightMenu}>
          {isAuth ? (
            <>
              <div className={classes.userBlock} ref={userMenuRef}>
                <div
                  className={classes.menuItem}
                  onClick={() => setUserMenu(!userMenu)}
                >
                  <img src={userIcon} alt="" className={classes.userImg} />
                  <img src={arrowDown} alt="" className={classes.arrowImg} />
                </div>

                {userMenu && (
                  <div className={classes.dropdown}>
                    <Link to="/profile">Профіль</Link>
                    <Link to="/my-tracks">Мої треки</Link>
                    <button onClick={logout}>Вийти</button>
                    {user?.role === 'admin' && (
                      <Link to="/admin/tracks">Адмін-меню</Link>
                    )}
                  </div>
                )}
              </div>

              <div className={classes.cartBlock} ref={cartRef}>
                <div
                  className={classes.menuItem}
                  onClick={() => setCartOpen(o => !o)}
                >
                  <div className={classes.cartIconWrap}>
                    <img src={cartIcon} alt="cart" className={classes.cartImg} />
                    {cartItems.length > 0 && (
                      <span className={classes.cartBadge}>{cartItems.length}</span>
                    )}
                  </div>
                  <img src={arrowDown} alt="" className={classes.arrowImg} />
                </div>

                {cartOpen && (
                  <div className={classes.cartDropdown}>
                    {cartItems.length === 0 ? (
                      <p className={classes.cartEmpty}>Кошик порожній</p>
                    ) : (
                      <>
                        <div className={classes.cartDropdownList}>
                          {cartItems.map(item => (
                            <div key={item.id} className={classes.cartDropdownItem}>
                              <img
                                src={item.track.image_url || trackImage}
                                alt={item.track.title}
                                className={classes.cartDropdownThumb}
                              />
                              <div className={classes.cartDropdownInfo}>
                                <span className={classes.cartDropdownTitle}>{item.track.title}</span>
                                <span className={classes.cartDropdownPrice}>
                                  {Number(item.track.price).toLocaleString('uk-UA')} ₴
                                </span>
                              </div>
                              <button
                                className={classes.cartDropdownRemove}
                                onClick={() => removeCartItem(item.track.id)}
                              >✕</button>
                            </div>
                          ))}
                        </div>
                        <div className={classes.cartDropdownFooter}>
                          <span className={classes.cartDropdownTotal}>
                            Разом:&nbsp;
                            <strong>
                              {cartItems.reduce((s, i) => s + Number(i.track.price), 0).toLocaleString('uk-UA')} ₴
                            </strong>
                          </span>
                          <Link
                            to="/cart"
                            className={classes.cartDropdownBtn}
                            onClick={() => setCartOpen(false)}
                          >
                            Оформити
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={classes.authBtns}>
              <Link to="/login"    className={classes.authBtnLogin}>Увійти</Link>
              <Link to="/register" className={classes.authBtnRegister}>Реєстрація</Link>
            </div>
          )}
        </div>

      </div>

      <nav className={classes.bottomRow}>
        <Link to="/">Головна</Link>
        <Link to="/posts">Каталог треків</Link>
      </nav>
    </header>
  )
}

export default Navbar