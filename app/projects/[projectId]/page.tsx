import { getProjectById } from '@/lib/projects'
import { getSheetData } from '@/lib/sheets'
import { notFound } from 'next/navigation'

const STATUS_COLOR: Record<string, string> = {
  'Chờ khởi động': 'bg-gray-100 text-gray-600',
  'Đang thực hiện': 'bg-blue-100 text-blue-700',
  'Hoàn thành':    'bg-green-100 text-green-700',
  'Tạm dừng':      'bg-yellow-100 text-yellow-700',
}

const PRIORITY_COLOR: Record<string, string> = {
  'Khẩn cấp':  'bg-red-100 text-red-700',
  'Cao':        'bg-orange-100 text-orange-700',
  'Trung bình': 'bg-yellow-100 text-yellow-700',
  'Thấp':       'bg-gray-100 text-gray-600',
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [project, staffData] = await Promise.all([
    getProjectById(projectId),
    getSheetData('user'),
  ])

  if (!project) notFound()

  const h = staffData[0] ?? []
  const idIdx = h.indexOf('StaffID')
  const nameIdx = h.indexOf('Staff')
  const emailIdx = h.indexOf('Email')
  const staffMap: Record<string, { name: string; email: string }> = {}
  staffData.slice(1).forEach(row => {
    if (row[idIdx]) staffMap[row[idIdx]] = { name: row[nameIdx] ?? '', email: row[emailIdx] ?? '' }
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <a href="/projects" className="text-sm text-gray-400 hover:text-gray-600">← Quay lại</a>
        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">{project.projectId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[project.status] ?? ''}`}>
                {project.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[project.priority] ?? ''}`}>
                {project.priority}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{project.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Thông tin</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Bắt đầu</dt>
              <dd className="text-gray-900">{project.startDate || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Deadline</dt>
              <dd className="text-gray-900 font-medium">{project.deadline}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Tạo bởi</dt>
              <dd className="text-gray-900">{staffMap[project.createdBy]?.name ?? project.createdBy}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ngày tạo</dt>
              <dd className="text-gray-900">{project.createdAt}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Mô tả</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {project.description || <span className="text-gray-400 italic">Chưa có mô tả.</span>}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Thành viên</h2>
        <div className="space-y-2">
          {/* Manager */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#03A680]/5">
            <div className="w-8 h-8 rounded-full bg-[#03A680] text-white flex items-center justify-center text-xs font-bold">
              {staffMap[project.manager]?.name?.[0] ?? 'M'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {staffMap[project.manager]?.name ?? project.manager}
              </div>
              <div className="text-xs text-gray-400">{staffMap[project.manager]?.email}</div>
            </div>
            <span className="ml-auto text-xs bg-[#03A680]/10 text-[#03A680] px-2 py-0.5 rounded-full">Manager</span>
          </div>

          {/* Members */}
          {project.members.filter(m => m !== project.manager).map(memberId => (
            <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                {staffMap[memberId]?.name?.[0] ?? '?'}
              </div>
              <div>
                <div className="text-sm text-gray-900">{staffMap[memberId]?.name ?? memberId}</div>
                <div className="text-xs text-gray-400">{staffMap[memberId]?.email}</div>
              </div>
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Member</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
          <button className="text-sm text-[#03A680] hover:underline" disabled>
            + Thêm task (sắp ra mắt)
          </button>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">Chưa có task nào.</p>
      </div>
    </div>
  )
}
