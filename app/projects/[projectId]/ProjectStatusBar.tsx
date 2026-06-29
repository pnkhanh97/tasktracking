'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  'Chờ khởi động': [
    { label: 'Khởi động dự án', next: 'Đang thực hiện', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ],
  'Đang thực hiện': [
    { label: 'Hoàn thành dự án', next: 'Hoàn thành', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Tạm dừng', next: 'Tạm dừng', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
  ],
  'Tạm dừng': [
    { label: 'Tiếp tục', next: 'Đang thực hiện', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
  ],
  'Hoàn thành': [],
}

export default function ProjectStatusBar({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const actions = TRANSITIONS[currentStatus] ?? []
  if (actions.length === 0) return null

  async function changeStatus(status: string) {
    setLoading(true)
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', status }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500">Cập nhật dự án:</span>
      {actions.map(a => (
        <button key={a.next} onClick={() => changeStatus(a.next)} disabled={loading}
          className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60 ${a.color}`}>
          {loading ? '...' : a.label}
        </button>
      ))}
    </div>
  )
}
