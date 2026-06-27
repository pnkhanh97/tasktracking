import { getSession } from '@/lib/session'
import { getProjects } from '@/lib/projects'

export default async function HomePage() {
  const session = await getSession()
  let allProjects: Awaited<ReturnType<typeof getProjects>> = []
  let loadError = ''
  try {
    allProjects = await getProjects()
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
  }

  const myProjects = session?.role === 'member'
    ? allProjects.filter(p =>
        p.members.includes(session.userId) || p.manager === session.userId
      )
    : allProjects

  const inProgress = myProjects.filter(p => p.status === 'Đang thực hiện').length
  const done = myProjects.filter(p => p.status === 'Hoàn thành').length

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Lỗi tải dữ liệu: {loadError}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {session?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan công việc của bạn hôm nay.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng project', value: myProjects.length, color: 'text-gray-900' },
          { label: 'Đang thực hiện', value: inProgress, color: 'text-blue-700' },
          { label: 'Hoàn thành', value: done, color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Projects gần đây</h2>
          <a href="/projects" className="text-sm text-[#03A680] hover:underline">Xem tất cả</a>
        </div>
        {myProjects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có project nào.</p>
        ) : (
          <div className="space-y-2">
            {myProjects.slice(0, 5).map(p => (
              <a key={p.projectId} href={`/projects/${p.projectId}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <span className="text-xs text-gray-400 font-mono mr-2">{p.projectId}</span>
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Deadline: {p.deadline}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.status}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
