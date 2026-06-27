import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByProject, addComment } from '@/lib/comments'
import { getProjectById } from '@/lib/projects'
import { getSession } from '@/lib/session'

async function canAccess(projectId: string, userId: string, role: string) {
  if (role === 'admin') return true
  const project = await getProjectById(projectId)
  if (!project) return false
  return project.manager === userId || project.members.includes(userId)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await canAccess(projectId, session.userId, session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const comments = await getCommentsByProject(projectId)
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await canAccess(projectId, session.userId, session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  await addComment({ projectId, authorId: session.userId, authorName: session.name, content: content.trim() })
  return NextResponse.json({ ok: true })
}
