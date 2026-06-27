'use client'
import { useActionState } from 'react'
import { createProjectAction } from '@/app/actions/projects'

const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']

type Staff = { staffId: string; name: string }

export default function NewProjectPage() {
  return <NewProjectForm />
}

// Separate client component that fetches staff list
import { useEffect, useState } from 'react'

function NewProjectForm() {
  const [state, action, pending] = useActionState(createProjectAction, undefined)
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(d => setStaff(d.staff ?? []))
  }, [])

  function toggleMember(id: string) {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href="/projects" className="text-sm text-gray-400 hover:text-gray-600">← Quay lại</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Tạo project mới</h1>
      </div>

      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên project <span className="text-red-500">*</span></label>
          <input name="name" required placeholder="Nhập tên project..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea name="description" rows={3} placeholder="Mục tiêu, phạm vi công việc..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680] resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
            <input name="startDate" type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
            <input name="deadline" type="date" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
          <select name="priority" defaultValue="Trung bình"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]">
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Manager <span className="text-red-500">*</span></label>
          <select name="manager" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]">
            <option value="">-- Chọn manager --</option>
            {staff.map(s => (
              <option key={s.staffId} value={s.staffId}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thành viên <span className="text-gray-400 font-normal">({selectedMembers.length} đã chọn)</span>
          </label>
          <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-100">
            {staff.map(s => (
              <label key={s.staffId} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="members"
                  value={s.staffId}
                  checked={selectedMembers.includes(s.staffId)}
                  onChange={() => toggleMember(s.staffId)}
                  className="accent-[#03A680]"
                />
                <span className="text-sm text-gray-700">{s.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{s.staffId}</span>
              </label>
            ))}
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            {pending ? 'Đang tạo...' : 'Tạo project'}
          </button>
          <a href="/projects"
            className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Huỷ
          </a>
        </div>
      </form>
    </div>
  )
}
