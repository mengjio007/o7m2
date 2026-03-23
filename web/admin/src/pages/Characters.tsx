import { useState } from 'react'

type Category = 'virtual' | 'historical' | 'novel'

interface Character {
  id: string
  name: string
  avatar: string
  category: Category
  currentPrice: number
  status: 'active' | 'paused' | 'delisted'
}

const categoryInfo = {
  virtual: { label: '虚拟人物', icon: '🎮', color: 'bg-cat-virtual/10 text-cat-virtual' },
  historical: { label: '历史人物', icon: '📜', color: 'bg-cat-historical/10 text-cat-historical' },
  novel: { label: '小说人物', icon: '📖', color: 'bg-cat-novel/10 text-cat-novel' },
}

export function Characters() {
  const [characters] = useState<Character[]>([
    { id: '1', name: '初音未来', avatar: '🎤', category: 'virtual', currentPrice: 1500, status: 'active' },
    { id: '2', name: '洛天依', avatar: '🎵', category: 'virtual', currentPrice: 1200, status: 'active' },
    { id: '3', name: '雷电将军', avatar: '⚡', category: 'virtual', currentPrice: 2000, status: 'active' },
    { id: '4', name: '李白', avatar: '🍶', category: 'historical', currentPrice: 1800, status: 'active' },
    { id: '5', name: '诸葛亮', avatar: '🪶', category: 'historical', currentPrice: 2000, status: 'active' },
    { id: '6', name: '孙悟空', avatar: '🐵', category: 'novel', currentPrice: 2200, status: 'active' },
    { id: '7', name: '林黛玉', avatar: '🌸', category: 'novel', currentPrice: 1600, status: 'paused' },
  ])

  const [filterCategory, setFilterCategory] = useState<Category | ''>('')

  const filteredCharacters = filterCategory 
    ? characters.filter(c => c.category === filterCategory)
    : characters

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎮 角色管理
          </h1>
          <p className="text-sm text-foreground/50 mt-1">管理所有可交易的角色</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <span>➕</span> 添加角色
        </button>
      </div>

      {/* 分类统计 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => setFilterCategory('')}
          className={`card-cute p-4 cursor-pointer transition-all ${
            filterCategory === '' ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">📊</div>
            <div>
              <div className="text-2xl font-bold">{characters.length}</div>
              <div className="text-xs text-foreground/50">全部角色</div>
            </div>
          </div>
        </div>
        {Object.entries(categoryInfo).map(([key, info]) => (
          <div 
            key={key}
            onClick={() => setFilterCategory(key as Category)}
            className={`card-cute p-4 cursor-pointer transition-all ${
              filterCategory === key ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${info.color} flex items-center justify-center text-lg`}>
                {info.icon}
              </div>
              <div>
                <div className="text-2xl font-bold">{characters.filter(c => c.category === key).length}</div>
                <div className="text-xs text-foreground/50">{info.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4 mb-4">
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Category | '')}
          className="input-cute text-sm"
        >
          <option value="">全部分类</option>
          <option value="virtual">🎮 虚拟人物</option>
          <option value="historical">📜 历史人物</option>
          <option value="novel">📖 小说人物</option>
        </select>
        <select className="input-cute text-sm">
          <option value="">全部状态</option>
          <option value="active">✅ 正常</option>
          <option value="paused">⏸️ 暂停</option>
          <option value="delisted">❌ 已下架</option>
        </select>
        <input 
          type="text"
          placeholder="🔍 搜索角色名称..."
          className="input-cute text-sm flex-1 max-w-md"
        />
      </div>

      {/* 表格 */}
      <div className="card-cute overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5">
            <tr>
              <th className="px-4 py-3 text-left">角色</th>
              <th className="px-4 py-3 text-left">分类</th>
              <th className="px-4 py-3 text-right">当前价格</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCharacters.map((char) => (
              <tr key={char.id} className="border-t border-primary/10 hover:bg-primary/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light/30 to-accent-light/30 flex items-center justify-center text-lg">
                      {char.avatar}
                    </div>
                    <span className="font-medium">{char.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryInfo[char.category].color}`}>
                    {categoryInfo[char.category].icon} {categoryInfo[char.category].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{char.currentPrice.toLocaleString()} 人气</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    char.status === 'active' 
                      ? 'bg-success/10 text-success' 
                      : char.status === 'paused'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-danger/10 text-danger'
                  }`}>
                    {char.status === 'active' ? '✅ 正常' : char.status === 'paused' ? '⏸️ 暂停' : '❌ 下架'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-2 hover:bg-primary/10 rounded-cute mr-2 transition-colors">
                    ✏️
                  </button>
                  <button className="p-2 hover:bg-danger/10 rounded-cute text-danger transition-colors">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
