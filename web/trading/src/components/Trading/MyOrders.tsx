interface Order {
  id: string
  character: string
  avatar: string
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
    { id: '1', character: '初音未来', avatar: '🎤', side: 'buy', type: 'limit', price: 1200, quantity: 100, filled: 0, status: 'pending', time: '12:30:00' },
    { id: '2', character: '雷电将军', avatar: '⚡', side: 'sell', type: 'limit', price: 2200, quantity: 50, filled: 30, status: 'partial', time: '12:25:00' },
    { id: '3', character: '李白', avatar: '🍶', side: 'buy', type: 'limit', price: 1800, quantity: 80, filled: 80, status: 'filled', time: '12:20:00' },
  ]

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { text: '待成交', color: 'bg-warning/10 text-warning', icon: '⏳' }
      case 'partial': return { text: '部分成交', color: 'bg-primary/10 text-primary', icon: '📊' }
      case 'filled': return { text: '已成交', color: 'bg-success/10 text-success', icon: '✅' }
      case 'cancelled': return { text: '已取消', color: 'bg-foreground/10 text-foreground/50', icon: '❌' }
    }
  }

  return (
    <div className="h-full flex flex-col text-sm">
      {/* 头部 */}
      <div className="p-3 border-b border-primary/20 flex items-center gap-2">
        <span className="text-lg">📋</span>
        <span className="font-bold text-foreground">当前委托</span>
        <span className="text-xs text-foreground/50">({orders.length})</span>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-7 px-3 py-2 text-xs text-foreground/50 bg-primary/5">
        <span>角色</span>
        <span>方向</span>
        <span className="text-right">价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">已成交</span>
        <span className="text-right">状态</span>
        <span className="text-right">操作</span>
      </div>

      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto">
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status)
          return (
            <div key={order.id} className="grid grid-cols-7 px-3 py-2.5 hover:bg-primary/5 transition-colors items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">{order.avatar}</span>
                <span className="font-medium">{order.character}</span>
              </div>
              <span className={`font-medium ${order.side === 'buy' ? 'text-down' : 'text-up'}`}>
                {order.side === 'buy' ? '💰买入' : '💸卖出'}
              </span>
              <span className="text-right text-foreground/60">{order.price.toLocaleString()}</span>
              <span className="text-right">{order.quantity}</span>
              <span className="text-right text-foreground/60">
                {order.filled}/{order.quantity}
              </span>
              <span className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                  {statusInfo.icon} {statusInfo.text}
                </span>
              </span>
              <span className="text-right">
                {order.status === 'pending' && (
                  <button className="text-xs px-2 py-1 bg-up/10 text-up rounded-full hover:bg-up/20 transition-colors">
                    撤单
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* 空状态 */}
      {orders.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-foreground/40">
          <div className="text-center">
            <div className="text-3xl mb-2">📭</div>
            <div>暂无委托订单</div>
          </div>
        </div>
      )}
    </div>
  )
}
