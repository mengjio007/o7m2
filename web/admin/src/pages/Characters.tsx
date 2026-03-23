import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Character {
  id: string
  name: string
  category: string
  currentPrice: number
  status: string
}

export function Characters() {
  const [characters] = useState<Character[]>([
    { id: '1', name: '初音未来', category: 'anime', currentPrice: 1250, status: 'active' },
    { id: '2', name: '洛天依', category: 'anime', currentPrice: 980, status: 'active' },
    { id: '3', name: '雷电将军', category: 'anime', currentPrice: 2100, status: 'active' },
    { id: '4', name: '甘雨', category: 'anime', currentPrice: 1850, status: 'paused' },
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">角色管理</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded font-medium">
          <Plus size={16} />
          添加角色
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select className="px-3 py-2 bg-card border border-border rounded text-sm">
          <option value="">全部分类</option>
          <option value="anime">二次元</option>
          <option value="star">明星</option>
          <option value="political">政治</option>
          <option value="science">科学</option>
        </select>
        <select className="px-3 py-2 bg-card border border-border rounded text-sm">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="paused">暂停</option>
          <option value="delisted">已下架</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left">角色名称</th>
              <th className="px-4 py-3 text-left">分类</th>
              <th className="px-4 py-3 text-right">当前价格</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {characters.map((char) => (
              <tr key={char.id} className="hover:bg-background">
                <td className="px-4 py-3">{char.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                    {char.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{char.currentPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    char.status === 'active' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {char.status === 'active' ? '正常' : '暂停'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 hover:bg-border rounded mr-2">
                    <Edit size={16} />
                  </button>
                  <button className="p-1 hover:bg-border rounded text-danger">
                    <Trash2 size={16} />
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
