import { NextRequest, NextResponse } from 'next/server'
import { getProjectById, updateProjectStatus } from '@/lib/projects'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await getProjectById(projectId)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isManager = project.manager === session.userId
  const canManage = session.role === 'admin' || session.role === 'manager' || isManager
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (body.action === 'status' && body.status) {
    await updateProjectStatus(project, body.status)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
