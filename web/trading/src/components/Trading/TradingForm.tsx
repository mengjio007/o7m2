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
      alert('请先选择一个角色哦~')
      return
    }
    console.log('Submit order:', { side, price, quantity })
  }

  return (
    <div className="h-full p-4 flex gap-4">
      {/* 买入/卖出切换 */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setSide('buy')}
          className={`px-6 py-3 rounded-cute font-medium transition-all ${
            side === 'buy'
              ? 'bg-gradient-to-r from-down to-down/80 text-white shadow-lg'
              : 'bg-down/10 text-down hover:bg-down/20'
          }`}
        >
          💰 买入
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`px-6 py-3 rounded-cute font-medium transition-all ${
            side === 'sell'
              ? 'bg-gradient-to-r from-up to-up/80 text-white shadow-lg'
              : 'bg-up/10 text-up hover:bg-up/20'
          }`}
        >
          💸 卖出
        </button>
      </div>

      {/* 输入区域 */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* 价格输入 */}
        <div>
          <label className="block text-sm text-foreground/60 mb-2">
            💲 价格 (人气值)
          </label>
          <div className="flex gap-2">
            <button 
              onClick={() => setPrice(String(Math.max(0, Math.round(Number(price) * 0.99))))}
              className="px-3 py-2 bg-primary/10 text-primary rounded-cute text-sm hover:bg-primary/20 transition-all"
            >
              -1%
            </button>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格"
              className="input-cute flex-1 text-center"
            />
            <button 
              onClick={() => setPrice(String(Math.round(Number(price) * 1.01)))}
              className="px-3 py-2 bg-primary/10 text-primary rounded-cute text-sm hover:bg-primary/20 transition-all"
            >
              +1%
            </button>
          </div>
        </div>

        {/* 数量输入 */}
        <div>
          <label className="block text-sm text-foreground/60 mb-2">
            📦 数量 (份额)
          </label>
          <div className="flex gap-2 mb-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  const maxQty = price ? Math.floor(balance / Number(price)) : 0
                  setQuantity(String(Math.floor(maxQty * pct / 100)))
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  pct === 100 
                    ? 'bg-accent/10 text-accent hover:bg-accent/20' 
                    : 'bg-primary/5 text-foreground/60 hover:bg-primary/10'
                }`}
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
            className="input-cute w-full text-center"
          />
        </div>
      </div>

      {/* 合计和提交 */}
      <div className="w-48 flex flex-col justify-between">
        {/* 合计 */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-cute p-4">
          <div className="text-xs text-foreground/50 mb-1">💰 合计</div>
          <div className="text-xl font-bold text-primary">
            {totalAmount.toLocaleString()}
            <span className="text-xs text-foreground/50 ml-1">人气值</span>
          </div>
          <div className="text-xs text-foreground/50 mt-2">
            可用: {balance.toLocaleString()} 人气值
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!character}
          className={`w-full py-3 rounded-cute font-bold text-white transition-all ${
            side === 'buy'
              ? 'bg-gradient-to-r from-down to-down/80 hover:shadow-lg hover:scale-105'
              : 'bg-gradient-to-r from-up to-up/80 hover:shadow-lg hover:scale-105'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          {side === 'buy' ? '🚀 立即买入' : '💸 立即卖出'}
          {character && ` ${character.name}`}
        </button>
      </div>
    </div>
  )
}
