import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { TradingDashboard } from './pages/TradingDashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Mining } from './pages/Mining'
import { Home } from './pages/Home'
import { Wiki } from './pages/Wiki'
import { Listing } from './pages/Listing'
import { Profile } from './pages/Profile'

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
    </BrowserRouter>
  )
}

export default App
