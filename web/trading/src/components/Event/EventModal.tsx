interface Props {
  onClose: () => void
}

export function EventModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">全站大事件</h3>
          <button 
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Critical Event */}
          <div className="p-4 bg-danger/10 border border-danger/30 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-danger text-white text-xs rounded">紧急</span>
              <span className="font-bold">市场异常波动预警</span>
            </div>
            <p className="text-sm text-foreground/70">
              检测到多个角色价格剧烈波动，系统已启动熔断机制。部分交易可能暂时受限，请谨慎操作。
            </p>
            <div className="mt-2 text-xs text-foreground/50">
              影响角色：初音未来、雷电将军、甘雨
            </div>
          </div>

          {/* Activity Event */}
          <div className="p-4 bg-warning/10 border border-warning/30 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-warning text-background text-xs rounded">活动</span>
              <span className="font-bold">限时双倍挖矿</span>
            </div>
            <p className="text-sm text-foreground/70">
              庆祝系统上线，今日挖矿产出双倍奖励！活动时间：12:00 - 24:00
            </p>
            <div className="mt-2 text-xs text-foreground/50">
              剩余时间：8小时32分钟
            </div>
          </div>

          {/* System Event */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-primary text-background text-xs rounded">系统</span>
              <span className="font-bold">新角色上线预告</span>
            </div>
            <p className="text-sm text-foreground/70">
              明日将新增「历史人物」分类，首批上线：秦始皇、诸葛亮、李白等10位角色。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-background rounded font-medium hover:bg-primary/90"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}
