import { useState } from 'react'

interface Character {
  id: string
  name: string
  current_price: number
}

interface Ticker {
  last_price: number
}

interface Props {
  character: Character | null
  ticker: Ticker | null
}

export function TradingForm({ character, ticker }: Props) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [balance] = useState(10000)

  const totalAmount = Number(price) * Number(quantity) || 0

  const handleSubmit = () => {
    if (!character) {
      alert('请先选择角色')
      return
    }
    console.log('Submit order:', { side, price, quantity })
  }

  return (
    <div className="h-full p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded font-medium transition-colors ${
            side === 'buy'
              ? 'bg-success text-white'
              : 'bg-card text-foreground/50 hover:bg-card/80'
          }`}
        >
          买入
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded font-medium transition-colors ${
            side === 'sell'
              ? 'bg-danger text-white'
              : 'bg-card text-foreground/50 hover:bg-card/80'
          }`}
        >
          卖出
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Price Input */}
        <div>
          <label className="block text-xs text-foreground/50 mb-1">价格</label>
          <div className="flex gap-1">
            <button 
              onClick={() => setPrice(String(Math.round(Number(price) * 0.99)))}
              className="px-2 py-1 bg-card rounded text-xs hover:bg-card/80"
            >
              -1%
            </button>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格"
              className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
            <button 
              onClick={() => setPrice(String(Math.round(Number(price) * 1.01)))}
              className="px-2 py-1 bg-card rounded text-xs hover:bg-card/80"
            >
              +1%
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-xs text-foreground/50 mb-1">数量</label>
          <div className="flex gap-1 mb-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  const maxQty = price ? Math.floor(balance / Number(price)) : 0
                  setQuantity(String(Math.floor(maxQty * pct / 100)))
                }}
                className="flex-1 py-1 bg-card rounded text-xs hover:bg-card/80"
              >
                {pct}%
              </button>
            ))}
          </div>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="输入数量"
            className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-card rounded">
        <div className="flex justify-between text-sm">
          <span className="text-foreground/50">合计</span>
          <span className="font-bold">{totalAmount.toLocaleString()} 人气值</span>
        </div>
        <div className="flex justify-between text-xs text-foreground/50 mt-1">
          <span>可用余额</span>
          <span>{balance.toLocaleString()} 人气值</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!character}
        className={`w-full mt-4 py-2 rounded font-medium ${
          side === 'buy'
            ? 'bg-success hover:bg-success/90'
            : 'bg-danger hover:bg-danger/90'
        } text-white disabled:opacity-50`}
      >
        {side === 'buy' ? '买入' : '卖出'} {character?.name || ''}
      </button>
    </div>
  )
}
