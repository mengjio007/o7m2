import { useState, useRef, useEffect } from 'react'

interface MiningState {
  isMining: boolean
  hashRate: number
  attempts: number
  difficulty: number
}

interface Character {
  id: string
  name: string
  avatar: string
  holding: number
  bonus: number
}

export function Mining() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [state, setState] = useState<MiningState>({
    isMining: false,
    hashRate: 0,
    attempts: 0,
    difficulty: 4,
  })
  const workerRef = useRef<Worker | null>(null)

  // Demo characters with holding info
  const characters: Character[] = [
    { id: '1', name: '初音未来', avatar: '🎤', holding: 100, bonus: 10 },
    { id: '2', name: '洛天依', avatar: '🎵', holding: 50, bonus: 0 },
    { id: '3', name: '雷电将军', avatar: '⚡', holding: 500, bonus: 25 },
    { id: '4', name: '甘雨', avatar: '🦌', holding: 0, bonus: 0 },
    { id: '5', name: '李白', avatar: '🍶', holding: 200, bonus: 10 },
    { id: '6', name: '孙悟空', avatar: '🐵', holding: 1000, bonus: 50 },
  ]

  const startMining = () => {
    if (!selectedCharacter) {
      alert('请先选择一个应援角色哦~')
      return
    }

    setState(prev => ({ ...prev, isMining: true }))

    workerRef.current = new Worker(
      new URL('../workers/mining.worker.ts', import.meta.url),
      { type: 'module' }
    )

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'success') {
        console.log('Found nonce:', e.data.nonce)
        setState(prev => ({
          ...prev,
          isMining: false,
          hashRate: e.data.hashRate,
        }))
      } else if (e.data.type === 'progress') {
        setState(prev => ({
          ...prev,
          hashRate: e.data.hashRate,
          attempts: e.data.attempts,
        }))
      }
    }

    workerRef.current.postMessage({
      challenge: 'demo_challenge_' + Date.now(),
      targetHash: '0'.repeat(state.difficulty),
      difficulty: state.difficulty,
    })
  }

  const stopMining = () => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setState(prev => ({ ...prev, isMining: false }))
  }

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-sm border-b-2 border-primary/20 flex items-center px-6 justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ✨ 偶气满满
          </a>
          <nav className="flex gap-2">
            <a href="/" className="px-4 py-2 rounded-full text-foreground/70 hover:bg-primary/10 text-sm transition-all">
              💹 交易
            </a>
            <a href="/mining" className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium shadow-cute">
              ⛏️ 应援挖矿
            </a>
          </nav>
        </div>
        <a href="/login" className="btn-primary text-sm">登录 ✌️</a>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            ⛏️ 应援挖矿
          </h1>
          <p className="text-foreground/60">为你喜欢的角色应援，获取人气值奖励！</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 左侧：角色选择 */}
          <div className="col-span-2 card-cute p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🎮</span> 选择应援角色
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className={`p-4 rounded-cute text-center transition-all ${
                    selectedCharacter?.id === char.id
                      ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary shadow-cute'
                      : 'bg-white/50 border-2 border-transparent hover:border-primary/30 hover:shadow-cute'
                  }`}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-light/30 to-accent-light/30 flex items-center justify-center text-3xl">
                    {char.avatar}
                  </div>
                  <div className="font-bold text-foreground">{char.name}</div>
                  <div className="text-xs text-foreground/50 mt-1">
                    持仓: {char.holding} 份额
                  </div>
                  {char.bonus > 0 && (
                    <div className="text-xs text-success mt-1 font-medium">
                      +{char.bonus}% 加成
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：挖矿状态 */}
          <div className="space-y-4">
            {/* 当前选择 */}
            <div className="card-cute p-4">
              <h3 className="text-sm font-bold text-foreground/60 mb-3">当前应援</h3>
              {selectedCharacter ? (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-light/30 to-accent-light/30 flex items-center justify-center text-2xl">
                    {selectedCharacter.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{selectedCharacter.name}</div>
                    <div className="text-xs text-success">+{selectedCharacter.bonus}% 产出加成</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-foreground/40 py-4">
                  <div className="text-2xl mb-1">❓</div>
                  <div className="text-xs">未选择角色</div>
                </div>
              )}
            </div>

            {/* 挖矿数据 */}
            <div className="card-cute p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">🎯 难度</span>
                <span className="font-bold text-primary">{state.difficulty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">⚡ 算力</span>
                <span className="font-bold">{state.hashRate.toLocaleString()} H/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">🔄 计算次数</span>
                <span className="font-bold">{state.attempts.toLocaleString()}</span>
              </div>
            </div>

            {/* 进度条 */}
            {state.isMining && (
              <div className="card-cute p-4">
                <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((state.attempts / 100000) * 100, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-center text-foreground/50">
                  ⏳ 正在计算中...
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <button
              onClick={state.isMining ? stopMining : startMining}
              className={`w-full py-4 rounded-cute font-bold text-white text-lg transition-all ${
                state.isMining
                  ? 'bg-gradient-to-r from-danger to-danger/80 hover:shadow-lg'
                  : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105'
              }`}
            >
              {state.isMining ? '⏹️ 停止应援' : '🚀 开始应援'}
            </button>
          </div>
        </div>

        {/* 说明区 */}
        <div className="mt-8 card-cute p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>💡</span> 应援规则
          </h3>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                🎯
              </div>
              <div>
                <div className="font-medium">动态难度</div>
                <div className="text-foreground/60">全站每小时产出上限 10,000 人气值，难度自动调整</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-lg flex-shrink-0">
                📈
              </div>
              <div>
                <div className="font-medium">持仓加成</div>
                <div className="text-foreground/60">持有角色份额可获得额外产出加成，最高 +50%</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-lg flex-shrink-0">
                🛡️
              </div>
              <div>
                <div className="font-medium">公平应援</div>
                <div className="text-foreground/60">反作弊机制确保每位用户的应援都是公平的</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
