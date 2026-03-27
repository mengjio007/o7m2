import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { characterApi } from '@/services/api'
import { CharacterChat } from '@/components/Wiki/CharacterChat'

interface Character {
  id: string
  name: string
  category: 'virtual' | 'historical' | 'novel'
  avatar: string
  description: string
  initial_price: number
  current_price: number
  day_high: number
  day_low: number
  volume: number
  rank?: { rank: string; label: string; icon: string; color: string }
}

const getCharacterDetails = (char: Character) => {
  const details: Record<string, any> = {
    'v001': {
      fullname: '初音ミク (Hatsune Miku)',
      nickname: '公主殿下、Miku',
      birth: '2007年8月31日',
      height: '158cm',
      weight: '42kg',
      cv: '藤田咲 (声源)',
      company: 'CRYPTON FUTURE MEDIA',
      moe: ['虚拟歌姬', '葱绿色双马尾', '未来感', '元气'],
      quote: '初次见面，我是初音未来！请多关照！',
      works: ['メルト', '千本桜', 'ロミオとシンデレラ'],
      relations: [{ name: '镜音铃', relation: '同社角色' }, { name: '巡音流歌', relation: '同社角色' }]
    },
    'v002': {
      fullname: '洛天依 (Luo Tianyi)',
      nickname: '天依、吃货殿下',
      birth: '2012年7月12日',
      height: '156cm',
      weight: '41kg',
      cv: '山新 (声源)',
      company: '上海禾念信息科技有限公司',
      moe: ['虚拟歌姬', '灰发绿瞳', '呆萌', '吃货'],
      quote: '大家好！我是洛天依！',
      works: ['权御天下', '达拉崩吧', '芒种'],
      relations: [{ name: '言和', relation: '同社角色' }, { name: '乐正绫', relation: '同社角色' }]
    },
    'v003': {
      fullname: '雷电将軍 (Raiden Shogun)',
      nickname: '雷神、影、巴尔泽布',
      birth: '???',
      height: '170cm',
      weight: '???',
      cv: '泽城美雪',
      company: 'miHoYo',
      moe: ['紫发', '雷元素', '永恒', '高冷'],
      quote: '此世须臾，我即永恒。',
      works: ['原神'],
      relations: [{ name: '八重神子', relation: '挚友' }, { name: '九条裟罗', relation: '追随者' }]
    }
  }
  return details[char.id] || {
    fullname: char.name,
    nickname: '暂无',
    birth: '???',
    height: '???',
    weight: '???',
    cv: '???',
    company: '???',
    moe: ['待补充'],
    quote: '暂无语录',
    works: [],
    relations: []
  }
}

const generateKLineData = () => {
  const data = []
  let price = 1500
  for (let i = 0; i < 30; i++) {
    const open = price
    const close = price + (Math.random() - 0.5) * 100
    const high = Math.max(open, close) + Math.random() * 50
    const low = Math.min(open, close) - Math.random() * 50
    data.push({ open, close, high, low })
    price = close
  }
  return data
}

