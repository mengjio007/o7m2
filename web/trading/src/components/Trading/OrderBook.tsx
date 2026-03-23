interface OrderLevel {
  price: number
  quantity: number
}

interface Props {
  characterId?: string
}

export function OrderBook({ characterId }: Props) {
  // Demo data
  const asks: OrderLevel[] = [
    { price: 1255, quantity: 150 },
    { price: 1254, quantity: 230 },
    { price: 1253, quantity: 180 },
    { price: 1252, quantity: 320 },
    { price: 1251, quantity: 210 },
  ]

  const bids: OrderLevel[] = [
    { price: 1250, quantity: 280 },
    { price: 1249, quantity: 190 },
    { price: 1248, quantity: 350 },
    { price: 1247, quantity: 160 },
    { price: 1246, quantity: 240 },
  ]

  const lastPrice = 1250
  const changeRate = 5.2
  const maxQuantity = Math.max(...asks.map(a => a.quantity), ...bids.map(b => b.quantity))

  let askCumulative = 0
  let bidCumulative = 0

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="p-2 border-b border-border font-semibold">
        订单簿
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 px-2 py-1 text-foreground/50 border-b border-border">
        <span>价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">累计</span>
      </div>

      {/* Asks (sell orders) */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        {asks.slice().reverse().map((level, i) => {
          askCumulative += level.quantity
          return (
            <div key={i} className="grid grid-cols-3 px-2 py-0.5 relative hover:bg-card">
              <div 
                className="absolute inset-0 bg-danger/10"
                style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              />
              <span className="text-danger relative">{level.price}</span>
              <span className="text-right relative">{level.quantity}</span>
              <span className="text-right relative text-foreground/50">
                {askCumulative}
              </span>
            </div>
          )
        })}
      </div>

      {/* Last Price */}
      <div className={`py-2 px-2 text-center font-bold text-lg border-y border-border ${
        changeRate >= 0 ? 'text-success' : 'text-danger'
      }`}>
        {lastPrice}
        <span className="text-xs ml-2">
          {changeRate >= 0 ? '↑' : '↓'} {Math.abs(changeRate).toFixed(2)}%
        </span>
      </div>

      {/* Bids (buy orders) */}
      <div className="flex-1 overflow-y-auto">
        {bids.map((level, i) => {
          bidCumulative += level.quantity
          return (
            <div key={i} className="grid grid-cols-3 px-2 py-0.5 relative hover:bg-card">
              <div 
                className="absolute inset-0 bg-success/10"
                style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              />
              <span className="text-success relative">{level.price}</span>
              <span className="text-right relative">{level.quantity}</span>
              <span className="text-right relative text-foreground/50">
                {bidCumulative}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
