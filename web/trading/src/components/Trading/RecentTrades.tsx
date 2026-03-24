import { useState, useEffect } from 'react'
import { characterApi } from '@/services/api'

interface Trade {
  price: number
  quantity: number
  created_at: string
}

interface Props {
  characterId?: string
}

export function RecentTrades({ characterId }: Props) {
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    if (!characterId) return
    loadTrades()
    const interval = setInterval(loadTrades, 5000)
    return () => clearInterval(interval)
  }, [characterId])

  const loadTrades = async () => {
    if (!characterId) return
    try {
      const res: any = await characterApi.getTrades(characterId, 20)
      setTrades(res.trades || [])
    } catch (error) {
      console.error('Failed to load trades:', error)
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '--:--'
    const d = new Date(dateStr)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col text-sm text-white">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">📜</span>
        <span className="font-bold">最近成交</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-white/50">
        <span>价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">时间</span>
      </div>

      {/* Trades list */}
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="text-center text-white/30 py-8">暂无成交</div>
        ) : (
          trades.map((trade, i) => (
            <div key={i} className="grid grid-cols-3 px-3 py-1 hover:bg-white/5">
              <span className="text-white/70 font-mono">
                {trade.price?.toLocaleString() || '---'}
              </span>
              <span className="text-right text-white/50">{trade.quantity}</span>
              <span className="text-right text-white/50">{formatTime(trade.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
