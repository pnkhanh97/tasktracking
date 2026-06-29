import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByTask, addTaskComment } from '@/lib/taskComments'
import { getTaskById } from '@/lib/tasks'
import { getProjectById } from '@/lib/projects'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const comments = await getCommentsByTask(taskId)
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await getTaskById(taskId)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const project = await getProjectById(task.projectId)
  const isMember = task.assignees.includes(session.userId)
    || project?.manager === session.userId
    || session.role === 'admin'
    || session.role === 'manager'
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty' }, { status: 400 })

  await addTaskComment({ taskId, authorId: session.userId, authorName: session.name, content: content.trim() })
  return NextResponse.json({ ok: true })
}
