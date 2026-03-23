import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TradingDashboard } from './pages/TradingDashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Mining } from './pages/Mining'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TradingDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mining" element={<Mining />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
