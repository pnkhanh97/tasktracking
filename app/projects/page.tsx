import { getProjects } from '@/lib/projects'
import { getSheetData } from '@/lib/sheets'
import { getSession } from '@/lib/session'
import { getTaskSummaryByProject } from '@/lib/tasks'

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
  let taskSummary: Record<string, { total: number; done: number; inProgress: number }> = {}
  let loadError = ''
  try {
    ;[projects, staffData, taskSummary] = await Promise.all([
      getProjects(), getSheetData('user'), getTaskSummaryByProject(),
    ])
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
  }

  const h = staffData[0] ?? []
  const idIdx = h.indexOf('StaffID')
  const nameIdx = h.indexOf('Staff')
  const staffMap: Record<string, string> = {}
  staffData.slice(1).forEach(row => {
    if (row[idIdx]) staffMap[row[idIdx]] = row[nameIdx] ?? row[idIdx]
  })

  const visible = session?.role === 'member'
    ? projects.filter(p => p.members.includes(session.userId) || p.manager === session.userId)
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
          <a href="/projects/new"
            className="bg-[#03A680] hover:bg-[#028a6a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
          {visible.map(p => {
            const stats = taskSummary[p.projectId] ?? { total: 0, done: 0, inProgress: 0 }
            const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
            return (
              <a key={p.projectId} href={`/projects/${p.projectId}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#03A680] hover:shadow-sm transition-all block">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
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
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                      <span>Manager: <span className="text-gray-600">{staffMap[p.manager] ?? p.manager}</span></span>
                      <span>Deadline: <span className="text-gray-600">{p.deadline}</span></span>
                      <span>{p.members.length} thành viên</span>
                      {stats.total > 0 && (
                        <span className="text-gray-500">
                          {stats.done}/{stats.total} tasks xong
                        </span>
                      )}
                    </div>

                    {/* Progress bar — chỉ hiện khi có task */}
                    {stats.total > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Tiến độ</span>
                          <span className="text-xs font-medium text-gray-600">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct === 100 ? '#16a34a' : '#03A680',
                            }}
                          />
                        </div>
                        {/* Mini legend */}
                        <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                          {stats.inProgress > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                              {stats.inProgress} đang làm
                            </span>
                          )}
                          {stats.done > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                              {stats.done} hoàn thành
                            </span>
                          )}
                          {(stats.total - stats.done - stats.inProgress) > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                              {stats.total - stats.done - stats.inProgress} chờ
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
