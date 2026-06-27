import { google } from 'googleapis'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

export type User = {
  staffId: string
  name: string
  email: string
  role: string
  password: string
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.TASK_SPREADSHEET_ID!,
    range: 'Users',
  })

  const rows = res.data.values as string[][]
  if (!rows || rows.length < 2) return null

  const headers = rows[0]
  const emailIdx = headers.indexOf('Email')
  const staffIdIdx = headers.indexOf('StaffID')
  const nameIdx = headers.indexOf('Staff')
  const roleIdx = headers.indexOf('Role')
  const passwordIdx = headers.indexOf('Password')

  const row = rows.slice(1).find(r =>
    r[emailIdx]?.trim().toLowerCase() === email.trim().toLowerCase()
  )
  if (!row) return null

  return {
    staffId: row[staffIdIdx] ?? '',
    name: row[nameIdx] ?? '',
    email: row[emailIdx] ?? '',
    role: row[roleIdx]?.toLowerCase() ?? 'member',
    password: row[passwordIdx] ?? '',
  }
}
