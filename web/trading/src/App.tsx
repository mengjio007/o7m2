import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })))
const TradingDashboard = lazy(() => import('./pages/TradingDashboard').then(m => ({ default: m.TradingDashboard })))
const Mining = lazy(() => import('./pages/Mining').then(m => ({ default: m.Mining })))
const Wiki = lazy(() => import('./pages/Wiki').then(m => ({ default: m.Wiki })))
const Listing = lazy(() => import('./pages/Listing').then(m => ({ default: m.Listing })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))

// Loading 组件
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin mb-4" />
        <div className="text-white/60 text-sm">加载中...</div>
      </div>
    </div>
  )
}

// 路由守卫
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <TradingDashboard /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mining" element={<ProtectedRoute><Mining /></ProtectedRoute>} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/listing" element={<ProtectedRoute><Listing /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/trading" element={<ProtectedRoute><TradingDashboard /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
