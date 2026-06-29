import { getTaskById } from '@/lib/tasks'
import { getProjectById } from '@/lib/projects'
import { getSheetData } from '@/lib/sheets'
import { getSession } from '@/lib/session'
import { notFound } from 'next/navigation'
import TaskDetail from './TaskDetail'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>
}) {
  const { projectId, taskId } = await params
  const [task, project, staffData, session] = await Promise.all([
    getTaskById(taskId),
    getProjectById(projectId),
    getSheetData('user'),
    getSession(),
  ])

  if (!task || !project) notFound()

  const h = staffData[0] ?? []
  const idIdx = h.indexOf('StaffID')
  const nameIdx = h.indexOf('Staff')
  const staffMap: Record<string, string> = {}
  staffData.slice(1).forEach(row => {
    if (row[idIdx]) staffMap[row[idIdx]] = row[nameIdx] ?? row[idIdx]
  })

  const isAssignee = task.assignees.includes(session?.userId ?? '')
  const canManage = session?.role === 'admin' || session?.role === 'manager' || project.manager === session?.userId

  return (
    <TaskDetail
      projectId={projectId}
      task={task}
      assigneeNames={task.assignees.map(a => staffMap[a] ?? a)}
      createdByName={staffMap[task.createdBy] ?? task.createdBy}
      isAssignee={isAssignee}
      canManage={canManage ?? false}
      currentUser={{ id: session?.userId ?? '', name: session?.name ?? '' }}
    />
  )
}
