import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { accountApi, tradingApi, characterApi } from '@/services/api'

interface Holding {
  character_id: string
  character_name: string
  quantity: number
  avg_cost: number
}

interface Order {
  id: string
  character_id: string
  side: string
  price: number
  quantity: number
  filled_qty: number
  status: string
}

export function Profile() {
  const { user, logout } = useAuthStore()
  const [account, setAccount] = useState<any>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'holdings' | 'orders'>('holdings')

  useEffect(() => {
    if (user) {
      accountApi.getAccount().then((res: any) => {
        setAccount(res.account)
      }).catch(console.error)

      accountApi.getHoldings().then((res: any) => {
        setHoldings(res.holdings || [])
      }).catch(console.error)

      tradingApi.getOrders().then((res: any) => {
        setOrders(res.orders || [])
      }).catch(console.error)
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-foreground/60 mb-4">请先登录</p>
          <Link to="/login" className="btn-primary">前往登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
      {/* Header */}
      <header className="h-20 bg-white/60 backdrop-blur-md border-b border-pink-200 flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
            ✨ 偶气满满
          </Link>
          <nav className="flex gap-3">
            <Link to="/" className="px-4 py-2 rounded-full text-foreground/70 hover:bg-pink-100 text-sm transition-all">
              💹 交易
            </Link>
            <Link to="/mining" className="px-4 py-2 rounded-full text-foreground/70 hover:bg-purple-100 text-sm transition-all">
              ⛏️ 挖矿
            </Link>
            <Link to="/wiki" className="px-4 py-2 rounded-full text-foreground/70 hover:bg-cyan-100 text-sm transition-all">
              📖 百科
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/listing" className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all">
            🎯 申请上市
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-xl shadow-md">
              {user.avatar || '🎭'}
            </div>
            <span className="text-foreground/70">{user.username}</span>
            <button onClick={logout} className="text-foreground/50 hover:text-pink-500 text-sm">
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-8 py-8">
        {/* User Profile Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-pink-100">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-300 via-purple-400 to-cyan-400 flex items-center justify-center text-5xl shadow-lg transform hover:scale-105 transition-transform">
              {user.avatar || '🎭'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                {user.username}
              </h1>
              <p className="text-foreground/50">{user.email}</p>
              <div className="flex gap-6 mt-4">
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl px-6 py-3">
                  <div className="text-2xl font-bold text-pink-500">{account?.balance?.toLocaleString() || 0}</div>
                  <div className="text-xs text-pink-400">可用人气值</div>
                </div>
                <div className="bg-gradient-to-r from-purple-100 to-cyan-100 rounded-xl px-6 py-3">
                  <div className="text-2xl font-bold text-purple-500">{holdings.length}</div>
                  <div className="text-xs text-purple-400">持有角色</div>
                </div>
                <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl px-6 py-3">
                  <div className="text-2xl font-bold text-cyan-500">{orders.filter(o => o.status === 'pending').length}</div>
                  <div className="text-xs text-cyan-400">活跃订单</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link to="/listing" className="group bg-white/70 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-pink-100 hover:border-pink-300">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="font-bold text-lg mb-1">申请上市</h3>
            <p className="text-sm text-foreground/50">为你喜欢的角色申请上市</p>
          </Link>
          <Link to="/wiki" className="group bg-white/70 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-purple-100 hover:border-purple-300">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📖</div>
            <h3 className="font-bold text-lg mb-1">角色百科</h3>
            <p className="text-sm text-foreground/50">查看所有角色详情</p>
          </Link>
          <Link to="/mining" className="group bg-white/70 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-cyan-100 hover:border-cyan-300">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⛏️</div>
            <h3 className="font-bold text-lg mb-1">应援挖矿</h3>
            <p className="text-sm text-foreground/50">为角色应援获取奖励</p>
          </Link>
        </div>

        {/* Holdings & Orders */}
        <div className="grid grid-cols-2 gap-8">
          {/* Holdings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-4">
              <h2 className="text-xl font-bold text-white">�我的持仓</h2>
            </div>
            <div className="p-4">
              {holdings.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  暂无持仓,快去交易吧~
                </div>
              ) : (
                <div className="space-y-3">
                  {holdings.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">🎭</div>
                        <div>
                          <div className="font-medium">{h.character_name || h.character_id}</div>
                          <div className="text-xs text-foreground/50">成本: {h.avg_cost}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-pink-500">{h.quantity}</div>
                        <div className="text-xs text-foreground/50">份额</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-400 to-cyan-400 px-6 py-4">
              <h2 className="text-xl font-bold text-white">📋 我的订单</h2>
            </div>
            <div className="p-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  暂无订单
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <div>
                        <div className="font-medium">
                          <span className={o.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                            {o.side === 'buy' ? '买入' : '卖出'}
                          </span>
                          {' '}{o.character_id}
                        </div>
                        <div className="text-xs text-foreground/50">
                          {o.price} x {o.quantity - o.filled_qty}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'filled' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {o.status === 'pending' ? '待成交' : o.status === 'filled' ? '已成交' : o.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
