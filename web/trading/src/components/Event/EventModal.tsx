interface Props {
  onClose: () => void
}

export function EventModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative card-cute w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>📢</span> 全站大事件
            </h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Critical Event */}
          <div className="p-4 rounded-cute bg-gradient-to-r from-up/5 to-up/10 border-2 border-up/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-up text-white text-xs rounded-full font-medium">🚨 紧急</span>
              <span className="font-bold">市场异常波动预警</span>
            </div>
            <p className="text-sm text-foreground/70">
              检测到多个角色价格剧烈波动，系统已启动熔断机制。部分交易可能暂时受限，请谨慎操作。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-up/10 text-up rounded-full">初音未来</span>
              <span className="text-xs px-2 py-1 bg-up/10 text-up rounded-full">雷电将军</span>
              <span className="text-xs px-2 py-1 bg-up/10 text-up rounded-full">甘雨</span>
            </div>
          </div>

          {/* Activity Event */}
          <div className="p-4 rounded-cute bg-gradient-to-r from-warning/5 to-warning/10 border-2 border-warning/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-warning text-white text-xs rounded-full font-medium">🎉 活动</span>
              <span className="font-bold">限时双倍挖矿</span>
            </div>
            <p className="text-sm text-foreground/70">
              庆祝系统上线，今日挖矿产出双倍奖励！活动时间：12:00 - 24:00
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-warning/20 rounded-full text-sm">
              <span>⏰</span>
              <span className="font-medium text-warning">剩余时间：8小时32分钟</span>
            </div>
          </div>

          {/* System Event */}
          <div className="p-4 rounded-cute bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">✨ 系统</span>
              <span className="font-bold">新分类上线预告</span>
            </div>
            <p className="text-sm text-foreground/70">
              明日将新增「小说人物」分类，首批上线：孙悟空、林黛玉、贾宝玉等经典角色。
            </p>
            <div className="mt-3 flex gap-3">
              <div className="text-xs px-2 py-1 bg-cat-virtual/10 text-cat-virtual rounded-full">🎮 虚拟人物</div>
              <div className="text-xs px-2 py-1 bg-cat-historical/10 text-cat-historical rounded-full">📜 历史人物</div>
              <div className="text-xs px-2 py-1 bg-cat-novel/10 text-cat-novel rounded-full">📖 小说人物</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary/20 text-center">
          <button 
            onClick={onClose}
            className="btn-primary px-8"
          >
            我知道啦 ✨
          </button>
        </div>
      </div>
    </div>
  )
}
