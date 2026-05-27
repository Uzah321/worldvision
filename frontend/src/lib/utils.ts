import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(new Date(value))
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[], columns: { key: string; label: string }[]) {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = c.key.split('.').reduce((o: unknown, k) => (o != null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), row)
      return escape(val)
    }).join(',')
  )
  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
