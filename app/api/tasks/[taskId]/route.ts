import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { submitTaskResult, updateTaskStatus } from '@/lib/tasks'
import { getProjectById } from '@/lib/projects'
import { getSession } from '@/lib/session'

async function findTask(taskId: string) {
  const data = await getSheetData('Tasks')
  if (data.length < 2) return null
  const h = data[0]
  const i = data.slice(1).findIndex(r => r[h.indexOf('TaskID')] === taskId)
  if (i < 0) return null
  const row = data[i + 1]
  return {
    rowNumber: i + 2,
    taskId: row[h.indexOf('TaskID')] ?? '',
    projectId: row[h.indexOf('ProjectID')] ?? '',
    title: row[h.indexOf('Title')] ?? '',
    description: row[h.indexOf('Description')] ?? '',
    assignedTo: row[h.indexOf('AssignedTo')] ?? '',
    priority: row[h.indexOf('Priority')] ?? '',
    status: row[h.indexOf('Status')] ?? '',
    deadline: row[h.indexOf('Deadline')] ?? '',
    result: row[h.indexOf('Result')] ?? '',
    submittedAt: row[h.indexOf('SubmittedAt')] ?? '',
    createdBy: row[h.indexOf('CreatedBy')] ?? '',
    createdAt: row[h.indexOf('CreatedAt')] ?? '',
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await findTask(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const body = await req.json()

  // Assignee submits result
  if (body.action === 'submit') {
    if (session.userId !== task.assignedTo && session.role === 'member')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!body.result?.trim()) return NextResponse.json({ error: 'Result required' }, { status: 400 })
    await submitTaskResult(task, body.result.trim())
    return NextResponse.json({ ok: true })
  }

  // Admin/Manager approves or changes status
  if (body.action === 'status') {
    const project = await getProjectById(task.projectId)
    const isManager = project?.manager === session.userId
    if (session.role === 'member' && !isManager)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await updateTaskStatus(task, body.status)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
