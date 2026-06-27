import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET() {
  const data = await getSheetData('user')
  if (data.length < 2) return NextResponse.json({ staff: [] })

  const h = data[0]
  const idIdx = h.indexOf('StaffID')
  const nameIdx = h.indexOf('Staff')

  const staff = data.slice(1)
    .filter(row => row[idIdx])
    .map(row => ({
      staffId: row[idIdx],
      name: row[nameIdx] ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

  return NextResponse.json({ staff })
}
