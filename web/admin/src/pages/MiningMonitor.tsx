import { useState } from 'react'

export function MiningMonitor() {
  const [stats] = useState({
    activeMiners: 2341,
    totalHashRate: 125000,
    currentDifficulty: 5,
    hourlyOutput: 7850,
    hourlyTarget: 10000,
  })

  const recentMining = [
    { user: 'user_12345', character: '初音未来', reward: 75, hashRate: 12500, time: '2秒前' },
    { user: 'user_23456', character: '雷电将军', reward: 110, hashRate: 18200, time: '5秒前' },
    { user: 'user_34567', character: '甘雨', reward: 50, hashRate: 8500, time: '8秒前' },
    { user: 'user_45678', character: '纳西妲', reward: 160, hashRate: 25000, time: '12秒前' },
    { user: 'user_56789', character: '初音未来', reward: 75, hashRate: 11800, time: '15秒前' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">挖矿监控</h1>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.activeMiners.toLocaleString()}</div>
          <div className="text-xs text-foreground/50">在线矿工</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.totalHashRate.toLocaleString()} H/s</div>
          <div className="text-xs text-foreground/50">全站算力</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.currentDifficulty}</div>
          <div className="text-xs text-foreground/50">当前难度</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.hourlyOutput.toLocaleString()}</div>
          <div className="text-xs text-foreground/50">本小时产出</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.hourlyTarget.toLocaleString()}</div>
          <div className="text-xs text-foreground/50">目标产出</div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-lg border border-border p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">本小时产出进度</span>
          <span className="text-sm text-foreground/50">
            {stats.hourlyOutput.toLocaleString()} / {stats.hourlyTarget.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(stats.hourlyOutput / stats.hourlyTarget) * 100}%` }}
          />
        </div>
      </div>

      {/* Recent Mining */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border font-semibold">
          实时挖矿记录
        </div>
        <table className="w-full text-sm">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left">用户</th>
              <th className="px-4 py-3 text-left">角色</th>
              <th className="px-4 py-3 text-right">奖励</th>
              <th className="px-4 py-3 text-right">算力</th>
              <th className="px-4 py-3 text-right">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentMining.map((item, i) => (
              <tr key={i} className="hover:bg-background">
                <td className="px-4 py-3">{item.user}</td>
                <td className="px-4 py-3">{item.character}</td>
                <td className="px-4 py-3 text-right text-success">+{item.reward}</td>
                <td className="px-4 py-3 text-right text-foreground/50">{item.hashRate.toLocaleString()} H/s</td>
                <td className="px-4 py-3 text-right text-foreground/50">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
