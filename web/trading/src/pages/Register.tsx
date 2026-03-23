import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('两次密码不一致哦~')
      return
    }

    try {
      await register(username, email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* 装饰背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-accent-light/20 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            加入偶气满满
          </h1>
          <p className="text-foreground/60 mt-2">开始你的人气炒股之旅~</p>
        </div>

        {/* 注册卡片 */}
        <div className="card-cute p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-cute text-danger text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                👤 用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-cute w-full"
                placeholder="给自己取个好听的名字"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                📧 邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-cute w-full"
                placeholder="请输入邮箱"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                🔑 设置密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-cute w-full"
                placeholder="至少6位字符"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                🔐 确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-cute w-full"
                placeholder="再次输入密码"
                required
              />
            </div>

            <div className="text-sm text-foreground/60">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-primary/30 text-primary" required />
                <span>我已阅读并同意 <a href="#" className="text-primary">用户协议</a> 和 <a href="#" className="text-primary">隐私政策</a></span>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> 注册中...
                </span>
              ) : (
                '🎉 立即注册'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <span className="text-foreground/50">已有账号？</span>
            {' '}
            <a href="/login" className="text-primary font-medium hover:underline">
              立即登录 ✌️
            </a>
          </div>
        </div>

        {/* 特色介绍 */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-foreground/50">
            <div className="text-2xl mb-1">🎮</div>
            <div className="text-xs">虚拟人物</div>
          </div>
          <div className="text-foreground/50">
            <div className="text-2xl mb-1">📜</div>
            <div className="text-xs">历史人物</div>
          </div>
          <div className="text-foreground/50">
            <div className="text-2xl mb-1">📖</div>
            <div className="text-xs">小说人物</div>
          </div>
        </div>
      </div>
    </div>
  )
}
