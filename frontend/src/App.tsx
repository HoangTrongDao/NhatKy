import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { api, getToken, setToken, User } from './api'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import AuthPage from './components/AuthPage'
import MemoriesPage from './components/MemoriesPage'
import ForgotPassword from './components/ForgotPassword'
import ReflectionsPage from './components/ReflectionsPage'
import GoalsPage from './components/GoalsPage'
import CommunityPage from './components/CommunityPage'
import ProfilePage from './components/ProfilePage'
import { Analytics } from '@vercel/analytics/react';
function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (getToken()) {
      api<User>('/auth/me')
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setAuthReady(true))
    } else {
      setAuthReady(true)
    }
  }, [])

  if (!authReady) {
    return(
      <> <div className="loading">Đang chuẩn bị không gian của bạn…</div>
      <Analytics />
    </>)
  }
  return (
    <ToastProvider>
      <Layout user={user} setUser={setUser}>
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/login" element={<AuthPage mode="login" onUser={setUser} />} />
          <Route path="/login" element={<AuthPage mode="login" onUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<AuthPage mode="register" onUser={setUser} />} />
          <Route path="/register" element={<AuthPage mode="register" onUser={setUser} />} />
          <Route path="/memories" element={<MemoriesPage user={user} />} />
          <Route path="/reflections" element={<ReflectionsPage user={user} />} />
          <Route path="/goals" element={<GoalsPage user={user} />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage user={user} onUserUpdate={setUser} />} />
          <Route path="*" element={<HomePage user={user} />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}

export default App
