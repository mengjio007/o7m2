import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { tradingApi, accountApi } from '@/services/api'

interface Character {
  id: string
  name: string
  current_price: number
}

interface Props {
  character: Character | null
}

export function TradingForm({ character }: Props) {
  const { isAuthenticated } = useAuthStore()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      accountApi.getAccount().then((res: any) => {
        setBalance(res.account?.balance || 0)
      }).catch(console.error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (character?.current_price) {
      setPrice(String(character.current_price))
    }
  }, [character])

  const totalAmount = Number(price) * Number(quantity) || 0

  const handleSubmit = async () => {
    if (!character) {
      alert('请先选择一个角色哦~')
      return
    }
    if (!price || !quantity) {
      alert('请输入价格和数量')
      return
    }
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    setLoading(true)
    try {
      await tradingApi.createOrder({
        character_id: character.id,
        side,
        type: 'limit',
        price: Number(price),
        quantity: Number(quantity),
      })
      alert(side === 'buy' ? '买入下单成功!' : '卖出下单成功!')
      setQuantity('')
    } catch (error: any) {
      alert(error.message || '下单失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 买入卖出切换 */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${
            side === 'buy'
              ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          💰 买入
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${
            side === 'sell'
              ? 'bg-red-500/20 text-red-400 border-b-2 border-red-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          💸 卖出
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 p-3 flex flex-col gap-3">
        {/* 价格输入 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/50">价格</span>
            <span className="text-xs text-white/30">可用: {balance.toLocaleString()}</span>
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setPrice(String(Math.max(0, Math.round(Number(price) * 0.99))))}
              className="w-12 py-2 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 border border-white/10"
            >
              -1%
            </button>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-sm placeholder-white/30 focus:border-purple-500/50 focus:outline-none"
            />
            <button 
              onClick={() => setPrice(String(Math.round(Number(price) * 1.01)))}
              className="w-12 py-2 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 border border-white/10"
            >
              +1%
            </button>
          </div>
        </div>

        {/* 数量输入 */}
        <div>
          <div className="text-xs text-white/50 mb-1.5">数量</div>
          <div className="flex gap-1.5 mb-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  const maxQty = price ? Math.floor(balance / Number(price)) : 0
                  setQuantity(String(Math.floor(maxQty * pct / 100)))
                }}
                className="flex-1 py-1.5 bg-white/5 text-white/60 rounded-lg text-xs hover:bg-white/10 border border-white/10"
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
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-sm placeholder-white/30 focus:border-purple-500/50 focus:outline-none"
          />
        </div>

        {/* 合计 */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">合计</span>
            <span className="text-lg font-bold text-white">
              {totalAmount.toLocaleString()}
              <span className="text-xs text-white/40 ml-1">人气值</span>
            </span>
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!character || loading}
          className={`w-full py-3 rounded-xl font-bold text-white text-base transition-all ${
            side === 'buy'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/20'
              : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 shadow-lg shadow-red-500/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? '⏳ 处理中...' : side === 'buy' ? `🚀 买入 ${character?.name || ''}` : `💸 卖出 ${character?.name || ''}`}
        </button>
      </div>
    </div>
  )
}
