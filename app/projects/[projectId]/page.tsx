import { getProjectById } from '@/lib/projects'
import { getSheetData } from '@/lib/sheets'
import { getTasksByProject } from '@/lib/tasks'
import { getSession } from '@/lib/session'
import { notFound } from 'next/navigation'
import ChatPanel from './ChatPanel'
import TaskPanel from './TaskPanel'

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
  const [project, staffData, tasks, session] = await Promise.all([
    getProjectById(projectId),
    getSheetData('user'),
    getTasksByProject(projectId),
    getSession(),
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

  const members = staffData.slice(1)
    .filter(row => project.members.includes(row[idIdx]) || row[idIdx] === project.manager)
    .map(row => ({ staffId: row[idIdx], name: row[nameIdx] ?? '' }))

  const canManage = session?.role === 'admin' || session?.role === 'manager' || project.manager === session?.userId

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <a href="/projects" className="text-sm text-gray-400 hover:text-gray-600">← Quay lại</a>
        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">{project.projectId}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[project.status] ?? ''}`}>{project.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[project.priority] ?? ''}`}>{project.priority}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-3 gap-4 items-start">
        {/* Left: info + tasks (2/3) */}
        <div className="col-span-2 space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="font-medium">{staffMap[project.manager]?.name ?? project.manager}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className="font-medium">{project.deadline}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Bắt đầu</span><span>{project.startDate || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tạo bởi</span><span>{staffMap[project.createdBy]?.name ?? project.createdBy}</span></div>
            </div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Thành viên ({members.length})</h2>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <div key={m.staffId} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                  <div className="w-5 h-5 rounded-full bg-[#03A680] text-white flex items-center justify-center text-xs font-bold">
                    {m.name[0]}
                  </div>
                  <span className="text-xs text-gray-700">{m.name}</span>
                  {m.staffId === project.manager && <span className="text-xs text-[#03A680]">PM</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <TaskPanel
            projectId={projectId}
            initialTasks={tasks}
            staffMap={staffMap}
            members={members}
            canManage={canManage ?? false}
            currentUserId={session?.userId ?? ''}
          />
        </div>

        {/* Right: Chat (1/3) */}
        <div className="col-span-1">
          <ChatPanel projectId={projectId} currentUser={{ id: session?.userId ?? '', name: session?.name ?? '' }} />
        </div>
      </div>
    </div>
  )
}
