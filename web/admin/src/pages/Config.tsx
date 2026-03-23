import { useState } from 'react'
import { Save } from 'lucide-react'

interface Config {
  key: string
  value: string
  description: string
}

export function Config() {
  const [configs, setConfigs] = useState<Config[]>([
    { key: 'daily_login_reward', value: '100', description: '每日登录奖励人气值' },
    { key: 'trade_tax_rate', value: '0.001', description: '交易税率' },
    { key: 'mining_hourly_target', value: '10000', description: '每小时全站挖矿产出目标' },
    { key: 'mining_base_difficulty', value: '4', description: '基础挖矿难度' },
    { key: 'mining_max_difficulty', value: '8', description: '最大挖矿难度' },
    { key: 'holding_bonus_100', value: '0.10', description: '持仓100加成率' },
    { key: 'holding_bonus_500', value: '0.25', description: '持仓500加成率' },
    { key: 'holding_bonus_1000', value: '0.50', description: '持仓1000加成率' },
  ])

  const handleSave = () => {
    console.log('Saving configs:', configs)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">系统配置</h1>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded font-medium"
        >
          <Save size={16} />
          保存配置
        </button>
      </div>

      {/* Config List */}
      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        {configs.map((config, i) => (
          <div key={config.key} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{config.key}</div>
              <div className="text-sm text-foreground/50">{config.description}</div>
            </div>
            <input
              type="text"
              value={config.value}
              onChange={(e) => {
                const newConfigs = [...configs]
                newConfigs[i].value = e.target.value
                setConfigs(newConfigs)
              }}
              className="w-32 px-3 py-2 bg-background border border-border rounded text-sm text-right"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
