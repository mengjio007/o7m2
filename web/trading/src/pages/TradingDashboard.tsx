import { useState, useEffect } from 'react'
import { CharacterList } from '@/components/Trading/CharacterList'
import { KLineChart } from '@/components/Chart/KLineChart'
import { OrderBook } from '@/components/Trading/OrderBook'
import { RecentTrades } from '@/components/Trading/RecentTrades'
import { TradingForm } from '@/components/Trading/TradingForm'
import { MyPositions } from '@/components/Trading/MyPositions'
import { MyOrders } from '@/components/Trading/MyOrders'
import { EventModal } from '@/components/Event/EventModal'
import { useAuthStore } from '@/store/auth'
import { accountApi } from '@/services/api'

interface Character {
  id: string
  name: string
  category: 'virtual' | 'historical' | 'novel'
  avatar: string
  current_price: number
  change_rate: number
}

interface Ticker {
  last_price: number
  change_rate: number
  volume: number
}

const categoryLabels = {
  virtual: { label: '虚拟人物', color: 'bg-cat-virtual/10 text-cat-virtual border-cat-virtual/30' },
  historical: { label: '历史人物', color: 'bg-cat-historical/10 text-cat-historical border-cat-historical/30' },
  novel: { label: '小说人物', color: 'bg-cat-novel/10 text-cat-novel border-cat-novel/30' },
}

export function TradingDashboard() {
  const { isAuthenticated, user, logout, setAccount } = useAuthStore()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [ticker, setTicker] = useState<Ticker | null>(null)
  const [showEvent, setShowEvent] = useState(false)

  // Load account info when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      accountApi.getAccount().then((res: any) => {
        setAccount(res.account)
      }).catch(console.error)
    }
  }, [isAuthenticated])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-sm border-b-2 border-primary/20 flex items-center px-6 justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ✨ 偶气满满
          </h1>
          <nav className="flex gap-2">
            <a href="/" className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium shadow-cute">
              💹 交易
            </a>
            <a href="/mining" className="px-4 py-2 rounded-full text-foreground/70 hover:bg-primary/10 text-sm transition-all">
              ⛏️ 应援挖矿
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEvent(true)}
            className="px-4 py-2 bg-warning/10 text-warning rounded-full text-sm border border-warning/30 hover:bg-warning/20 transition-all"
          >
            🔔 全站事件
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/60">👋 {user?.username}</span>
              <button 
                onClick={logout}
                className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground"
              >
                退出
              </button>
            </div>
          ) : (
            <a href="/login" className="btn-primary text-sm">
              登录 ✌️
            </a>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left: Character List */}
        <aside className="w-72 card-cute overflow-hidden flex flex-col">
          <CharacterList 
            onSelect={setSelectedCharacter}
            selectedId={selectedCharacter?.id}
          />
        </aside>

        {/* Center: Chart + Trading Form */}
        <main className="flex-1 flex flex-col gap-4">
          {selectedCharacter ? (
            <div className="card-cute p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-light to-accent-light flex items-center justify-center text-2xl shadow-cute">
                  🎭
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">{selectedCharacter.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryLabels[selectedCharacter.category].color}`}>
                      {categoryLabels[selectedCharacter.category].label}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/60 mt-1">
                    ID: {selectedCharacter.id}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {selectedCharacter.current_price.toLocaleString()}
                  <span className="text-sm text-foreground/50 ml-1">人气值</span>
                </div>
                <div className={`text-lg font-medium ${selectedCharacter.change_rate >= 0 ? 'text-up' : 'text-down'}`}>
                  {selectedCharacter.change_rate >= 0 ? '📈 +' : '📉 '}{selectedCharacter.change_rate.toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="card-cute p-8 flex items-center justify-center">
              <div className="text-center text-foreground/50">
                <div className="text-4xl mb-2">🎮</div>
                <div>选择一个角色开始交易吧~</div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 card-cute overflow-hidden">
            <KLineChart characterId={selectedCharacter?.id} />
          </div>

          <div className="h-48 card-cute">
            <TradingForm character={selectedCharacter} ticker={ticker} />
          </div>
        </main>

        {/* Right: OrderBook + Recent Trades */}
        <aside className="w-80 flex flex-col gap-4">
          <div className="flex-1 min-h-0 card-cute overflow-hidden">
            <OrderBook characterId={selectedCharacter?.id} />
          </div>
          <div className="h-52 card-cute overflow-hidden">
            <RecentTrades characterId={selectedCharacter?.id} />
          </div>
        </aside>
      </div>

      {/* Bottom: Positions + Orders */}
      <footer className="h-48 mx-4 mb-4 flex gap-4">
        <div className="flex-1 card-cute overflow-hidden">
          <MyPositions />
        </div>
        <div className="flex-1 card-cute overflow-hidden">
          <MyOrders />
        </div>
      </footer>

      {showEvent && (
        <EventModal onClose={() => setShowEvent(false)} />
      )}
    </div>
  )
}
