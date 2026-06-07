import React, { useState, useEffect } from "react";
import './styles/App.css';
import { BrowserRouter, useLocation } from "react-router-dom";
import { usePlayer } from "./context/PlayerContext";

import Navbar from "./Components/UI/navbar/Navbar";
import AppRouter from "./Components/AppRouter";
import Player from "./Components/Player/Player";
import { AuthContext, SearchContext } from "./context";
import { PlayerProvider } from "./context/PlayerContext";
import { CartProvider } from "./context/CartContext";

function Layout() {
  const location = useLocation();
  const { pause } = usePlayer();
  const { user } = React.useContext(AuthContext);

  const isAdminOnTrackPage =
    user?.role === 'admin' && /^\/posts\/\d+/.test(location.pathname);

  const hideNavbar =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin') ||
    isAdminOnTrackPage;

  const hidePlayer =
    location.pathname === '/login' ||
    location.pathname === '/register';

  useEffect(() => {
    if (hidePlayer) pause();
  }, [location.pathname]);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <AppRouter />
      {!hidePlayer && <Player />}
    </>
  );
}

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token) {
      setIsAuth(true);

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuth,
      setIsAuth,
      isLoading,
      user,
      setUser
    }}>
      <SearchContext.Provider value={{
        searchQuery,
        setSearchQuery
      }}>
        <PlayerProvider>
          <CartProvider>
            <BrowserRouter>
              <Layout />
            </BrowserRouter>
          </CartProvider>
        </PlayerProvider>
      </SearchContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;