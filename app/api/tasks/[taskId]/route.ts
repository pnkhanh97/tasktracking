import { NextRequest, NextResponse } from 'next/server'
import { getTaskById, submitTaskResult, updateTaskStatus } from '@/lib/tasks'
import { getProjectById } from '@/lib/projects'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await getTaskById(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const body = await req.json()

  // Assignee nộp kết quả
  if (body.action === 'submit') {
    const isAssignee = task.assignees.includes(session.userId)
    if (!isAssignee && session.role === 'member')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!body.result?.trim() && (!body.files || body.files.length === 0))
      return NextResponse.json({ error: 'Result required' }, { status: 400 })
    await submitTaskResult(task, body.result?.trim() ?? '', body.files ?? [], session.name)
    return NextResponse.json({ ok: true })
  }

  // Đổi trạng thái task
  if (body.action === 'status') {
    const project = await getProjectById(task.projectId)
    const isManager = project?.manager === session.userId
    const isAssignee = task.assignees.includes(session.userId)
    const isAdminOrManager = session.role === 'admin' || session.role === 'manager' || isManager

    // Assignee chỉ được "Nhận task" (→ Đang thực hiện)
    if (!isAdminOrManager && isAssignee && body.status !== 'Đang thực hiện')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // Member không phải assignee và không phải manager thì bị chặn
    if (!isAdminOrManager && !isAssignee)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await updateTaskStatus(task, body.status)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
