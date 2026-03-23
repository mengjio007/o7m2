interface Trade {
  price: number
  quantity: number
  time: string
  isBuy: boolean
}

interface Props {
  characterId?: string
}

export function RecentTrades({ characterId }: Props) {
  // Demo data
  const trades: Trade[] = [
    { price: 1500, quantity: 50, time: '12:34:56', isBuy: true },
    { price: 1499, quantity: 30, time: '12:34:55', isBuy: false },
    { price: 1500, quantity: 80, time: '12:34:54', isBuy: true },
    { price: 1501, quantity: 25, time: '12:34:53', isBuy: true },
    { price: 1500, quantity: 45, time: '12:34:52', isBuy: false },
    { price: 1499, quantity: 60, time: '12:34:51', isBuy: false },
    { price: 1500, quantity: 35, time: '12:34:50', isBuy: true },
  ]

  return (
    <div className="h-full flex flex-col text-sm">
      {/* 头部 */}
      <div className="p-3 border-b border-primary/20 flex items-center gap-2">
        <span className="text-lg">📜</span>
        <span className="font-bold text-foreground">最近成交</span>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-foreground/50 bg-primary/5">
        <span>价格 (人气值)</span>
        <span className="text-right">数量</span>
        <span className="text-right">时间</span>
      </div>

      {/* 成交列表 */}
      <div className="flex-1 overflow-y-auto">
        {trades.map((trade, i) => (
          <div key={i} className="grid grid-cols-3 px-3 py-1.5 hover:bg-primary/5 transition-colors">
            <span className={`font-medium ${trade.isBuy ? 'text-down' : 'text-up'}`}>
              {trade.isBuy ? '↓' : '↑'} {trade.price.toLocaleString()}
            </span>
            <span className="text-right text-foreground/70">{trade.quantity}</span>
            <span className="text-right text-foreground/50">{trade.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
