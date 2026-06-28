'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FileRef = { name: string; url: string }
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
  startedAt: string
  createdAt: string
  docLink: string
  attachmentFolder: string
  resultFiles: FileRef[]
}

const STATUS_COLOR: Record<string, string> = {
  'Chờ thực hiện': 'bg-gray-100 text-gray-500',
  'Đang thực hiện': 'bg-blue-100 text-blue-700',
  'Chờ duyệt':     'bg-yellow-100 text-yellow-700',
  'Hoàn thành':    'bg-green-100 text-green-700',
}
const PRIORITY_COLOR: Record<string, string> = {
  'Khẩn cấp':  'bg-red-100 text-red-700',
  'Cao':        'bg-orange-100 text-orange-700',
  'Trung bình': 'bg-yellow-100 text-yellow-700',
  'Thấp':       'bg-gray-100 text-gray-600',
}

export default function TaskDetail({
  projectId, task, assigneeNames, createdByName, isAssignee, canManage,
}: {
  projectId: string
  task: Task
  assigneeNames: string[]
  createdByName: string
  isAssignee: boolean
  canManage: boolean
}) {
  const router = useRouter()
  const [result, setResult] = useState(task.result)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const canAccept = isAssignee && task.status === 'Chờ thực hiện'
  const canSubmit = isAssignee && (task.status === 'Đang thực hiện' || task.status === 'Chờ duyệt')

  async function handleSubmit() {
    setError('')
    if (!result.trim() && files.length === 0) {
      setError('Vui lòng nhập kết quả hoặc đính kèm file.')
      return
    }
    setUploading(true)
    try {
      // 1. Upload từng file lên Drive
      const uploaded: FileRef[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/tasks/${task.taskId}/upload`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload lỗi')
        uploaded.push({ name: data.name, url: data.url })
      }
      // 2. Lưu kết quả + danh sách file
      const res = await fetch(`/api/tasks/${task.taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', result, files: uploaded }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Lưu lỗi')
      }
      router.refresh()
      setFiles([])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  async function handleStatus(status: string) {
    await fetch(`/api/tasks/${task.taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', status }),
    })
    router.refresh()
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <a href={`/projects/${projectId}`} className="text-sm text-gray-400 hover:text-gray-600">← Quay lại project</a>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-xs text-gray-400 font-mono">{task.taskId}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status] ?? ''}`}>{task.status}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority] ?? ''}`}>{task.priority}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{task.title}</h1>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Giao cho</span><span className="font-medium text-right">{assigneeNames.join(', ')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className="font-medium">{task.deadline || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Tạo bởi</span><span>{createdByName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Ngày tạo</span><span>{task.createdAt}</span></div>
          {task.startedAt && (
            <div className="flex justify-between"><span className="text-gray-500">Bắt đầu lúc</span><span>{task.startedAt}</span></div>
          )}
          {task.submittedAt && task.status === 'Hoàn thành' && (
            <div className="flex justify-between"><span className="text-gray-500">Hoàn thành lúc</span><span>{task.submittedAt}</span></div>
          )}
        </div>

        {task.description && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Mô tả</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-3">
          {task.docLink && (
            <a href={task.docLink} target="_blank" rel="noopener noreferrer"
              className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
              📄 Link tài liệu
            </a>
          )}
          {task.attachmentFolder && (
            <a href={task.attachmentFolder} target="_blank" rel="noopener noreferrer"
              className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              🗂️ Thư mục đính kèm
            </a>
          )}
        </div>
      </div>

      {/* Assignee: Nhận task */}
      {canAccept && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center gap-3">
          <span className="text-sm text-blue-700">Task này đang chờ bạn nhận.</span>
          <button onClick={() => handleStatus('Đang thực hiện')}
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
            Nhận task
          </button>
        </div>
      )}

      {/* Manager actions */}
      {canManage && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 mr-2">Quản lý:</span>
          {task.status === 'Chờ duyệt' && (
            <button onClick={() => handleStatus('Hoàn thành')}
              className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100">Kết thúc</button>
          )}
          {(task.status === 'Đang thực hiện' || task.status === 'Chờ duyệt') && (
            <button onClick={() => handleStatus('Tạm dừng')}
              className="text-sm bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100">Tạm dừng</button>
          )}
          {task.status === 'Tạm dừng' && (
            <button onClick={() => handleStatus('Đang thực hiện')}
              className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100">Tiếp tục</button>
          )}
        </div>
      )}

      {/* Result submitted */}
      {(task.result || task.resultFiles.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Kết quả đã nộp</h2>
            {task.submittedAt && <span className="text-xs text-gray-400">{task.submittedAt}</span>}
          </div>
          {task.result && <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.result}</p>}
          {task.resultFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {task.resultFiles.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  📎 {f.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit form for assignees */}
      {canSubmit && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Nộp kết quả</h2>
          <textarea value={result} onChange={e => setResult(e.target.value)} rows={4}
            placeholder="Mô tả kết quả công việc..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680] resize-none" />
          <div>
            <label className="text-xs font-medium text-gray-600">File đính kèm / Hình chụp</label>
            <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full mt-1 text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#03A680] file:text-white file:text-sm hover:file:bg-[#028a6a] file:cursor-pointer" />
            {files.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{files.length} file sẽ được tải lên thư mục {task.taskId}</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleSubmit} disabled={uploading}
            className="bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            {uploading ? 'Đang nộp...' : 'Nộp kết quả'}
          </button>
        </div>
      )}
    </div>
  )
}
