'use client'
import { useState } from 'react'

type Task = {
  taskId: string
  title: string
  description: string
  assignedTo: string
  priority: string
  status: string
  deadline: string
  result: string
  submittedAt: string
}

type Staff = { staffId: string; name: string }

const STATUS_COLOR: Record<string, string> = {
  'Chờ thực hiện': 'bg-gray-100 text-gray-500',
  'Đang thực hiện': 'bg-blue-100 text-blue-700',
  'Chờ duyệt':     'bg-yellow-100 text-yellow-700',
  'Hoàn thành':    'bg-green-100 text-green-700',
}

const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']
const STATUSES = ['Chờ thực hiện', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành']

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState('')
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'Trung bình', deadline: '' })

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setTasks(prev => [...prev, { ...form, taskId: data.taskId, status: 'Chờ thực hiện', result: '', submittedAt: '' }])
      setForm({ title: '', description: '', assignedTo: '', priority: 'Trung bình', deadline: '' })
      setShowForm(false)
    }
    setSubmitting(false)
  }

  async function handleSubmitResult(task: Task) {
    if (!result.trim()) return
    setSubmitting(true)
    await fetch(`/api/tasks/${task.taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', result }),
    })
    setTasks(prev => prev.map(t => t.taskId === task.taskId ? { ...t, status: 'Chờ duyệt', result } : t))
    setSelectedTask(null)
    setResult('')
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

      {/* Create form */}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Giao cho *</label>
              <select required value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
                className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]">
                <option value="">-- Chọn --</option>
                {members.map(m => <option key={m.staffId} value={m.staffId}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Ưu tiên</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Deadline</label>
            <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
              className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="bg-[#03A680] text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
              {submitting ? 'Đang tạo...' : 'Tạo task'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Huỷ</button>
          </div>
        </form>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có task nào.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.taskId} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{task.taskId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Giao cho: <span className="text-gray-600">{staffMap[task.assignedTo]?.name ?? task.assignedTo}</span></span>
                    {task.deadline && <span>Deadline: {task.deadline}</span>}
                  </div>
                  {task.result && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      <span className="font-medium">Kết quả: </span>{task.result}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  {/* Assignee submit result */}
                  {task.assignedTo === currentUserId && task.status === 'Đang thực hiện' && (
                    <button onClick={() => { setSelectedTask(task); setResult('') }}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                      Nộp kết quả
                    </button>
                  )}
                  {/* Manager approve */}
                  {canManage && task.status === 'Chờ duyệt' && (
                    <button onClick={() => handleStatusChange(task, 'Hoàn thành')}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors">
                      Duyệt
                    </button>
                  )}
                  {/* Manager change status */}
                  {canManage && task.status === 'Chờ thực hiện' && (
                    <button onClick={() => handleStatusChange(task, 'Đang thực hiện')}
                      className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                      Bắt đầu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit result modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-gray-900">Nộp kết quả</h3>
            <p className="text-sm text-gray-500">{selectedTask.title}</p>
            <textarea
              value={result}
              onChange={e => setResult(e.target.value)}
              rows={4}
              placeholder="Mô tả kết quả công việc đã hoàn thành..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => handleSubmitResult(selectedTask)} disabled={submitting || !result.trim()}
                className="bg-[#03A680] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
                {submitting ? 'Đang nộp...' : 'Nộp kết quả'}
              </button>
              <button onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
