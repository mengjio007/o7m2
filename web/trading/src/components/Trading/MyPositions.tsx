interface Holding {
  name: string
  quantity: number
  avgCost: number
  currentPrice: number
  profit: number
  profitRate: number
}

export function MyPositions() {
  // Demo data
  const holdings: Holding[] = [
    { name: '初音未来', quantity: 100, avgCost: 1200, currentPrice: 1250, profit: 5000, profitRate: 4.17 },
    { name: '雷电将军', quantity: 50, avgCost: 2000, currentPrice: 2100, profit: 5000, profitRate: 5.0 },
    { name: '甘雨', quantity: 80, avgCost: 1900, currentPrice: 1850, profit: -4000, profitRate: -2.63 },
  ]

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="p-2 border-b border-border font-semibold">
        我的持仓
      </div>

      {/* Header */}
      <div className="grid grid-cols-6 px-2 py-1 text-foreground/50 border-b border-border">
        <span>角色</span>
        <span className="text-right">持有</span>
        <span className="text-right">成本</span>
        <span className="text-right">现价</span>
        <span className="text-right">盈亏</span>
        <span className="text-right">收益率</span>
      </div>

      {/* Holdings */}
      <div className="flex-1 overflow-y-auto">
        {holdings.map((holding, i) => (
          <div key={i} className="grid grid-cols-6 px-2 py-1.5 hover:bg-card">
            <span>{holding.name}</span>
            <span className="text-right">{holding.quantity}</span>
            <span className="text-right text-foreground/50">{holding.avgCost}</span>
            <span className="text-right">{holding.currentPrice}</span>
            <span className={`text-right ${holding.profit >= 0 ? 'text-success' : 'text-danger'}`}>
              {holding.profit >= 0 ? '+' : ''}{holding.profit.toLocaleString()}
            </span>
            <span className={`text-right ${holding.profitRate >= 0 ? 'text-success' : 'text-danger'}`}>
              {holding.profitRate >= 0 ? '+' : ''}{holding.profitRate.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
