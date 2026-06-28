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

const STATUS_COLOR: Record<string, string> = {
  'Chờ thực hiện': 'bg-gray-100 text-gray-500',
  'Đang thực hiện': 'bg-blue-100 text-blue-700',
  'Chờ duyệt':     'bg-yellow-100 text-yellow-700',
  'Hoàn thành':    'bg-green-100 text-green-700',
}

const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']

export default function TaskPanel({
  projectId, initialTasks, staffMap, members, canManage, currentUserId
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Tasks ({tasks.length})</h2>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="text-sm bg-[#03A680] hover:bg-[#028a6a] text-white px-3 py-1 rounded-lg transition-colors">
            + Thêm task
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreateTask} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
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
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có task nào.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.taskId} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`/projects/${projectId}/tasks/${task.taskId}`}
                      className="text-xs font-mono text-[#03A680] hover:underline font-medium">
                      {task.taskId}
                    </a>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {task.status}
                    </span>
                  </div>
                  <a href={`/projects/${projectId}/tasks/${task.taskId}`} className="block">
                    <p className="text-sm font-medium text-gray-900 mt-1 hover:text-[#03A680]">{task.title}</p>
                  </a>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>Giao cho: <span className="text-gray-600">
                      {task.assignees.map(a => staffMap[a]?.name ?? a).join(', ')}
                    </span></span>
                    {task.deadline && <span>Deadline: {task.deadline}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {/* Assignee actions */}
                  {task.assignees.includes(currentUserId) && task.status === 'Chờ thực hiện' && (
                    <button onClick={() => handleStatusChange(task, 'Đang thực hiện')}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                      Nhận task
                    </button>
                  )}
                  {task.assignees.includes(currentUserId) && task.status === 'Đang thực hiện' && (
                    <a href={`/projects/${projectId}/tasks/${task.taskId}`}
                      className="text-xs bg-[#03A680]/10 text-[#03A680] hover:bg-[#03A680]/20 px-2 py-1 rounded transition-colors text-center">
                      Đã xong
                    </a>
                  )}
                  {/* PM action */}
                  {canManage && task.status === 'Chờ duyệt' && (
                    <button onClick={() => handleStatusChange(task, 'Hoàn thành')}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors">
                      Kết thúc
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
