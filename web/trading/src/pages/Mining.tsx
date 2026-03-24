import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { miningApi, accountApi } from '@/services/api'

interface MiningState {
  isMining: boolean
  hashRate: number
  attempts: number
  difficulty: number
  sessionId: string | null
}

interface Character {
  id: string
  name: string
  avatar: string
  holding: number
  bonus: number
}

export function Mining() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [holdings, setHoldings] = useState<Character[]>([])
  const [state, setState] = useState<MiningState>({
    isMining: false,
    hashRate: 0,
    attempts: 0,
    difficulty: 4,
    sessionId: null,
  })
  const workerRef = useRef<Worker | null>(null)

  // Load user holdings
  useEffect(() => {
    if (!isAuthenticated) return

    const loadHoldings = async () => {
      try {
        const res: any = await accountApi.getHoldings()
        const chars = res.holdings.map((h: any) => ({
          id: h.character_id,
          name: h.character_name || h.character_id,
          avatar: '🎮',
          holding: h.quantity,
          bonus: getBonusRate(h.quantity) * 100,
        }))
        setHoldings(chars)
      } catch (error) {
        console.error('Failed to load holdings:', error)
      }
    }

    loadHoldings()
  }, [isAuthenticated])

  const getBonusRate = (holding: number): number => {
    if (holding >= 1000) return 0.50
    if (holding >= 500) return 0.25
    if (holding >= 100) return 0.10
    return 0
  }

  const startMining = async () => {
    if (!isAuthenticated) {
      alert('请先登录才能开始应援挖矿哦~')
      navigate('/login')
      return
    }

    if (!selectedCharacter) {
      alert('请先选择一个应援角色哦~')
      return
    }

    if (selectedCharacter.holding <= 0) {
      alert('你需要持有该角色的份额才能为其应援挖矿哦~')
      return
    }

    try {
      const session: any = await miningApi.createSession(selectedCharacter.id)
      
      setState(prev => ({ ...prev, isMining: true, sessionId: session.id }))

      workerRef.current = new Worker(
        new URL('../workers/mining.worker.ts', import.meta.url),
        { type: 'module' }
      )

      workerRef.current.onmessage = async (e) => {
        if (e.data.type === 'success') {
          try {
            const result: any = await miningApi.submitNonce({
              session_id: session.id,
              nonce: e.data.nonce,
              hash_rate: e.data.hashRate,
            })

            setState(prev => ({
              ...prev,
              isMining: false,
              hashRate: e.data.hashRate,
            }))

            alert(`🎉 应援成功！获得 ${result.total_reward} 人气值奖励！`)
          } catch (error: any) {
            alert(error.message || '提交失败，请重试')
            setState(prev => ({ ...prev, isMining: false }))
          }
        } else if (e.data.type === 'progress') {
          setState(prev => ({
            ...prev,
            hashRate: e.data.hashRate,
            attempts: e.data.attempts,
          }))
        }
      }

      workerRef.current.postMessage({
        challenge: session.challenge,
        targetHash: session.target_hash,
        difficulty: session.difficulty,
      })
    } catch (error: any) {
      alert(error.message || '创建挖矿会话失败')
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center card-cute p-12 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">需要登录</h2>
          <p className="text-foreground/60 mb-6">
            应援挖矿需要登录账号才能使用哦~
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            🚀 前往登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900">
      {/* Header - 挖矿风格 */}
      <header className="h-16 bg-gradient-to-r from-amber-600 to-orange-700 flex items-center px-6 justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-2xl font-bold text-white">
            ⛏️ 偶气满满
          </a>
          <nav className="flex gap-2">
            <a href="/" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm transition-all">
              💹 交易
            </a>
            <a href="/mining" className="px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">
              挖矿
            </a>
            <a href="/wiki" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm transition-all">
              📖 百科
            </a>
            <a href="/profile" className="px-4 py-2 rounded-full text-white/70 hover:bg-white/10 text-sm transition-all">
              👤 我的
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a href="/profile" className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full hover:bg-white/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-lg">
              {user?.avatar || '🎭'}
            </div>
            <span className="text-white text-sm">{user?.username}</span>
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            ⛏️ 应援挖矿
          </h1>
          <p className="text-foreground/60">为你喜欢的角色应援，获取人气值奖励！</p>
        </div>

        {holdings.length === 0 ? (
          <div className="card-cute p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold mb-2">还没有持仓</h2>
            <p className="text-foreground/60 mb-6">
              你需要先持有角色的份额才能为其应援挖矿哦~
            </p>
            <a href="/" className="btn-primary">🛒 去交易</a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 card-cute p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🎮</span> 选择应援角色
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {holdings.map((char) => (
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

            <div className="space-y-4">
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
        )}

        <div className="mt-8 card-cute p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>💡</span> 应援规则
          </h3>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">🎯</div>
              <div>
                <div className="font-medium">动态难度</div>
                <div className="text-foreground/60">全站每小时产出上限 10,000 人气值</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-lg flex-shrink-0">📈</div>
              <div>
                <div className="font-medium">持仓加成</div>
                <div className="text-foreground/60">持有角色份额可获得额外产出加成，最高 +50%</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-lg flex-shrink-0">🛡️</div>
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
