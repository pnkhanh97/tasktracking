import { getProjects } from '@/lib/projects'
import { getSheetData } from '@/lib/sheets'
import { getSession } from '@/lib/session'

const PRIORITY_COLOR: Record<string, string> = {
  'Khẩn cấp': 'bg-red-100 text-red-700',
  'Cao':       'bg-orange-100 text-orange-700',
  'Trung bình':'bg-yellow-100 text-yellow-700',
  'Thấp':      'bg-gray-100 text-gray-600',
}

const STATUS_COLOR: Record<string, string> = {
  'Chờ khởi động': 'bg-gray-100 text-gray-600',
  'Đang thực hiện':'bg-blue-100 text-blue-700',
  'Hoàn thành':    'bg-green-100 text-green-700',
  'Tạm dừng':      'bg-yellow-100 text-yellow-700',
}

export default async function ProjectsPage() {
  const session = await getSession()
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let staffData: string[][] = []
  let loadError = ''
  try {
    ;[projects, staffData] = await Promise.all([getProjects(), getSheetData('user')])
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
  }

  // Build staffId -> name map
  const h = staffData[0] ?? []
  const idIdx = h.indexOf('StaffID')
  const nameIdx = h.indexOf('Staff')
  const staffMap: Record<string, string> = {}
  staffData.slice(1).forEach(row => {
    if (row[idIdx]) staffMap[row[idIdx]] = row[nameIdx] ?? row[idIdx]
  })

  // Filter by role
  const visible = session?.role === 'member'
    ? projects.filter(p =>
        p.members.includes(session.userId) || p.manager === session.userId
      )
    : projects

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Lỗi: {loadError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{visible.length} project</p>
        </div>
        {session?.role !== 'member' && (
          <a
            href="/projects/new"
            className="bg-[#03A680] hover:bg-[#028a6a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Tạo project
          </a>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Chưa có project nào.
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map(p => (
            <a
              key={p.projectId}
              href={`/projects/${p.projectId}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#03A680] hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">{p.projectId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[p.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.priority}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 mt-1">{p.name}</h2>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>Manager: <span className="text-gray-600">{staffMap[p.manager] ?? p.manager}</span></span>
                    <span>Deadline: <span className="text-gray-600">{p.deadline}</span></span>
                    <span>{p.members.length} thành viên</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
