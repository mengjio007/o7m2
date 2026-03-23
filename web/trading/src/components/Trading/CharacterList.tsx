interface Character {
  id: string
  name: string
  category: string
  avatar: string
  current_price: number
  change_rate: number
}

interface Props {
  onSelect: (character: Character) => void
  selectedId?: string
}

export function CharacterList({ onSelect, selectedId }: Props) {
  // Demo data
  const characters: Character[] = [
    { id: '1', name: '初音未来', category: 'anime', avatar: '', current_price: 1250, change_rate: 5.2 },
    { id: '2', name: '洛天依', category: 'anime', avatar: '', current_price: 980, change_rate: -2.1 },
    { id: '3', name: '雷电将军', category: 'anime', avatar: '', current_price: 2100, change_rate: 8.5 },
    { id: '4', name: '甘雨', category: 'anime', avatar: '', current_price: 1850, change_rate: 3.2 },
    { id: '5', name: '可莉', category: 'anime', avatar: '', current_price: 1620, change_rate: -1.5 },
    { id: '6', name: '纳西妲', category: 'anime', avatar: '', current_price: 2350, change_rate: 12.3 },
    { id: '7', name: '钟离', category: 'anime', avatar: '', current_price: 1780, change_rate: 1.8 },
    { id: '8', name: '温迪', category: 'anime', avatar: '', current_price: 1420, change_rate: -0.5 },
  ]

  // Sort by change rate
  const sortedCharacters = [...characters].sort((a, b) => b.change_rate - a.change_rate)

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">角色列表</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedCharacters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char)}
            className={`w-full p-3 flex items-center gap-3 hover:bg-card transition-colors ${
              selectedId === char.id ? 'bg-card border-l-2 border-primary' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-background flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{char.name}</div>
              <div className="text-xs text-foreground/50">{char.current_price.toLocaleString()}</div>
            </div>
            <div className={`text-xs font-medium ${
              char.change_rate >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {char.change_rate >= 0 ? '+' : ''}{char.change_rate.toFixed(2)}%
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
