import { useState, useEffect } from 'react'
import { tradingApi } from '@/services/api'

interface Holding {
  character_id: string
  quantity: number
  avg_cost: number
}

export function MyPositions() {
  const [holdings, setHoldings] = useState<Holding[]>([])

  useEffect(() => {
    loadPositions()
    const interval = setInterval(loadPositions, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadPositions = async () => {
    try {
      const res: any = await tradingApi.getPositions()
      setHoldings(res.positions || [])
    } catch (error) {
      console.error('Failed to load positions:', error)
    }
  }

  return (
    <div className="h-full flex flex-col text-sm text-white">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">💼</span>
        <span className="font-bold">我的持仓</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 px-3 py-2 text-xs text-white/50">
        <span>角色</span>
        <span className="text-right">持有</span>
        <span className="text-right">成本</span>
        <span className="text-right">价值</span>
      </div>

      {/* Holdings list */}
      <div className="flex-1 overflow-y-auto">
        {holdings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/30 py-8">
            暂无持仓
          </div>
        ) : (
          holdings.map((holding, i) => (
            <div key={i} className="grid grid-cols-4 px-3 py-2 hover:bg-white/5 items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-sm">🎭</div>
                <span className="font-medium text-sm">{holding.character_id}</span>
              </div>
              <span className="text-right font-mono">{holding.quantity}</span>
              <span className="text-right text-white/50 font-mono">{holding.avg_cost}</span>
              <span className="text-right text-emerald-400 font-mono">
                {(holding.quantity * holding.avg_cost).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
