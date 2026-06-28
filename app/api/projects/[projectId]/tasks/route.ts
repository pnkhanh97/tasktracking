import { NextRequest, NextResponse } from 'next/server'
import { getTasksByProject, createTask } from '@/lib/tasks'
import { getProjectById } from '@/lib/projects'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await getTasksByProject(projectId)
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const project = await getProjectById(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, assignees, priority, deadline, docLink } = body
  if (!title || !assignees || assignees.length === 0)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const taskId = await createTask({
    projectId, title, description,
    assignees, priority, deadline,
    docLink: docLink ?? '',
    createdBy: session.userId,
  })
  return NextResponse.json({ taskId })
}
