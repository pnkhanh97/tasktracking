'use server'
import { redirect } from 'next/navigation'
import { findUserByEmail } from '@/lib/users'
import { createSession, deleteSession } from '@/lib/session'

export type LoginState = { error?: string } | undefined

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' }
  }

  const user = await findUserByEmail(email)

  if (!user || user.password !== password) {
    return { error: 'Email hoặc mật khẩu không đúng.' }
  }

  await createSession({
    userId: user.staffId,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
