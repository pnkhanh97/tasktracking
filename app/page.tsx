import { getSession } from '@/lib/session'

export default async function HomePage() {
  const session = await getSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {session?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Đây là dashboard quản lý công việc của bạn.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng task', value: 0, color: 'text-gray-900' },
          { label: 'Đang thực hiện', value: 0, color: 'text-blue-700' },
          { label: 'Hoàn thành', value: 0, color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        Chưa có task nào. Tính năng đang được phát triển.
      </div>
    </div>
  )
}
