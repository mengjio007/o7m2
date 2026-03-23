import { useState, useRef, useEffect } from 'react'

interface MiningState {
  isMining: boolean
  hashRate: number
  attempts: number
  difficulty: number
}

export function Mining() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [state, setState] = useState<MiningState>({
    isMining: false,
    hashRate: 0,
    attempts: 0,
    difficulty: 4,
  })
  const workerRef = useRef<Worker | null>(null)

  const startMining = () => {
    if (!selectedCharacter) {
      alert('请先选择一个角色')
      return
    }

    setState(prev => ({ ...prev, isMining: true }))

    // Create Web Worker
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

    // Start mining with demo challenge
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4">
        <a href="/" className="text-xl font-bold text-primary mr-8">偶气满满</a>
        <nav className="flex gap-4 text-sm">
          <a href="/" className="hover:text-primary">交易</a>
          <a href="/mining" className="text-primary">应援挖矿</a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold mb-6">应援挖矿</h2>
          
          {/* Character Selection */}
          <div className="mb-6">
            <label className="block text-sm text-foreground/70 mb-2">选择应援角色</label>
            <div className="grid grid-cols-4 gap-3">
              {['初音未来', '洛天依', '雷电将军', '甘雨'].map((char, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCharacter(char)}
                  className={`p-3 rounded border text-center transition-colors ${
                    selectedCharacter === char
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-2 bg-background rounded-full" />
                  <span className="text-sm">{char}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mining Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded p-4 text-center">
              <div className="text-2xl font-bold text-primary">{state.difficulty}</div>
              <div className="text-xs text-foreground/50">当前难度</div>
            </div>
            <div className="bg-background rounded p-4 text-center">
              <div className="text-2xl font-bold">{state.hashRate.toLocaleString()}</div>
              <div className="text-xs text-foreground/50">算力 H/s</div>
            </div>
            <div className="bg-background rounded p-4 text-center">
              <div className="text-2xl font-bold">{state.attempts.toLocaleString()}</div>
              <div className="text-xs text-foreground/50">计算次数</div>
            </div>
            <div className="bg-background rounded p-4 text-center">
              <div className="text-2xl font-bold text-success">+0%</div>
              <div className="text-xs text-foreground/50">持仓加成</div>
            </div>
          </div>

          {/* Progress Bar */}
          {state.isMining && (
            <div className="mb-6">
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((state.attempts / 100000) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-foreground/50 text-center">
                正在计算中... 持有角色份额可获得额外加成
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={state.isMining ? stopMining : startMining}
            className={`w-full py-3 rounded font-medium ${
              state.isMining
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-primary text-background hover:bg-primary/90'
            }`}
          >
            {state.isMining ? '停止应援' : '开始应援'}
          </button>

          {/* Info */}
          <div className="mt-6 text-xs text-foreground/50 space-y-1">
            <p>• 每小时全站产出上限 10,000 人气值</p>
            <p>• 持有角色份额可获得额外产出加成</p>
            <p>• 挖矿难度会根据全站算力动态调整</p>
          </div>
        </div>
      </div>
    </div>
  )
}
