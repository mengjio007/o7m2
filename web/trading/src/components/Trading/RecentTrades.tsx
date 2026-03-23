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
    { price: 1250, quantity: 50, time: '12:34:56', isBuy: true },
    { price: 1249, quantity: 30, time: '12:34:55', isBuy: false },
    { price: 1250, quantity: 80, time: '12:34:54', isBuy: true },
    { price: 1251, quantity: 25, time: '12:34:53', isBuy: true },
    { price: 1250, quantity: 45, time: '12:34:52', isBuy: false },
    { price: 1249, quantity: 60, time: '12:34:51', isBuy: false },
    { price: 1250, quantity: 35, time: '12:34:50', isBuy: true },
  ]

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="p-2 border-b border-border font-semibold">
        最近成交
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 px-2 py-1 text-foreground/50 border-b border-border">
        <span>价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">时间</span>
      </div>

      {/* Trades */}
      <div className="flex-1 overflow-y-auto">
        {trades.map((trade, i) => (
          <div key={i} className="grid grid-cols-3 px-2 py-0.5 hover:bg-card">
            <span className={trade.isBuy ? 'text-success' : 'text-danger'}>
              {trade.price}
            </span>
            <span className="text-right">{trade.quantity}</span>
            <span className="text-right text-foreground/50">{trade.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
