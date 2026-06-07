import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { privateRoutes, publicRoutes, sharedRoutes } from "../router"
import { AuthContext } from '../context'
import Loader from './UI/loader/Loader'
import Home from '../pages/Home'

export default function AppRouter() {
  const { isAuth, isLoading, user } = useContext(AuthContext)

  if (isLoading) {
    return <Loader />
  }

  return (
    <Routes>
      {/* Головна — для всіх */}
      <Route path="/" element={<Home />} />

      {/* Спільні маршрути */}
      {sharedRoutes.map(route => {
        const Component = route.component
        return <Route key={route.path} path={route.path} element={<Component />} />
      })}

      {/* Авторизовані */}
      {isAuth && privateRoutes.map(route => {
        const Component = route.component

        if (route.path.startsWith('/admin') && user?.role !== 'admin') return null
        if (!route.path.startsWith('/admin') && user?.role === 'admin') return null

        return <Route key={route.path} path={route.path} element={<Component />} />
      })}

      {/* Неавторизовані */}
      {!isAuth && publicRoutes.map(route => {
        const Component = route.component
        return <Route key={route.path} path={route.path} element={<Component />} />
      })}

      {/* Fallback */}
      <Route
        path="*"
        element={
          isAuth
            ? user?.role === 'admin'
              ? <Navigate to="/admin/tracks" replace />
              : <Navigate to="/posts" replace />
            : <Navigate to="/login" state={{ hint: 'Увійдіть або зареєструйтесь, щоб переглядати та купувати треки' }} replace />
        }
      />
    </Routes>
  )
}
