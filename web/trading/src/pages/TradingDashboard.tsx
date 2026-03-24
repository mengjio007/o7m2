import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CharacterList } from '@/components/Trading/CharacterList'
import { OrderBook } from '@/components/Trading/OrderBook'
import { RecentTrades } from '@/components/Trading/RecentTrades'
import { TradingForm } from '@/components/Trading/TradingForm'
import { MyPositions } from '@/components/Trading/MyPositions'
import { MyOrders } from '@/components/Trading/MyOrders'
import { EventModal } from '@/components/Event/EventModal'
import { useAuthStore } from '@/store/auth'
import { accountApi, characterApi } from '@/services/api'

interface Character {
  id: string
  name: string
  category: 'virtual' | 'historical' | 'novel'
  avatar: string
  current_price: number
  change_rate: number
  day_high: number
  day_low: number
  volume: number
}

interface KLine {
  open_price: number
  close_price: number
  high_price: number
  low_price: number
}

const categoryInfo = {
  virtual: { label: '虚拟', icon: '🎮', color: 'text-pink-400' },
  historical: { label: '历史', icon: '📜', color: 'text-amber-400' },
  novel: { label: '小说', icon: '📖', color: 'text-purple-400' },
}

export function TradingDashboard() {
  const { isAuthenticated, user, logout, setAccount } = useAuthStore()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [showEvent, setShowEvent] = useState(false)
  const [chartType, setChartType] = useState<'time' | 'kline'>('time')
  const [kLines, setKLines] = useState<KLine[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'orders'>('chart')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      accountApi.getAccount().then((res: any) => {
        setAccount(res.account)
      }).catch(console.error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!selectedCharacter?.id) {
      setKLines([])
      return
    }
    loadKLines()
    const interval = setInterval(loadKLines, 10000)
    return () => clearInterval(interval)
  }, [selectedCharacter?.id])

  const loadKLines = async () => {
    if (!selectedCharacter?.id) return
    try {
      const res: any = await characterApi.getKLines(selectedCharacter.id, '1m', 120)
      setKLines(res.klines || [])
    } catch (error) {
      console.error('Failed to load klines:', error)
    }
  }

  const timeLineData = kLines.map((k, i) => ({ time: i, price: k.close_price || k.open_price }))
  const kLineData = kLines.map(k => ({ open: k.open_price, close: k.close_price, high: k.high_price, low: k.low_price }))
  const maxPrice = timeLineData.length > 0 ? Math.max(...timeLineData.map(d => d.price)) : 1000
  const minPrice = timeLineData.length > 0 ? Math.min(...timeLineData.map(d => d.price)) : 0
  const priceRange = maxPrice - minPrice || 1
  const kMaxPrice = kLineData.length > 0 ? Math.max(...kLineData.map(d => d.high)) : 1000
  const kMinPrice = kLineData.length > 0 ? Math.min(...kLineData.map(d => d.low)) : 0
  const kPriceRange = kMaxPrice - kMinPrice || 1

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
      
      {/* Header */}
      <header className="relative z-10 h-14 md:h-16 flex items-center px-4 md:px-6 justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-6">
          {/* 移动端菜单按钮 */}
          <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden text-white text-xl">☰</button>
          <Link to="/" className="text-lg md:text-2xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">✨ 偶气满满</span>
          </Link>
          {/* 桌面端导航 */}
          <nav className="hidden md:flex gap-2">
            <Link to="/" className="px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">💹 交易</Link>
            <Link to="/mining" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm">⛏️ 挖矿</Link>
            <Link to="/wiki" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm">📖 百科</Link>
            <Link to="/profile" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm">👤 我的</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setShowEvent(true)} className="hidden md:block px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30">🔔</button>
          <Link to="/profile" className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 bg-white/10 rounded-full">
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center text-xs md:text-sm">{user?.avatar || '🎭'}</div>
            <span className="hidden md:block text-white text-sm">{user?.username}</span>
          </Link>
        </div>
      </header>

      {/* 移动端侧边栏 */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-white font-bold">角色列表</span>
              <button onClick={() => setShowSidebar(false)} className="text-white">✕</button>
            </div>
            <CharacterList onSelect={(c) => { setSelectedCharacter(c); setShowSidebar(false); }} selectedId={selectedCharacter?.id} />
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
        {/* 左侧角色列表 - 桌面端显示 */}
        <aside className="hidden md:flex w-64 bg-black/30 backdrop-blur-sm border-r border-white/10 flex-col">
          <CharacterList onSelect={setSelectedCharacter} selectedId={selectedCharacter?.id} />
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 角色信息 */}
          {selectedCharacter ? (
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-3 md:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center text-xl md:text-2xl">
                  {selectedCharacter.avatar?.startsWith('http') ? (
                    <img src={selectedCharacter.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : selectedCharacter.avatar || '🎭'}
                </div>
                <div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-base md:text-xl font-bold text-white">{selectedCharacter.name}</span>
                    <span className={`hidden md:block text-xs px-2 py-0.5 rounded-full ${categoryInfo[selectedCharacter.category].color} bg-white/10`}>
                      {categoryInfo[selectedCharacter.category].label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl md:text-3xl font-bold text-white font-mono">{selectedCharacter.current_price?.toLocaleString() || '---'}</div>
                <div className={`text-xs md:text-sm ${(selectedCharacter.change_rate || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(selectedCharacter.change_rate || 0) >= 0 ? '+' : ''}{(selectedCharacter.change_rate || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border-b border-white/10 p-6 md:p-8 text-center">
              <div className="text-white/50 text-base md:text-lg">🎮 点击 ☰ 选择角色</div>
            </div>
          )}

          {/* 移动端标签切换 */}
          <div className="md:hidden bg-black/30 flex border-b border-white/10">
            <button onClick={() => setActiveTab('chart')} className={`flex-1 py-2 text-sm ${activeTab === 'chart' ? 'bg-white/10 text-white' : 'text-white/50'}`}>📊 图表</button>
            <button onClick={() => setActiveTab('orderbook')} className={`flex-1 py-2 text-sm ${activeTab === 'orderbook' ? 'bg-white/10 text-white' : 'text-white/50'}`}>📋 盘口</button>
            <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 text-sm ${activeTab === 'orders' ? 'bg-white/10 text-white' : 'text-white/50'}`}>💼 持仓</button>
          </div>

          {/* 图表区域 */}
          <div className={`flex-1 flex flex-col ${activeTab !== 'chart' ? 'hidden md:flex' : ''}`}>
            {/* 图表切换 */}
            <div className="bg-black/30 backdrop-blur-sm px-4 py-2 flex items-center gap-4 border-b border-white/10">
              <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                <button onClick={() => setChartType('time')} className={`px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium ${chartType === 'time' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'text-white/50'}`}>分时</button>
                <button onClick={() => setChartType('kline')} className={`px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium ${chartType === 'kline' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'text-white/50'}`}>K线</button>
              </div>
              {selectedCharacter && (
                <div className="hidden md:flex gap-4 text-sm text-white/50">
                  <span>高: <span className="text-red-400">{selectedCharacter.day_high || '---'}</span></span>
                  <span>低: <span className="text-green-400">{selectedCharacter.day_low || '---'}</span></span>
                </div>
              )}
            </div>

            {/* 图表 */}
            <div className="flex-1 bg-black/20 backdrop-blur-sm p-2 md:p-4 overflow-hidden min-h-[200px] md:min-h-0">
              {timeLineData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/30">
                  {selectedCharacter ? '暂无数据' : '请选择角色'}
                </div>
              ) : chartType === 'time' ? (
                <svg viewBox="0 0 800 350" className="w-full h-full">
                  <defs><linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0" /></linearGradient></defs>
                  <path d={`M 0 ${350 - ((timeLineData[0].price - minPrice) / priceRange) * 320} ${timeLineData.map((d, i) => `L ${(i / timeLineData.length) * 800} ${350 - ((d.price - minPrice) / priceRange) * 320}`).join(' ')} L 800 350 L 0 350 Z`} fill="url(#timeGrad)" />
                  <path d={`M 0 ${350 - ((timeLineData[0].price - minPrice) / priceRange) * 320} ${timeLineData.map((d, i) => `L ${(i / timeLineData.length) * 800} ${350 - ((d.price - minPrice) / priceRange) * 320}`).join(' ')}`} fill="none" stroke="#a855f7" strokeWidth="2" />
                  <circle cx={800} cy={350 - ((timeLineData[timeLineData.length - 1].price - minPrice) / priceRange) * 320} r="5" fill="#a855f7" className="animate-pulse" />
                </svg>
              ) : (
                <svg viewBox="0 0 800 350" className="w-full h-full">
                  {kLineData.map((d, i) => {
                    const x = (i / kLineData.length) * 780 + 20
                    const isUp = d.close >= d.open
                    const color = isUp ? '#ef4444' : '#22c55e'
                    return (
                      <g key={i}>
                        <line x1={x} y1={330 - ((d.high - kMinPrice) / kPriceRange) * 310} x2={x} y2={330 - ((d.low - kMinPrice) / kPriceRange) * 310} stroke={color} strokeWidth="1" />
                        <rect x={x - 6} y={330 - ((Math.max(d.open, d.close) - kMinPrice) / kPriceRange) * 310} width="12" height={Math.abs(d.close - d.open) / kPriceRange * 310 || 2} fill={color} />
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>

            {/* 交易表单 */}
            <div className="h-36 md:h-44 bg-white/5 border-t border-white/10">
              <TradingForm character={selectedCharacter} ticker={null} />
            </div>
          </div>

          {/* 盘口 - 移动端标签切换 */}
          <div className={`flex-1 ${activeTab !== 'orderbook' ? 'hidden md:block' : ''}`}>
            <div className="h-full md:hidden"><OrderBook characterId={selectedCharacter?.id} /></div>
          </div>

          {/* 持仓/订单 - 移动端标签切换 */}
          <div className={`flex-1 flex flex-col ${activeTab !== 'orders' ? 'hidden md:flex' : ''}`}>
            <div className="flex-1 md:hidden"><MyPositions /></div>
            <div className="flex-1 md:hidden"><MyOrders /></div>
          </div>
        </main>

        {/* 右侧盘口+成交 - 桌面端显示 */}
        <aside className="hidden md:flex w-72 bg-black/30 backdrop-blur-sm border-l border-white/10 flex-col">
          <div className="flex-1 overflow-hidden border-b border-white/10"><OrderBook characterId={selectedCharacter?.id} /></div>
          <div className="h-48 overflow-hidden"><RecentTrades characterId={selectedCharacter?.id} /></div>
        </aside>
      </div>

      {/* 底部持仓+订单 - 桌面端 */}
      <div className="hidden md:flex relative z-10 h-44 mx-4 mb-4 gap-4">
        <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"><MyPositions /></div>
        <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"><MyOrders /></div>
      </div>

      {showEvent && <EventModal onClose={() => setShowEvent(false)} />}
    </div>
  )
}
