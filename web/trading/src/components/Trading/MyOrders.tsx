interface Order {
  id: string
  character: string
  side: 'buy' | 'sell'
  type: 'limit' | 'market'
  price: number
  quantity: number
  filled: number
  status: 'pending' | 'partial' | 'filled' | 'cancelled'
  time: string
}

export function MyOrders() {
  // Demo data
  const orders: Order[] = [
    { id: '1', character: '初音未来', side: 'buy', type: 'limit', price: 1200, quantity: 100, filled: 0, status: 'pending', time: '12:30:00' },
    { id: '2', character: '雷电将军', side: 'sell', type: 'limit', price: 2200, quantity: 50, filled: 30, status: 'partial', time: '12:25:00' },
    { id: '3', character: '甘雨', side: 'buy', type: 'limit', price: 1800, quantity: 80, filled: 80, status: 'filled', time: '12:20:00' },
  ]

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-warning'
      case 'partial': return 'text-primary'
      case 'filled': return 'text-success'
      case 'cancelled': return 'text-foreground/50'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '待成交'
      case 'partial': return '部分成交'
      case 'filled': return '已成交'
      case 'cancelled': return '已取消'
    }
  }

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="p-2 border-b border-border font-semibold">
        当前委托
      </div>

      {/* Header */}
      <div className="grid grid-cols-7 px-2 py-1 text-foreground/50 border-b border-border">
        <span>角色</span>
        <span>方向</span>
        <span className="text-right">价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">已成交</span>
        <span className="text-right">状态</span>
        <span className="text-right">操作</span>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto">
        {orders.map((order) => (
          <div key={order.id} className="grid grid-cols-7 px-2 py-1.5 hover:bg-card">
            <span>{order.character}</span>
            <span className={order.side === 'buy' ? 'text-success' : 'text-danger'}>
              {order.side === 'buy' ? '买入' : '卖出'}
            </span>
            <span className="text-right text-foreground/50">{order.price}</span>
            <span className="text-right">{order.quantity}</span>
            <span className="text-right text-foreground/50">{order.filled}</span>
            <span className={`text-right ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            <span className="text-right">
              {order.status === 'pending' && (
                <button className="text-danger hover:underline">撤单</button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
