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
  volume: number
  open_time: string
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

  useEffect(() => {
    if (isAuthenticated) {
      accountApi.getAccount().then((res: any) => {
        setAccount(res.account)
      }).catch(console.error)
    }
  }, [isAuthenticated])

  // 加载K线数据
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

  // 计算分时数据 - 使用K线的close_price作为分时点
  const timeLineData = kLines.map((k, i) => ({
    time: i,
    price: k.close_price || k.open_price
  }))

  // K线数据
  const kLineData = kLines.map(k => ({
    open: k.open_price,
    close: k.close_price,
    high: k.high_price,
    low: k.low_price
  }))

  const maxPrice = timeLineData.length > 0 
    ? Math.max(...timeLineData.map(d => d.price))
    : 1000
  const minPrice = timeLineData.length > 0 
    ? Math.min(...timeLineData.map(d => d.price))
    : 0
  const priceRange = maxPrice - minPrice || 1

  const kMaxPrice = kLineData.length > 0
    ? Math.max(...kLineData.map(d => d.high))
    : 1000
  const kMinPrice = kLineData.length > 0
    ? Math.min(...kLineData.map(d => d.low))
    : 0
  const kPriceRange = kMaxPrice - kMinPrice || 1

  return (
    <div className="min-h-screen overflow-hidden">
      {/* 背景渐变层 - 与官网一致 */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
      
      {/* 装饰光点 */}
      <div className="fixed top-20 left-[10%] w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed top-40 right-[15%] w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      <div className="fixed bottom-20 left-[30%] w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Header - 与官网一致 */}
      <header className="relative z-10 h-16 flex items-center px-6 justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
              ✨ 偶气满满
            </span>
          </Link>
          <nav className="flex gap-2">
            <Link to="/" className="px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">💹 交易</Link>
            <Link to="/mining" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm transition-all">⛏️ 挖矿</Link>
            <Link to="/wiki" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm transition-all">📖 百科</Link>
            <Link to="/profile" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm transition-all">👤 我的</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowEvent(true)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30">
            🔔 事件
          </button>
          <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center text-sm">
              {user?.avatar || '🎭'}
            </div>
            <span className="text-white text-sm">{user?.username}</span>
          </Link>
          <button onClick={logout} className="text-white/50 text-sm hover:text-white">退出</button>
        </div>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-64px)]">
        {/* 左侧：角色列表 */}
        <aside className="w-64 bg-black/30 backdrop-blur-sm border-r border-white/10 overflow-hidden flex flex-col">
          <CharacterList onSelect={setSelectedCharacter} selectedId={selectedCharacter?.id} />
        </aside>

        {/* 中间：图表区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 角色信息头部 */}
          {selectedCharacter ? (
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center text-2xl">
                  {selectedCharacter.avatar || '🎭'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{selectedCharacter.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryInfo[selectedCharacter.category].color} bg-white/10`}>
                      {categoryInfo[selectedCharacter.category].icon} {categoryInfo[selectedCharacter.category].label}
                    </span>
                  </div>
                  <div className="text-sm text-white/50">ID: {selectedCharacter.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white font-mono">
                  {selectedCharacter.current_price?.toLocaleString() || '---'}
                </div>
                <div className={`text-sm ${(selectedCharacter.change_rate || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(selectedCharacter.change_rate || 0) >= 0 ? '+' : ''}{(selectedCharacter.change_rate || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border-b border-white/10 p-8 text-center">
              <div className="text-white/50 text-lg">🎮 选择一个角色开始交易</div>
            </div>
          )}

          {/* 图表切换 */}
          <div className="bg-black/30 backdrop-blur-sm px-4 py-2 flex items-center gap-4 border-b border-white/10">
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setChartType('time')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartType === 'time' 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                分时
              </button>
              <button
                onClick={() => setChartType('kline')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartType === 'kline' 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                K线
              </button>
            </div>
            {selectedCharacter && (
              <div className="flex gap-4 text-sm text-white/50">
                <span>最高: <span className="text-red-400">{selectedCharacter.day_high || '---'}</span></span>
                <span>最低: <span className="text-green-400">{selectedCharacter.day_low || '---'}</span></span>
                <span>成交: <span className="text-white">{selectedCharacter.volume?.toLocaleString() || 0}</span></span>
              </div>
            )}
          </div>

          {/* 图表区 */}
          <div className="flex-1 bg-black/20 backdrop-blur-sm p-4 overflow-hidden">
            {timeLineData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-white/30 text-lg">
                  {selectedCharacter ? '暂无数据' : '请选择角色查看图表'}
                </div>
              </div>
            ) : chartType === 'time' ? (
              <svg viewBox="0 0 800 350" className="w-full h-full">
                <defs>
                  <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* 网格 */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line key={i} x1="0" y1={i * 70} x2="800" y2={i * 70} stroke="rgba(255,255,255,0.05)" />
                ))}
                {/* 面积 */}
                <path
                  d={`M 0 ${350 - ((timeLineData[0].price - minPrice) / priceRange) * 320} ${timeLineData.map((d, i) => `L ${(i / timeLineData.length) * 800} ${350 - ((d.price - minPrice) / priceRange) * 320}`).join(' ')} L 800 350 L 0 350 Z`}
                  fill="url(#timeGrad)"
                />
                {/* 线条 */}
                <path
                  d={`M 0 ${350 - ((timeLineData[0].price - minPrice) / priceRange) * 320} ${timeLineData.map((d, i) => `L ${(i / timeLineData.length) * 800} ${350 - ((d.price - minPrice) / priceRange) * 320}`).join(' ')}`}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                />
                {/* 当前点 */}
                <circle
                  cx={800}
                  cy={350 - ((timeLineData[timeLineData.length - 1].price - minPrice) / priceRange) * 320}
                  r="5"
                  fill="#a855f7"
                  className="animate-pulse"
                />
                {/* 时间轴 */}
                {['09:30', '10:30', '11:30', '13:00', '14:00', '15:00'].map((t, i) => (
                  <text key={i} x={i * 133 + 40} y="345" fill="rgba(255,255,255,0.3)" fontSize="12">{t}</text>
                ))}
              </svg>
            ) : (
              <svg viewBox="0 0 800 350" className="w-full h-full">
                {/* 网格 */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line key={i} x1="0" y1={i * 70} x2="800" y2={i * 70} stroke="rgba(255,255,255,0.05)" />
                ))}
                {kLineData.map((d, i) => {
                  const x = (i / kLineData.length) * 780 + 20
                  const isUp = d.close >= d.open
                  const color = isUp ? '#ef4444' : '#22c55e'
                  return (
                    <g key={i}>
                      <line
                        x1={x} y1={330 - ((d.high - kMinPrice) / kPriceRange) * 310}
                        x2={x} y2={330 - ((d.low - kMinPrice) / kPriceRange) * 310}
                        stroke={color} strokeWidth="1"
                      />
                      <rect
                        x={x - 6}
                        y={330 - ((Math.max(d.open, d.close) - kMinPrice) / kPriceRange) * 310}
                        width="12"
                        height={Math.abs(d.close - d.open) / kPriceRange * 310 || 2}
                        fill={color}
                      />
                    </g>
                  )
                })}
              </svg>
            )}
          </div>

          {/* 交易表单 */}
          <div className="h-44 bg-white/5 border-t border-white/10">
            <TradingForm character={selectedCharacter} ticker={null} />
          </div>
        </main>

        {/* 右侧：盘口 + 最新成交 */}
        <aside className="w-72 bg-black/30 backdrop-blur-sm border-l border-white/10 flex flex-col">
          <div className="flex-1 overflow-hidden border-b border-white/10">
            <OrderBook characterId={selectedCharacter?.id} />
          </div>
          <div className="h-48 overflow-hidden">
            <RecentTrades characterId={selectedCharacter?.id} />
          </div>
        </aside>
      </div>

      {/* 底部：持仓 + 订单 */}
      <div className="relative z-10 h-44 mx-4 mb-4 flex gap-4">
        <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <MyPositions />
        </div>
        <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <MyOrders />
        </div>
      </div>

      {showEvent && <EventModal onClose={() => setShowEvent(false)} />}
    </div>
  )
}
