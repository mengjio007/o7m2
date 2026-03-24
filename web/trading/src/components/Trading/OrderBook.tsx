import { useState, useEffect } from 'react'
import { characterApi } from '@/services/api'

interface OrderLevel {
  price: number
  quantity: number
}

interface Props {
  characterId?: string
}

export function OrderBook({ characterId }: Props) {
  const [asks, setAsks] = useState<OrderLevel[]>([])
  const [bids, setBids] = useState<OrderLevel[]>([])
  const [lastPrice, setLastPrice] = useState(0)
  const [changeRate, setChangeRate] = useState(0)

  useEffect(() => {
    if (!characterId) return
    loadOrderBook()
    const interval = setInterval(loadOrderBook, 3000)
    return () => clearInterval(interval)
  }, [characterId])

  const loadOrderBook = async () => {
    if (!characterId) return
    try {
      const res: any = await characterApi.getOrderBook(characterId)
      setAsks(res.asks || [])
      setBids(res.bids || [])
      setLastPrice(res.lastPrice || 0)
      setChangeRate(res.changeRate || 0)
    } catch (error) {
      console.error('Failed to load orderbook:', error)
    }
  }

  const maxQuantity = Math.max(
    ...asks.map(a => a.quantity),
    ...bids.map(b => b.quantity),
    1
  )

  let askCumulative = 0
  let bidCumulative = 0

  return (
    <div className="h-full flex flex-col text-sm text-white">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">📊</span>
        <span className="font-bold">订单簿</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-white/50">
        <span>价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">累计</span>
      </div>

      {/* Asks */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        {asks.slice(0, 10).map((level, i) => {
          askCumulative += level.quantity
          return (
            <div key={i} className="grid grid-cols-3 px-3 py-1 relative hover:bg-white/5">
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              />
              <span className="text-red-400 font-mono relative">{level.price.toLocaleString()}</span>
              <span className="text-right relative text-white/70">{level.quantity}</span>
              <span className="text-right relative text-white/50">{askCumulative.toLocaleString()}</span>
            </div>
          )
        })}
      </div>

      {/* Last price */}
      <div className={`py-2 px-3 text-center border-y border-white/10 ${
        changeRate >= 0 ? 'bg-red-500/5' : 'bg-green-500/5'
      }`}>
        <div className={`text-xl font-bold font-mono ${
          changeRate >= 0 ? 'text-red-400' : 'text-green-400'
        }`}>
          {lastPrice.toLocaleString()}
        </div>
        <div className={`text-xs ${
          changeRate >= 0 ? 'text-red-400' : 'text-green-400'
        }`}>
          {changeRate >= 0 ? '📈' : '📉'} {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%
        </div>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-y-auto">
        {bids.slice(0, 10).map((level, i) => {
          bidCumulative += level.quantity
          return (
            <div key={i} className="grid grid-cols-3 px-3 py-1 relative hover:bg-white/5">
              <div
                className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              />
              <span className="text-green-400 font-mono relative">{level.price.toLocaleString()}</span>
              <span className="text-right relative text-white/70">{level.quantity}</span>
              <span className="text-right relative text-white/50">{bidCumulative.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
