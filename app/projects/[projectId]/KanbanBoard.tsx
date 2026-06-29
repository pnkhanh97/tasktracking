'use client'
import { useState } from 'react'

type Task = {
  taskId: string
  title: string
  description: string
  assignees: string[]
  priority: string
  status: string
  deadline: string
  result: string
  submittedAt: string
  docLink: string
  attachmentFolder: string
}

type Staff = { staffId: string; name: string }

const COLUMNS = [
  { key: 'Chờ thực hiện', label: 'Chờ thực hiện', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400', count: 'bg-gray-100 text-gray-600' },
  { key: 'Đang thực hiện', label: 'Đang thực hiện', color: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', count: 'bg-blue-100 text-blue-700' },
  { key: 'Chờ duyệt',     label: 'Chờ duyệt',     color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', count: 'bg-yellow-100 text-yellow-700' },
  { key: 'Hoàn thành',    label: 'Hoàn thành',    color: 'bg-green-50 border-green-200', dot: 'bg-green-500', count: 'bg-green-100 text-green-700' },
]

const PRIORITY_COLOR: Record<string, string> = {
  'Khẩn cấp': 'bg-red-100 text-red-700',
  'Cao':       'bg-orange-100 text-orange-700',
  'Trung bình':'bg-yellow-100 text-yellow-700',
  'Thấp':      'bg-gray-100 text-gray-500',
}

const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']

function Avatar({ name }: { name: string }) {
  const colors = ['bg-[#03A680]', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-6 h-6 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
      {name[0]}
    </div>
  )
}

export default function KanbanBoard({
  projectId, initialTasks, staffMap, members, canManage, currentUserId,
}: {
  projectId: string
  initialTasks: Task[]
  staffMap: Record<string, { name: string; email: string }>
  members: Staff[]
  canManage: boolean
  currentUserId: string
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', assignees: [] as string[],
    priority: 'Trung bình', deadline: '', docLink: '',
  })

  function toggleAssignee(id: string) {
    setForm(p => ({
      ...p,
      assignees: p.assignees.includes(id) ? p.assignees.filter(a => a !== id) : [...p.assignees, id],
    }))
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (form.assignees.length === 0) return
    setSubmitting(true)
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setTasks(prev => [...prev, {
        ...form, taskId: data.taskId, status: 'Chờ thực hiện',
        result: '', submittedAt: '', attachmentFolder: '',
      }])
      setForm({ title: '', description: '', assignees: [], priority: 'Trung bình', deadline: '', docLink: '' })
      setShowForm(false)
    }
    setSubmitting(false)
  }

  async function handleStatusChange(task: Task, status: string) {
    await fetch(`/api/tasks/${task.taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', status }),
    })
    setTasks(prev => prev.map(t => t.taskId === task.taskId ? { ...t, status } : t))
  }

  const byStatus = (status: string) => tasks.filter(t => t.status === status)
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'Hoàn thành').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Tasks ({total})</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{pct}% hoàn thành</span>
            {canManage && (
              <button onClick={() => setShowForm(!showForm)}
                className="text-sm bg-[#03A680] hover:bg-[#028a6a] text-white px-3 py-1 rounded-lg transition-colors">
                + Thêm task
              </button>
            )}
          </div>
        </div>
        {total > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#03A680' }} />
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && canManage && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tạo task mới</h3>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Tên task *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Tên công việc..."
                className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Chi tiết công việc..."
                className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680] resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Link tài liệu</label>
              <input value={form.docLink} onChange={e => setForm(p => ({ ...p, docLink: e.target.value }))}
                placeholder="https://..."
                className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Ưu tiên</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]">
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Giao cho * ({form.assignees.length} đã chọn)</label>
              <div className="mt-1 border border-gray-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-gray-100 bg-white">
                {members.map(m => (
                  <label key={m.staffId} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.assignees.includes(m.staffId)}
                      onChange={() => toggleAssignee(m.staffId)} className="accent-[#03A680]" />
                    <span className="text-sm text-gray-700">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting || form.assignees.length === 0}
                className="bg-[#03A680] text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
                {submitting ? 'Đang tạo...' : 'Tạo task'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Huỷ</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban columns */}
      {total === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
          Chưa có task nào.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.key)
            return (
              <div key={col.key} className={`rounded-xl border ${col.color} p-3`}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                  <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full ${col.count}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[60px]">
                  {colTasks.map(task => {
                    const isAssignee = task.assignees.includes(currentUserId)
                    const isOverdue = task.deadline && task.status !== 'Hoàn thành'
                      && new Date(task.deadline) < new Date()
                    return (
                      <a key={task.taskId} href={`/projects/${projectId}/tasks/${task.taskId}`}
                        className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-[#03A680] hover:shadow-sm transition-all">
                        {/* Task ID + priority */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-mono text-[#03A680] font-medium">{task.taskId}</span>
                          {task.priority && task.priority !== 'Trung bình' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLOR[task.priority] ?? ''}`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {/* Title */}
                        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{task.title}</p>
                        {/* Footer: deadline + assignees */}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          {task.deadline ? (
                            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              {isOverdue ? '⚠ ' : ''}{task.deadline}
                            </span>
                          ) : <span />}
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map(a => (
                              <Avatar key={a} name={staffMap[a]?.name ?? a} />
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold border border-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Inline action for assignee */}
                        {isAssignee && task.status === 'Chờ thực hiện' && (
                          <button
                            onClick={async e => { e.preventDefault(); await handleStatusChange(task, 'Đang thực hiện') }}
                            className="mt-2 w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-1 rounded transition-colors font-medium">
                            Nhận task
                          </button>
                        )}
                        {isAssignee && task.status === 'Đang thực hiện' && (
                          <span className="mt-2 block w-full text-xs bg-[#03A680]/10 text-[#03A680] py-1 rounded text-center font-medium">
                            Nộp kết quả →
                          </span>
                        )}
                        {canManage && task.status === 'Chờ duyệt' && (
                          <button
                            onClick={async e => { e.preventDefault(); await handleStatusChange(task, 'Hoàn thành') }}
                            className="mt-2 w-full text-xs bg-green-50 text-green-700 hover:bg-green-100 py-1 rounded transition-colors font-medium">
                            Kết thúc
                          </button>
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
