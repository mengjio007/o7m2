import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* 装饰背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary-light/20 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            偶气满满
          </h1>
          <p className="text-foreground/60 mt-2">欢迎回来，继续你的人气之旅~</p>
        </div>

        {/* 登录卡片 */}
        <div className="card-cute p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-cute text-danger text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                🔑 密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-cute w-full"
                placeholder="请输入密码"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-foreground/60">
                <input type="checkbox" className="rounded border-primary/30 text-primary" />
                记住我
              </label>
              <a href="#" className="text-primary hover:underline">忘记密码？</a>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> 登录中...
                </span>
              ) : (
                '🚀 立即登录'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <span className="text-foreground/50">还没有账号？</span>
            {' '}
            <a href="/register" className="text-primary font-medium hover:underline">
              立即注册 ✌️
            </a>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="mt-8 text-center text-foreground/40 text-sm">
          <p>登录即表示同意 <a href="#" className="text-primary">用户协议</a> 和 <a href="#" className="text-primary">隐私政策</a></p>
        </div>
      </div>
    </div>
  )
}
