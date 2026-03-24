import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  character?: Character
  editMode?: boolean
}

interface Character {
  id: string
  name: string
  category: 'virtual' | 'historical' | 'novel'
  avatar: string
  description: string
  initialPrice: number
}

const categoryOptions = [
  { value: 'virtual', label: '🎮 虚拟人物', desc: '虚拟偶像、游戏角色' },
  { value: 'historical', label: '📜 历史人物', desc: '历史人物、名人' },
  { value: 'novel', label: '📖 小说人物', desc: '小说、影视角色' },
]

const avatarOptions = ['🎤', '🎵', '⚡', '🪶', '🍶', '🐵', '🌸', '📚', '🎭', '🎪', '👑', '🌟']

export function Listing() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    category: 'virtual' as 'virtual' | 'historical' | 'novel',
    avatar: '🎭',
    description: '',
    initialPrice: 1000,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.description) {
      alert('请填写完整信息')
      return
    }

    setSubmitting(true)
    try {
      // TODO: 提交上市申请到后端
      // await listingApi.submit(form)
      await new Promise(r => setTimeout(r, 1000))
      alert('上市申请已提交!请等待审核~')
      navigate('/')
    } catch (error) {
      alert('提交失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="h-16 bg-white/80 backdrop-blur-sm border-b-2 border-primary/20 flex items-center px-6 justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ✨ 偶气满满
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-primary hover:underline">返回首页</a>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          📝 申请上市新角色
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 角色名称 */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              ✨ 角色名称
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="输入角色名称"
              className="input-cute w-full"
              required
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              📂 角色分类
            </label>
            <div className="grid grid-cols-3 gap-4">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: opt.value as any })}
                  className={`p-4 rounded-cute text-center transition-all ${
                    form.category === opt.value
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-white/50 border-2 border-transparent hover:bg-primary/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.label.split(' ')[0]}</div>
                  <div className="text-sm font-medium">{opt.label.split(' ')[1]}</div>
                  <div className="text-xs text-foreground/50">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 头像 */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              🎨 角色头像
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setForm({ ...form, avatar })}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                    form.avatar === avatar
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-white/50 border-2 border-transparent hover:bg-primary/10'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* 介绍 */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              📝 角色介绍
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="介绍一下这个角色的背景、特点、为什么值得交易..."
              className="input-cute w-full h-32 resize-none"
              required
            />
          </div>

          {/* 初始价格 */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              💰 建议初始价格 (人气值)
            </label>
            <input
              type="number"
              value={form.initialPrice}
              onChange={(e) => setForm({ ...form, initialPrice: Number(e.target.value) })}
              min={100}
              max={100000}
              className="input-cute w-full"
            />
            <p className="text-xs text-foreground/50 mt-1">
              价格仅供参考,实际价格由市场决定
            </p>
          </div>

          {/* 提交 */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-4 text-lg"
          >
            {submitting ? '提交中...' : '🚀 提交上市申请'}
          </button>

          <p className="text-center text-foreground/50 text-sm">
            提交后需要管理员审核,通过后将正式上市交易
          </p>
        </form>
      </div>
    </div>
  )
}
