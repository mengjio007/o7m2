import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Characters } from './pages/Characters'
import { Users } from './pages/Users'
import { Events } from './pages/Events'
import { Config } from './pages/Config'
import { MiningMonitor } from './pages/MiningMonitor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="characters" element={<Characters />} />
          <Route path="users" element={<Users />} />
          <Route path="events" element={<Events />} />
          <Route path="config" element={<Config />} />
          <Route path="mining" element={<MiningMonitor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
