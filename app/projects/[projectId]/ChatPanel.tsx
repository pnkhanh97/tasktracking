'use client'
import { useState, useEffect, useRef } from 'react'

type Comment = {
  commentId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export default function ChatPanel({
  projectId,
  currentUser,
}: {
  projectId: string
  currentUser: { id: string; name: string }
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function fetchComments() {
    const res = await fetch(`/api/projects/${projectId}/comments`)
    if (res.ok) {
      const data = await res.json()
      setComments(data.comments ?? [])
    }
  }

  useEffect(() => {
    fetchComments()
    const interval = setInterval(fetchComments, 10000)
    return () => clearInterval(interval)
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)
    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message.trim() }),
    })
    setMessage('')
    await fetchComments()
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  function avatarColor(name: string) {
    const colors = ['bg-[#03A680]', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '600px' }}>
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Chat nhóm</h2>
        <p className="text-xs text-gray-400 mt-0.5">Chỉ thành viên dự án</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8">Chưa có tin nhắn nào.</p>
        )}
        {comments.map(c => {
          const isMe = c.authorId === currentUser.id
          return (
            <div key={c.commentId} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full ${avatarColor(c.authorName)} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {c.authorName[0]}
              </div>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMe && <span className="text-xs text-gray-400 px-1">{c.authorName}</span>}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe ? 'bg-[#03A680] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {c.content}
                </div>
                <span className="text-xs text-gray-300 px-1">{c.createdAt}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 py-3 border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin... (Enter để gửi)"
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680] resize-none"
          />
          <button type="submit" disabled={sending || !message.trim()}
            className="bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-50 text-white p-2 rounded-xl transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
