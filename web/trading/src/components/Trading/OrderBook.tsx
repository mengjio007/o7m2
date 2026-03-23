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
    <div className="h-full flex flex-col text-sm">
      {/* 头部 */}
      <div className="p-3 border-b border-primary/20 flex items-center gap-2">
        <span className="text-lg">📊</span>
        <span className="font-bold text-foreground">订单簿</span>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-foreground/50 bg-primary/5">
        <span>价格 (人气值)</span>
        <span className="text-right">数量</span>
        <span className="text-right">累计</span>
      </div>

      {/* 卖单（价格升序） */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        {asks.slice().reverse().map((level, i) => {
          askCumulative += level.quantity
          return (
            <div key={i} className="grid grid-cols-3 px-3 py-1.5 relative hover:bg-up/5 transition-colors">
              {/* 深度条背景 */}
              <div 
                className="absolute right-0 top-0 bottom-0 bg-up/10"
                style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              />
              <span className="text-up font-medium relative">{level.price.toLocaleString()}</span>
              <span className="text-right relative text-foreground/70">{level.quantity}</span>
              <span className="text-right relative text-foreground/50">
                {askCumulative.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {/* 最新价 */}
      <div className={`py-3 px-3 text-center border-y-2 border-primary/20 ${
        changeRate >= 0 ? 'bg-up/5' : 'bg-down/5'
      }`}>
        <div className={`text-2xl font-bold ${
          changeRate >= 0 ? 'text-up' : 'text-down'
        }`}>
          {lastPrice.toLocaleString()}
        </div>
        <div className={`text-sm ${
          changeRate >= 0 ? 'text-up' : 'text-down'
        }`}>
          {changeRate >= 0 ? '📈' : '📉'} {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%
        </div>
      </div>

      {/* 买单（价格降序） */}
      <div className="flex-1 overflow-y-auto">
        {bids.map((level, i) => {
          bidCumulative += level.quantity
          return (
            <div key={i} className="grid grid-cols-3 px-3 py-1.5 relative hover:bg-down/5 transition-colors">
              <div 
                className="absolute right-0 top-0 bottom-0 bg-down/10"
                style={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              />
              <span className="text-down font-medium relative">{level.price.toLocaleString()}</span>
              <span className="text-right relative text-foreground/70">{level.quantity}</span>
              <span className="text-right relative text-foreground/50">
                {bidCumulative.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
