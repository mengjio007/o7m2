import { useState, useEffect } from 'react'
import { characterApi } from '@/services/api'

type Category = 'virtual' | 'historical' | 'novel'

interface RankInfo {
  rank: string
  label: string
  icon: string
  color: string
}

interface Character {
  id: string
  name: string
  category: Category
  avatar: string
  current_price: number
  day_open: number
  day_high: number
  day_low: number
  volume: number
  change_rate: number
  rank?: RankInfo
}

interface Props {
  onSelect: (character: Character) => void
  selectedId?: string
}

const categories: { key: Category; label: string; icon: string; color: string }[] = [
  { key: 'virtual', label: '虚拟', icon: '🎮', color: 'text-pink-400' },
  { key: 'historical', label: '历史', icon: '📜', color: 'text-amber-400' },
  { key: 'novel', label: '小说', icon: '📖', color: 'text-purple-400' },
]

const getRankFrame = (rank?: string) => {
  switch (rank) {
    case '夯':
      return {
        wrapper: 'rank-hang-wrapper',
        frame: 'ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent',
        bg: 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500',
        animation: 'animate-hang'
      }
    case '顶级':
      return {
        wrapper: 'rank-ding-wrapper',
        frame: 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent',
        bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500',
        animation: 'animate-ding'
      }
    case '人上人':
      return {
        wrapper: 'rank-ren-wrapper',
        frame: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent',
        bg: 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500',
        animation: 'animate-ren'
      }
    case 'NPC':
      return {
        wrapper: 'rank-npc-wrapper',
        frame: 'ring-1 ring-gray-400 ring-offset-1 ring-offset-transparent',
        bg: 'bg-gradient-to-br from-gray-400 to-gray-500',
        animation: ''
      }
    case '拉':
      return {
        wrapper: 'rank-la-wrapper',
        frame: 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent',
        bg: 'bg-gradient-to-br from-purple-800 via-purple-600 to-purple-900',
        animation: 'animate-la'
      }
    default:
      return {
        wrapper: '',
        frame: 'ring-1 ring-white/20',
        bg: 'bg-gradient-to-br from-pink-500/30 to-purple-500/30',
        animation: ''
      }
  }
}

export function CharacterList({ onSelect, selectedId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      const res: any = await characterApi.list()
      setCharacters(res.characters || [])
    } catch (error) {
      console.error('Failed to load characters:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCharacters = activeCategory === 'all'
    ? characters
    : characters.filter(c => c.category === activeCategory)

  const sortedCharacters = [...filteredCharacters].sort((a, b) => b.current_price - a.current_price)

  const getChangeRate = (char: Character) => {
    if (!char.day_open || char.day_open === 0) return 0
    return ((char.current_price - char.day_open) / char.day_open) * 100
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/50 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <h3 className="font-bold text-sm mb-2 text-pink-400">🎮 角色列表</h3>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-1 rounded text-xs ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-2 py-1 rounded text-xs ${
                activeCategory === cat.key
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedCharacters.map((char) => {
          const changeRate = getChangeRate(char)
          const frame = getRankFrame(char.rank?.label)
          return (
            <button
              key={char.id}
              onClick={() => onSelect(char)}
              className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all ${
                selectedId === char.id
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
            >
              {/* 头像带特效 */}
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-lg ${frame.bg} ${frame.frame} flex items-center justify-center overflow-hidden ${frame.animation}`}>
                  {char.avatar?.startsWith('http') ? (
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{char.avatar || '🎭'}</span>
                  )}
                </div>
                {/* 夯 - 火焰效果 */}
                {char.rank?.label === '夯' && (
                  <div className="absolute -top-1 -right-1 text-xs animate-bounce">🔥</div>
                )}
                {/* 顶级 - 星光效果 */}
                {char.rank?.label === '顶级' && (
                  <div className="absolute -top-1 -right-1 text-xs animate-pulse">⭐</div>
                )}
                {/* 人上人 - 霓虹光效 */}
                {char.rank?.label === '人上人' && (
                  <div className="absolute -top-1 -right-1 text-xs animate-ping">💎</div>
                )}
                {/* 拉 - 蝙蝠效果 */}
                {char.rank?.label === '拉' && (
                  <div className="absolute -top-1 -right-1 text-xs animate-bounce">🦇</div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{char.name}</span>
                  {char.rank && (
                    <span className={`text-[10px] px-1 py-0 rounded border ${getRankColor(char.rank.label)}`}>
                      {char.rank.label}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/50">{char.current_price?.toLocaleString()}</div>
              </div>
              <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                changeRate >= 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 text-center text-xs text-white/30">
        共 {sortedCharacters.length} 个角色
      </div>
    </div>
  )
}

function getRankColor(rank?: string) {
  switch (rank) {
    case '夯': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case '顶级': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case '人上人': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'NPC': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case '拉': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}
