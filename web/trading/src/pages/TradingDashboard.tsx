import { useState } from 'react'
import { CharacterList } from '@/components/Trading/CharacterList'
import { KLineChart } from '@/components/Chart/KLineChart'
import { OrderBook } from '@/components/Trading/OrderBook'
import { RecentTrades } from '@/components/Trading/RecentTrades'
import { TradingForm } from '@/components/Trading/TradingForm'
import { MyPositions } from '@/components/Trading/MyPositions'
import { MyOrders } from '@/components/Trading/MyOrders'
import { EventModal } from '@/components/Event/EventModal'

interface Character {
  id: string
  name: string
  category: string
  avatar: string
  current_price: number
  change_rate: number
}

interface Ticker {
  last_price: number
  change_rate: number
  volume: number
}

export function TradingDashboard() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [ticker, setTicker] = useState<Ticker | null>(null)
  const [showEvent, setShowEvent] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">偶气满满</h1>
          <nav className="flex gap-4 text-sm">
            <a href="/" className="text-primary">交易</a>
            <a href="/mining" className="hover:text-primary">应援挖矿</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowEvent(true)}
            className="px-3 py-1 bg-warning/20 text-warning rounded text-sm"
          >
            全站事件
          </button>
          <a href="/login" className="px-4 py-1.5 bg-primary text-background rounded text-sm font-medium">
            登录
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Character List */}
        <aside className="w-64 border-r border-border">
          <CharacterList 
            onSelect={setSelectedCharacter}
            selectedId={selectedCharacter?.id}
          />
        </aside>

        {/* Center: Chart + Trading Form */}
        <main className="flex-1 flex flex-col">
          {/* Price Header */}
          {selectedCharacter && (
            <div className="h-16 border-b border-border flex items-center px-4 gap-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{selectedCharacter.name}</span>
                <span className="text-xs px-2 py-0.5 bg-card rounded">{selectedCharacter.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">
                  {selectedCharacter.current_price.toLocaleString()}
                </span>
                <span className={`text-sm ${selectedCharacter.change_rate >= 0 ? 'text-success' : 'text-danger'}`}>
                  {selectedCharacter.change_rate >= 0 ? '+' : ''}{selectedCharacter.change_rate.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* K-Line Chart */}
          <div className="flex-1 min-h-0">
            <KLineChart characterId={selectedCharacter?.id} />
          </div>

          {/* Trading Form */}
          <div className="h-52 border-t border-border">
            <TradingForm character={selectedCharacter} ticker={ticker} />
          </div>
        </main>

        {/* Right: OrderBook + Recent Trades */}
        <aside className="w-72 border-l border-border flex flex-col">
          <div className="flex-1 min-h-0">
            <OrderBook characterId={selectedCharacter?.id} />
          </div>
          <div className="h-48 border-t border-border">
            <RecentTrades characterId={selectedCharacter?.id} />
          </div>
        </aside>
      </div>

      {/* Bottom: Positions + Orders */}
      <footer className="h-48 border-t border-border flex">
        <div className="flex-1 border-r border-border">
          <MyPositions />
        </div>
        <div className="flex-1">
          <MyOrders />
        </div>
      </footer>

      {/* Event Modal */}
      {showEvent && (
        <EventModal onClose={() => setShowEvent(false)} />
      )}
    </div>
  )
}
