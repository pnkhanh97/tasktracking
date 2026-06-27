'use server'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createProject } from '@/lib/projects'

export type ProjectFormState = { error?: string } | undefined

export async function createProjectAction(
  state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await getSession()
  if (!session) return { error: 'Chưa đăng nhập.' }
  if (session.role === 'member') return { error: 'Bạn không có quyền tạo project.' }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const startDate = formData.get('startDate') as string
  const deadline = formData.get('deadline') as string
  const priority = formData.get('priority') as string
  const manager = formData.get('manager') as string
  const members = formData.getAll('members') as string[]

  if (!name || !deadline || !manager) {
    return { error: 'Vui lòng điền đầy đủ: Tên project, Deadline, Manager.' }
  }

  try {
    const projectId = await createProject({
      name,
      description,
      startDate,
      deadline,
      priority,
      manager,
      members,
      createdBy: session.userId,
    })
    redirect(`/projects/${projectId}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `Lỗi tạo project: ${msg}` }
  }
}
