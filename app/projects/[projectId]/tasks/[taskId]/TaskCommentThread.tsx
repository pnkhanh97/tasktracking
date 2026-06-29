'use client'
import { useState, useEffect, useRef } from 'react'

type Comment = {
  commentId: string
  taskId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

const EMOJIS = ['👍','❤️','😄','🎉','🔥','👀','✅','💪']

const AVATAR_COLORS = ['bg-[#03A680]','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-indigo-500']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function TaskCommentThread({
  taskId,
  currentUser,
}: {
  taskId: string
  currentUser: { id: string; name: string }
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function load() {
    const res = await fetch(`/api/tasks/${taskId}/comments`)
    if (res.ok) setComments(await res.json())
  }

  useEffect(() => { load() }, [taskId])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) { setText(t => t + emoji); return }
    const start = el.selectionStart ?? text.length
    const end   = el.selectionEnd   ?? text.length
    const next  = text.slice(0, start) + emoji + text.slice(end)
    setText(next)
    setShowEmoji(false)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  async function send() {
    if (!text.trim()) return
    setSending(true)
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    })
    if (res.ok) {
      setText('')
      await load()
    }
    setSending(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Bình luận ({comments.length})</h2>
      </div>

      {/* Comment list */}
      <div className="px-4 py-3 space-y-4 max-h-96 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Chưa có bình luận nào.</p>
        )}
        {comments.map(c => {
          const isMe = c.authorId === currentUser.id
          return (
            <div key={c.commentId} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full ${avatarColor(c.authorName)} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {c.authorName[0]}
              </div>
              {/* Bubble */}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-medium text-gray-700">{isMe ? 'Bạn' : c.authorName}</span>
                  <span className="text-xs text-gray-400">{c.createdAt}</span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                  ${isMe
                    ? 'bg-[#03A680] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                  {c.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-end gap-2">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full ${avatarColor(currentUser.name)} text-white flex items-center justify-center text-xs font-bold shrink-0 mb-0.5`}>
            {currentUser.name[0]}
          </div>

          <div className="flex-1 relative">
            <div className="flex items-end bg-gray-100 rounded-2xl px-3 py-2 gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="Viết bình luận... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-5 max-h-32 overflow-y-auto"
                style={{ minHeight: '20px' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 128) + 'px'
                }}
              />

              {/* Emoji button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEmoji(s => !s)}
                  className="text-gray-400 hover:text-yellow-500 transition-colors text-lg leading-none"
                  title="Thêm emoji"
                >
                  😊
                </button>
                {showEmoji && (
                  <div className="absolute bottom-8 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1.5 z-10">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => insertEmoji(e)}
                        className="text-xl hover:scale-125 transition-transform leading-none p-0.5">
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="w-8 h-8 bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-40 text-white rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors"
            title="Gửi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
