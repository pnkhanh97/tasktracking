import { NextRequest, NextResponse } from 'next/server'
import { getTaskById } from '@/lib/tasks'
import { getProjectById } from '@/lib/projects'
import { getSession } from '@/lib/session'
import { uploadFileToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await getTaskById(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const project = await getProjectById(task.projectId)
  const isAssignee = task.assignees.includes(session.userId)
  const isManager = project?.manager === session.userId
  const canUpload = isAssignee || isManager || session.role === 'admin' || session.role === 'manager'
  if (!canUpload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await uploadFileToCloudinary(
      task.projectId, taskId, file.name, buffer, file.type || 'application/octet-stream'
    )
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Upload lỗi: ${msg}` }, { status: 500 })
  }
}