export function Wiki() {
  const [searchParams] = useSearchParams()
  const charId = searchParams.get('id') || 'v001'
  const { isAuthenticated } = useAuthStore()
  const [character, setCharacter] = useState<Character | null>(null)
  const [allCharacters, setAllCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [kLineData] = useState(generateKLineData)

  useEffect(() => {
    setLoading(true)
    characterApi.list().then((res: any) => {
      setAllCharacters(res.characters || [])
      const found = res.characters.find((c: Character) => c.id === charId)
      setCharacter(found || res.characters[0] || null)
      setLoading(false)
    }).catch(() => {
      setCharacter({
        id: charId, name: '初音未来', category: 'virtual', avatar: '🎤',
        description: '初音未来是CRYPTON FUTURE MEDIA以Yamaha的VOCALOID系列语音合成程序为基础开发的音源库。',
        initial_price: 1500, current_price: 1587.23, day_high: 1650, day_low: 1480, volume: 25000,
      })
      setLoading(false)
    })
  }, [charId])

  const kMaxPrice = Math.max(...kLineData.map(d => d.high))
  const kMinPrice = Math.min(...kLineData.map(d => d.low))
  const kPriceRange = kMaxPrice - kMinPrice || 1

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-2xl text-pink-500 animate-pulse">加载中...</div>
      </div>
    )
  }

  const details = character ? getCharacterDetails(character) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <header className="h-12 md:h-14 bg-white shadow-sm border-b-2 border-pink-300 flex items-center px-3 md:px-6 justify-between">
        <Link to="/" className="text-base md:text-xl font-bold text-pink-500 flex items-center gap-1 md:gap-2">
          <span className="text-xl md:text-2xl">✨</span>
          <span>偶气百科</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="text-pink-500 text-xs md:text-sm">💹 交易</Link>
          {isAuthenticated ? (
            <Link to="/profile" className="text-pink-500 text-xs md:text-sm">👤</Link>
          ) : (
            <Link to="/login" className="px-3 md:px-4 py-1 md:py-1.5 bg-pink-500 text-white rounded-full text-xs md:text-sm">登录</Link>
          )}
        </div>
      </header>

      <div className="bg-white/80 border-b px-3 md:px-6 py-2 flex gap-2 overflow-x-auto">
        {allCharacters.map((c) => (
          <Link key={c.id} to={`/wiki?id=${c.id}`} className={`flex-shrink-0 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm ${c.id === charId ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
            {c.avatar?.startsWith('http') ? '🎭' : c.avatar} {c.name}
          </Link>
        ))}
      </div>

      {character && details && (
        <div className="container mx-auto px-3 md:px-6 py-4 md:py-6">
          <div className="hidden md:block bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 mb-4 md:mb-6 text-sm text-pink-600">
            ✨ 萌娘百科欢迎您参与完善本条目☆Kira~
          </div>

          <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
            <span>{character.name}</span>
            {character.rank && (
              <span className={`text-xs md:text-sm px-2 py-0.5 rounded ${
                character.rank.label === '夯' ? 'bg-purple-100 text-purple-600' :
                character.rank.label === '顶级' ? 'bg-orange-100 text-orange-600' :
                character.rank.label === '人上人' ? 'bg-green-100 text-green-600' :
                character.rank.label === 'NPC' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {character.rank.icon} {character.rank.label}
              </span>
            )}
          </h1>

          {details.quote && (
            <div className="bg-gray-50 border-l-4 border-pink-400 pl-3 md:pl-4 py-2 mb-4 md:mb-6 italic text-gray-600 text-sm md:text-base">
              " {details.quote} "
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-pink-200">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  {character.avatar?.startsWith('http') ? (
                    <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl md:text-8xl">{character.avatar || '🎭'}</span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md mt-4 p-3 md:p-4 border border-pink-200">
                <h3 className="font-bold text-pink-600 mb-2 md:mb-3 text-sm md:text-base">📈 交易信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 text-xs md:text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">当前价格</span><span className="font-bold text-pink-600">{character.current_price?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">发行价格</span><span>{character.initial_price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">最高</span><span className="text-red-500">{character.day_high || '---'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">最低</span><span className="text-green-500">{character.day_low || '---'}</span></div>
                </div>
                <Link to="/" className="block mt-3 md:mt-4 text-center py-2 bg-pink-500 text-white rounded-lg text-sm">📈 前往交易</Link>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-md border border-pink-200 overflow-hidden mb-4 md:mb-6">
                <div className="bg-pink-500 text-white px-3 md:px-4 py-2 font-bold text-sm md:text-base">📋 基本资料</div>
                <table className="w-full text-xs md:text-sm">
                  <tbody>
                    <tr className="border-b"><td className="bg-pink-50 px-3 md:px-4 py-2 font-medium text-gray-700 w-20 md:w-28">本名</td><td className="px-3 md:px-4 py-2">{details.fullname}</td></tr>
                    <tr className="border-b bg-gray-50"><td className="bg-pink-50 px-3 md:px-4 py-2 font-medium text-gray-700">别号</td><td className="px-3 md:px-4 py-2">{details.nickname}</td></tr>
                    <tr className="border-b"><td className="bg-pink-50 px-3 md:px-4 py-2 font-medium text-gray-700">生日</td><td className="px-3 md:px-4 py-2">{details.birth}</td></tr>
                    <tr className="border-b bg-gray-50"><td className="bg-pink-50 px-3 md:px-4 py-2 font-medium text-gray-700">身高</td><td className="px-3 md:px-4 py-2">{details.height}</td></tr>
                    <tr className="border-b"><td className="bg-pink-50 px-3 md:px-4 py-2 font-medium text-gray-700">CV</td><td className="px-3 md:px-4 py-2">{details.cv}</td></tr>
                    <tr className="bg-gray-50"><td className="bg-pink-50 px-3 md:px-4 py-2 font-medium text-gray-700">萌点</td><td className="px-3 md:px-4 py-2"><div className="flex flex-wrap gap-1">{details.moe.map((m: string, i: number) => (<span key={i} className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded text-[10px] md:text-xs">{m}</span>))}</div></td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-lg shadow-md border border-pink-200 overflow-hidden mb-4 md:mb-6">
                <div className="bg-pink-500 text-white px-3 md:px-4 py-2 font-bold text-sm md:text-base">📝 简介</div>
                <div className="p-3 md:p-4 text-gray-700 text-sm md:text-base leading-relaxed">{character.description || '暂无...'}</div>
              </div>

              {details.works.length > 0 && (
                <div className="bg-white rounded-lg shadow-md border border-pink-200 overflow-hidden mb-4 md:mb-6">
                  <div className="bg-pink-500 text-white px-3 md:px-4 py-2 font-bold text-sm md:text-base">🎵 代表作品</div>
                  <div className="p-3 md:p-4"><ul className="list-disc list-inside text-gray-700 text-sm space-y-1">{details.works.map((w: string, i: number) => (<li key={i}>{w}</li>))}</ul></div>
                </div>
              )}

              {details.relations.length > 0 && (
                <div className="bg-white rounded-lg shadow-md border border-pink-200 overflow-hidden">
                  <div className="bg-pink-500 text-white px-3 md:px-4 py-2 font-bold text-sm md:text-base">👥 人际关系</div>
                  <div className="p-3 md:p-4 space-y-2">{details.relations.map((r: any, i: number) => (<div key={i} className="flex items-center gap-2 text-sm"><span className="text-pink-500">•</span><span className="font-medium">{r.name}</span><span className="text-gray-400">-</span><span className="text-gray-500">{r.relation}</span></div>))}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 py-4 md:py-6 bg-white border-t text-center text-gray-400 text-xs md:text-sm">
        © 2026 偶气百科 - 二次元人气交易所
      </footer>
      <CharacterChat characterId={character?.id || charId} characterName={character?.name} />
    </div>
  )
}
