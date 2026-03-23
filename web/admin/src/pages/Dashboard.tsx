import { 
  Users, 
  Star, 
  TrendingUp, 
  Activity 
} from 'lucide-react'

export function Dashboard() {
  const stats = [
    { label: '总用户数', value: '12,345', icon: Users, change: '+12%' },
    { label: '角色数量', value: '48', icon: Star, change: '+3' },
    { label: '今日交易量', value: '1.2M', icon: TrendingUp, change: '+8%' },
    { label: '活跃矿工', value: '2,341', icon: Activity, change: '+15%' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">数据概览</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="text-primary" size={20} />
              <span className="text-xs text-success">{stat.change}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-foreground/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border font-semibold">
          最近活动
        </div>
        <div className="divide-y divide-border">
          {[
            { time: '2分钟前', event: '新用户注册: user_12345', type: 'user' },
            { time: '5分钟前', event: '角色「初音未来」价格突破 2000', type: 'price' },
            { time: '10分钟前', event: '全站挖矿产出达到 8,500', type: 'mining' },
            { time: '15分钟前', event: '大事件触发: 限时双倍活动', type: 'event' },
            { time: '20分钟前', event: '新角色「纳西妲」上线', type: 'character' },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between text-sm">
              <span>{item.event}</span>
              <span className="text-foreground/50">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
