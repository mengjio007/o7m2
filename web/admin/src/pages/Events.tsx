import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Event {
  id: string
  type: string
  title: string
  severity: string
  isActive: boolean
  startAt: string
}

export function Events() {
  const [events] = useState<Event[]>([
    { id: '1', type: 'activity', title: '限时双倍挖矿', severity: 'info', isActive: true, startAt: '2024-01-20 12:00' },
    { id: '2', type: 'crash', title: '市场异常波动预警', severity: 'critical', isActive: false, startAt: '2024-01-19 15:30' },
    { id: '3', type: 'system', title: '新角色上线预告', severity: 'info', isActive: true, startAt: '2024-01-21 10:00' },
  ])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-danger/10 text-danger'
      case 'warning': return 'bg-warning/10 text-warning'
      default: return 'bg-primary/10 text-primary'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'crash': return '暴跌'
      case 'pump': return '暴涨'
      case 'activity': return '活动'
      case 'system': return '系统'
      default: return type
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">事件管理</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded font-medium">
          <Plus size={16} />
          创建事件
        </button>
      </div>

      {/* Event Cards */}
      <div className="grid gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(event.severity)}`}>
                    {event.severity === 'critical' ? '紧急' : event.severity === 'warning' ? '警告' : '信息'}
                  </span>
                  <span className="px-2 py-0.5 bg-background rounded text-xs">
                    {getTypeLabel(event.type)}
                  </span>
                  {event.isActive && (
                    <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs">
                      进行中
                    </span>
                  )}
                </div>
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-foreground/50 mt-1">
                  开始时间: {event.startAt}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-background rounded">
                  <Edit size={16} />
                </button>
                <button className="p-2 hover:bg-background rounded text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
