interface Holding {
  name: string
  avatar: string
  quantity: number
  avgCost: number
  currentPrice: number
  profit: number
  profitRate: number
}

export function MyPositions() {
  // Demo data
  const holdings: Holding[] = [
    { name: '初音未来', avatar: '🎤', quantity: 100, avgCost: 1200, currentPrice: 1500, profit: 30000, profitRate: 25.0 },
    { name: '雷电将军', avatar: '⚡', quantity: 50, avgCost: 1800, currentPrice: 2000, profit: 10000, profitRate: 11.11 },
    { name: '李白', avatar: '🍶', quantity: 80, avgCost: 1900, currentPrice: 1800, profit: -8000, profitRate: -5.26 },
  ]

  const totalProfit = holdings.reduce((sum, h) => sum + h.profit, 0)

  return (
    <div className="h-full flex flex-col text-sm">
      {/* 头部 */}
      <div className="p-3 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💼</span>
          <span className="font-bold text-foreground">我的持仓</span>
        </div>
        <div className={`text-sm font-medium ${totalProfit >= 0 ? 'text-up' : 'text-down'}`}>
          总盈亏: {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()} 人气值
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-6 px-3 py-2 text-xs text-foreground/50 bg-primary/5">
        <span>角色</span>
        <span className="text-right">持有</span>
        <span className="text-right">成本</span>
        <span className="text-right">现价</span>
        <span className="text-right">盈亏</span>
        <span className="text-right">收益率</span>
      </div>

      {/* 持仓列表 */}
      <div className="flex-1 overflow-y-auto">
        {holdings.map((holding, i) => (
          <div key={i} className="grid grid-cols-6 px-3 py-2.5 hover:bg-primary/5 transition-colors items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">{holding.avatar}</span>
              <span className="font-medium">{holding.name}</span>
            </div>
            <span className="text-right">{holding.quantity}</span>
            <span className="text-right text-foreground/50">{holding.avgCost.toLocaleString()}</span>
            <span className="text-right font-medium">{holding.currentPrice.toLocaleString()}</span>
            <span className={`text-right font-medium ${holding.profit >= 0 ? 'text-up' : 'text-down'}`}>
              {holding.profit >= 0 ? '+' : ''}{holding.profit.toLocaleString()}
            </span>
            <span className={`text-right font-medium px-2 py-0.5 rounded ${
              holding.profitRate >= 0 
                ? 'bg-up/10 text-up' 
                : 'bg-down/10 text-down'
            }`}>
              {holding.profitRate >= 0 ? '+' : ''}{holding.profitRate.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {holdings.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-foreground/40">
          <div className="text-center">
            <div className="text-3xl mb-2">📭</div>
            <div>还没有持仓哦，快去交易吧~</div>
          </div>
        </div>
      )}
    </div>
  )
}
