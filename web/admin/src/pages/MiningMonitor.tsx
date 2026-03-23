import { useState, useEffect } from 'react'
import { adminApi } from '@/services/api'

interface MiningStats {
  active_miners: number
  total_hash_rate: number
  current_difficulty: number
  hourly_output: number
  hourly_target: number
}

interface MiningRecord {
  user: string
  character: string
  reward: number
  hash_rate: number
  time: string
}

export function MiningMonitor() {
  const [stats, setStats] = useState<MiningStats>({
    active_miners: 0,
    total_hash_rate: 0,
    current_difficulty: 4,
    hourly_output: 0,
    hourly_target: 10000,
  })
  const [records, setRecords] = useState<MiningRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, recordsRes] = await Promise.all([
        adminApi.getMiningStats(),
        adminApi.getMiningRecords({ limit: 10 }),
      ])
      setStats(statsRes)
      setRecords(statsRes.recent_records || [])
    } catch (error) {
      console.error('Failed to load mining data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground/50">加载中...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">挖矿监控</h1>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.active_miners.toLocaleString()}</div>
          <div className="text-xs text-foreground/50">在线矿工</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.total_hash_rate.toLocaleString()} H/s</div>
          <div className="text-xs text-foreground/50">全站算力</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.current_difficulty}</div>
          <div className="text-xs text-foreground/50">当前难度</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.hourly_output.toLocaleString()}</div>
          <div className="text-xs text-foreground/50">本小时产出</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{stats.hourly_target.toLocaleString()}</div>
          <div className="text-xs text-foreground/50">目标产出</div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-lg border border-border p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">本小时产出进度</span>
          <span className="text-sm text-foreground/50">
            {stats.hourly_output.toLocaleString()} / {stats.hourly_target.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min((stats.hourly_output / stats.hourly_target) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Recent Mining */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border font-semibold">
          实时挖矿记录
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center text-foreground/50">
            暂无挖矿记录
          </div>
        ) : (
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
              {records.map((item, i) => (
                <tr key={i} className="hover:bg-background">
                  <td className="px-4 py-3">{item.user}</td>
                  <td className="px-4 py-3">{item.character}</td>
                  <td className="px-4 py-3 text-right text-success">+{item.reward}</td>
                  <td className="px-4 py-3 text-right text-foreground/50">{item.hash_rate.toLocaleString()} H/s</td>
                  <td className="px-4 py-3 text-right text-foreground/50">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
