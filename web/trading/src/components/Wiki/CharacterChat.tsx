import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type ChatStatus = 'closed' | 'connecting' | 'queued' | 'ready' | 'error'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  text: string
}

type WsServerMessage =
  | { type: 'queued'; position?: number; retry_in_ms?: number; max_wait_ms?: number }
  | { type: 'ready'; session_id: string }
  | { type: 'assistant_delta'; text: string }
  | { type: 'assistant_done' }
  | { type: 'error'; code?: string; message?: string }
  | { type: 'close_soon'; reason?: string }
  | { type: string; [k: string]: any }

export function CharacterChat(props: { characterId: string; characterName?: string }) {
  const { characterId, characterName } = props
  const token = localStorage.getItem('token') || ''
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ChatStatus>('closed')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const statusRef = useRef<ChatStatus>('closed')
  const sessionKey = `chat_session_${characterId}`
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    if (!characterId) return
    if (!token) {
      setStatus('error')
      setMessages([{ role: 'system', text: '请先登录后再与角色对话。' }])
      return
    }

    setStatus('connecting')
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${proto}://${window.location.host}/ws/chat`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      const sessionId = localStorage.getItem(sessionKey) || ''
      ws.send(
        JSON.stringify({
          type: 'init',
          token: `Bearer ${token}`,
          character_id: characterId,
          session_id: sessionId || undefined,
        })
      )
    }

    ws.onmessage = (ev) => {
      let msg: WsServerMessage
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }

      if (msg.type === 'queued') {
        setStatus('queued')
        const pos = msg.position ?? '?'
        setMessages((prev) => {
          const next = prev.filter((m) => m.role !== 'system')
          return [...next, { role: 'system', text: `排队中… 位置：${pos}` }]
        })
        return
      }

      if (msg.type === 'ready') {
        setStatus('ready')
        if (msg.session_id) localStorage.setItem(sessionKey, msg.session_id)
        setMessages((prev) => {
          if (prev.some((m) => m.role === 'system' && m.text.includes('已连接'))) return prev
          const name = characterName ? `「${characterName}」` : '角色'
          return [...prev, { role: 'system', text: `已连接到${name}，开始聊天吧。` }]
        })
        return
      }

      if (msg.type === 'assistant_delta') {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', text: last.text + (msg.text || '') }]
          }
          return [...prev, { role: 'assistant', text: msg.text || '' }]
        })
        return
      }

      if (msg.type === 'assistant_done') {
        return
      }

      if (msg.type === 'close_soon') {
        setMessages((prev) => [...prev, { role: 'system', text: '会话将因长时间未聊天而关闭。' }])
        ws.close()
        return
      }

      if (msg.type === 'error') {
        setStatus('error')
        setMessages((prev) => [
          ...prev,
          { role: 'system', text: `错误：${msg.code || 'UNKNOWN'} ${msg.message || ''}`.trim() },
        ])
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      setStatus((s) => (s === 'closed' ? 'closed' : 'error'))
    }

    ws.onerror = () => {
      setStatus('error')
    }

    return () => {
      try {
        ws.close()
      } catch {}
    }
  }, [open, characterId, token, characterName, sessionKey])

  const send = () => {
    const text = input.trim()
    if (!text) return
    if (!wsRef.current || statusRef.current === 'connecting') return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    wsRef.current.send(JSON.stringify({ type: 'user_message', text, client_msg_id: `${Date.now()}` }))
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-full bg-pink-500 text-white shadow-lg hover:bg-pink-600"
        >
          与角色对话
        </button>
      ) : (
        <div className="w-[320px] h-[420px] bg-white rounded-xl shadow-xl border border-pink-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-pink-500 text-white">
            <div className="text-sm font-bold truncate">
              对话 {characterName ? `· ${characterName}` : ''}
            </div>
            <button
              onClick={() => {
                setOpen(false)
                setStatus('closed')
                setMessages([])
              }}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
            >
              关闭
            </button>
          </div>

          <div className="px-3 py-2 text-[11px] text-gray-500 border-b bg-pink-50 flex items-center justify-between">
            <span>
              状态：
              {status === 'connecting' && '连接中'}
              {status === 'queued' && '排队中'}
              {status === 'ready' && '已连接'}
              {status === 'error' && '异常/已断开'}
              {status === 'closed' && '未连接'}
            </span>
            {!token ? (
              <Link to="/login" className="text-pink-600 hover:underline">
                去登录
              </Link>
            ) : null}
          </div>

          <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={[
                    'inline-block max-w-[90%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap',
                    m.role === 'user' ? 'bg-pink-500 text-white' : '',
                    m.role === 'assistant' ? 'bg-gray-100 text-gray-800' : '',
                    m.role === 'system' ? 'bg-yellow-50 text-gray-700 border border-yellow-100' : '',
                  ].join(' ')}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-2 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={token ? '输入消息…' : '登录后可对话'}
                disabled={!token || status === 'error' || status === 'closed'}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-50"
              />
              <button
                onClick={send}
                disabled={!token || !input.trim() || status === 'connecting' || status === 'error' || status === 'closed'}
                className="px-3 py-2 rounded-lg bg-pink-500 text-white text-sm disabled:opacity-50"
              >
                发送
              </button>
            </div>
            {(status === 'error' || status === 'closed') && token ? (
              <button
                onClick={() => {
                  setMessages((prev) => [...prev, { role: 'system', text: '正在重新连接…' }])
                  setStatus('connecting')
                  setOpen(false)
                  setTimeout(() => setOpen(true), 50)
                }}
                className="mt-2 text-xs text-pink-600 hover:underline"
              >
                重新连接
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
