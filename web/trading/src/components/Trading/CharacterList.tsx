import { useState } from 'react'

type Category = 'virtual' | 'historical' | 'novel'

interface Character {
  id: string
  name: string
  category: Category
  avatar: string
  current_price: number
  change_rate: number
}

interface Props {
  onSelect: (character: Character) => void
  selectedId?: string
}

const categories: { key: Category; label: string; icon: string; color: string }[] = [
  { key: 'virtual', label: '虚拟人物', icon: '🎮', color: 'bg-cat-virtual/10 text-cat-virtual' },
  { key: 'historical', label: '历史人物', icon: '📜', color: 'bg-cat-historical/10 text-cat-historical' },
  { key: 'novel', label: '小说人物', icon: '📖', color: 'bg-cat-novel/10 text-cat-novel' },
]

export function CharacterList({ onSelect, selectedId }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  // Demo data with new categories
  const characters: Character[] = [
    // 虚拟人物
    { id: 'v001', name: '初音未来', category: 'virtual', avatar: '🎤', current_price: 1500, change_rate: 5.2 },
    { id: 'v002', name: '洛天依', category: 'virtual', avatar: '🎵', current_price: 1200, change_rate: -2.1 },
    { id: 'v003', name: '雷电将军', category: 'virtual', avatar: '⚡', current_price: 2000, change_rate: 8.5 },
    { id: 'v004', name: '甘雨', category: 'virtual', avatar: '🦌', current_price: 1800, change_rate: 3.2 },
    { id: 'v005', name: '嘉然', category: 'virtual', avatar: '✨', current_price: 2500, change_rate: 12.3 },
    { id: 'v006', name: '琪亚娜', category: 'virtual', avatar: '🌙', current_price: 1600, change_rate: -1.5 },
    // 历史人物
    { id: 'h001', name: '李白', category: 'historical', avatar: '🍶', current_price: 1800, change_rate: 4.2 },
    { id: 'h002', name: '苏轼', category: 'historical', avatar: '🍜', current_price: 1500, change_rate: 2.8 },
    { id: 'h003', name: '武则天', category: 'historical', avatar: '👑', current_price: 2200, change_rate: 6.5 },
    { id: 'h004', name: '诸葛亮', category: 'historical', avatar: '🪶', current_price: 2000, change_rate: 3.8 },
    { id: 'h005', name: '秦始皇', category: 'historical', avatar: '⚔️', current_price: 2500, change_rate: 7.2 },
    // 小说人物
    { id: 'n001', name: '林黛玉', category: 'novel', avatar: '🌸', current_price: 1600, change_rate: -3.2 },
    { id: 'n002', name: '孙悟空', category: 'novel', avatar: '🐵', current_price: 2200, change_rate: 5.5 },
    { id: 'n003', name: '贾宝玉', category: 'novel', avatar: '💎', current_price: 1500, change_rate: 1.8 },
    { id: 'n004', name: '武松', category: 'novel', avatar: '🐅', current_price: 1400, change_rate: -0.5 },
  ]

  // Filter by category
  const filteredCharacters = activeCategory === 'all' 
    ? characters 
    : characters.filter(c => c.category === activeCategory)

  // Sort by change rate
  const sortedCharacters = [...filteredCharacters].sort((a, b) => b.change_rate - a.change_rate)

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-primary/20">
        <h3 className="font-bold text-lg text-foreground mb-3">🎮 角色列表</h3>
        
        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-cute'
                : 'bg-primary/5 text-foreground/60 hover:bg-primary/10'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-cute'
                  : `${cat.color} hover:opacity-80`
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 角色列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedCharacters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char)}
            className={`w-full p-3 rounded-cute mb-2 flex items-center gap-3 transition-all ${
              selectedId === char.id 
                ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/50 shadow-cute' 
                : 'bg-white/50 hover:bg-white hover:shadow-cute border-2 border-transparent'
            }`}
          >
            {/* 头像 */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-light/30 to-accent-light/30 flex items-center justify-center text-2xl flex-shrink-0">
              {char.avatar}
            </div>
            
            {/* 信息 */}
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{char.name}</div>
              <div className="text-xs text-foreground/50">{char.current_price.toLocaleString()} 人气</div>
            </div>
            
            {/* 涨跌幅 */}
            <div className={`text-sm font-bold px-2 py-1 rounded-lg ${
              char.change_rate >= 0 
                ? 'bg-up/10 text-up' 
                : 'bg-down/10 text-down'
            }`}>
              {char.change_rate >= 0 ? '+' : ''}{char.change_rate.toFixed(2)}%
            </div>
          </button>
        ))}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t border-primary/20 text-center text-xs text-foreground/50">
        共 {sortedCharacters.length} 个角色
      </div>
    </div>
  )
}
