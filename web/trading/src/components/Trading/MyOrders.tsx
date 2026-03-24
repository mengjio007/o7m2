import { useState, useEffect } from 'react'
import { tradingApi } from '@/services/api'

interface Order {
  id: string
  character_id: string
  side: 'buy' | 'sell'
  price: number
  quantity: number
  filled_qty: number
  status: 'pending' | 'partial' | 'filled' | 'cancelled'
}

export function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      const res: any = await tradingApi.getOrders()
      setOrders(res.orders || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const handleCancel = async (orderId: string) => {
    if (loading) return
    setLoading(true)
    try {
      await tradingApi.cancelOrder(orderId)
      await loadOrders()
    } catch (error) {
      alert('撤单失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待成交'
      case 'partial': return '部分成交'
      case 'filled': return '已成交'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  return (
    <div className="h-full flex flex-col text-sm text-white">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">📋</span>
        <span className="font-bold">当前委托</span>
        <span className="text-xs text-white/50">({orders.length})</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-6 px-3 py-2 text-xs text-white/50">
        <span>角色</span>
        <span>方向</span>
        <span className="text-right">价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">状态</span>
        <span className="text-right">操作</span>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center text-white/30 py-8">暂无委托</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="grid grid-cols-6 px-3 py-2 hover:bg-white/5 items-center">
              <span className="font-medium">{order.character_id}</span>
              <span className={order.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                {order.side === 'buy' ? '买入' : '卖出'}
              </span>
              <span className="text-right font-mono">{order.price}</span>
              <span className="text-right font-mono">{order.quantity - order.filled_qty}</span>
              <span className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  order.status === 'filled' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'partial' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-white/10 text-white/50'
                }`}>
                  {getStatusText(order.status)}
                </span>
              </span>
              <span className="text-right">
                {(order.status === 'pending' || order.status === 'partial') && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={loading}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    撤单
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
