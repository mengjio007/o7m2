import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { characterApi } from '@/services/api'

interface Character {
  id: string
  name: string
  avatar: string
  category: string
  current_price: number
}

const generateTimeLineData = () => {
  const data = []
  let price = 1500 + Math.random() * 500
  for (let i = 0; i < 120; i++) {
    price += (Math.random() - 0.5) * 20
    data.push({ time: i, price: Math.max(price, 100) })
  }
  return data
}

export function Home() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [timeLineData] = useState(generateTimeLineData())
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    characterApi.list().then((res: any) => {
      setCharacters((res.characters || []).slice(0, 5))
    }).catch(() => {
      setCharacters([
        { id: 'v001', name: '初音未来', avatar: '🎤', category: '虚拟', current_price: 1500 },
        { id: 'v002', name: '雷电将军', avatar: '⚡', category: '虚拟', current_price: 2000 },
        { id: 'v003', name: '孙悟空', avatar: '🐵', category: '小说', current_price: 2200 },
      ])
    })
  }, [])

  const maxPrice = Math.max(...timeLineData.map(d => d.price))
  const minPrice = Math.min(...timeLineData.map(d => d.price))
  const priceRange = maxPrice - minPrice || 1

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* 背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
      <div className="fixed top-20 left-[10%] w-32 md:w-64 h-32 md:h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed top-40 right-[15%] w-48 md:w-96 h-48 md:h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      {/* Header */}
      <header className="relative z-10 h-14 md:h-20 flex items-center px-4 md:px-8 justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <h1 className="text-xl md:text-3xl font-bold">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
            ✨ 偶气满满
          </span>
        </h1>
        {/* 桌面端 */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/wiki" className="text-white/70 hover:text-white text-sm">📖 百科</Link>
          <Link to="/login" className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium">
            登录
          </Link>
        </div>
        {/* 移动端菜单按钮 */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white text-2xl">
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* 移动端菜单 */}
      {menuOpen && (
        <div className="relative z-20 md:hidden bg-black/80 backdrop-blur-md border-b border-white/10 p-4 space-y-3">
          <Link to="/wiki" onClick={() => setMenuOpen(false)} className="block text-white/80 hover:text-white py-2">📖 角色百科</Link>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-center py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium">
            登录
          </Link>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center mb-12 md:mb-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-4">
              <span className="px-3 py-1 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full text-xs md:text-sm text-cyan-300 border border-cyan-400/30">
                🎮 二次元人气交易所
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
              交易你爱的
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
                角色股份
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/60 mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0">
              买卖人气角色，为爱应援挖矿，在这里用数字证明你的热爱
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/register" className="px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-center">
                🚀 立即开始
              </Link>
              <Link to="/wiki" className="px-6 md:px-8 py-3 md:py-3.5 bg-white/10 text-white rounded-2xl font-medium border border-white/20 text-center">
                探索百科
              </Link>
            </div>
          </div>

          {/* 分时线 */}
          <div className="w-full lg:w-[500px] bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/10">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <div>
                <div className="text-white/60 text-xs md:text-sm">初音未来</div>
                <div className="text-2xl md:text-3xl font-bold text-white">1,587.23</div>
              </div>
              <div className="text-green-400 bg-green-400/10 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                +12.45%
              </div>
            </div>
            <svg viewBox="0 0 500 200" className="w-full h-28 md:h-40">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M 0 ${200 - ((timeLineData[0].price - minPrice) / priceRange) * 180} ${timeLineData.map((d, i) => `L ${(i / timeLineData.length) * 500} ${200 - ((d.price - minPrice) / priceRange) * 180}`).join(' ')} L 500 200 L 0 200 Z`}
                fill="url(#lineGrad)"
              />
              <path
                d={`M 0 ${200 - ((timeLineData[0].price - minPrice) / priceRange) * 180} ${timeLineData.map((d, i) => `L ${(i / timeLineData.length) * 500} ${200 - ((d.price - minPrice) / priceRange) * 180}`).join(' ')}`}
                fill="none" stroke="#a855f7" strokeWidth="2"
              />
              <circle cx={500} cy={200 - ((timeLineData[timeLineData.length - 1].price - minPrice) / priceRange) * 180} r="4" fill="#a855f7" />
            </svg>
            <div className="flex justify-between text-[10px] md:text-xs text-white/40 mt-1 md:mt-2">
              <span>09:30</span><span>12:00</span><span>14:00</span><span>16:00</span>
            </div>
          </div>
        </div>

        {/* 热门角色 */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">🔥</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">热门角色</span>
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {characters.map((char) => (
              <Link
                key={char.id}
                to={`/wiki?id=${char.id}`}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-white/10 hover:border-purple-400/50 transition-all"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-2 md:mb-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-pink-400 via-purple-500 to-cyan-400 flex items-center justify-center overflow-hidden shadow-lg">
                  {char.avatar?.startsWith('http') ? (
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl md:text-3xl">{char.avatar || '🎭'}</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-sm md:text-base truncate">{char.name}</div>
                  <div className="text-purple-300 font-mono text-xs md:text-sm">{char.current_price?.toLocaleString() || '---'}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 功能区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          <Link to="/register" className="group bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-pink-500/20">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">📈</div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">实时交易</h3>
            <p className="text-white/50 text-sm">买卖角色股份，感受市场脉动</p>
          </Link>
          <Link to="/register" className="group bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-orange-500/20">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">⛏️</div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">应援挖矿</h3>
            <p className="text-white/50 text-sm">为喜欢的角色挖矿获取奖励</p>
          </Link>
          <Link to="/wiki" className="group bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-2xl md:rounded-3xl p-6 md:py-8 border border-cyan-500/20">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">📖</div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">角色百科</h3>
            <p className="text-white/50 text-sm">深入了解每个角色的故事</p>
          </Link>
        </div>

        {/* 数据 */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 py-6 md:py-8 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">15+</div>
            <div className="text-white/50 text-xs md:text-sm mt-1">可交易角色</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">24/7</div>
            <div className="text-white/50 text-xs md:text-sm mt-1">实时交易</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">100%</div>
            <div className="text-white/50 text-xs md:text-sm mt-1">安全可靠</div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-4 md:py-6 border-t border-white/10 bg-black/30">
        <div className="container mx-auto px-4 text-center text-white/30 text-xs md:text-sm">
          © 2026 偶气满满 - 二次元人气交易所
        </div>
      </footer>
    </div>
  )
}
