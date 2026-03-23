import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement login
    setTimeout(() => {
      setLoading(false)
      navigate('/')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border border-border">
        <h1 className="text-2xl font-bold text-center mb-8">登录 偶气满满</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-foreground/70 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-primary"
              placeholder="请输入邮箱"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-foreground/70 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-primary"
              placeholder="请输入密码"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-background rounded font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-foreground/50">
          还没有账号？{' '}
          <a href="/register" className="text-primary hover:underline">立即注册</a>
        </div>
      </div>
    </div>
  )
}
