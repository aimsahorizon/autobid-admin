import { getReportById } from '@/lib/supabase/reports'
import { notFound } from 'next/navigation'
import ReportDetailClient from './ReportDetailClient'

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const report = await getReportById(id)

  if (!report) {
    notFound()
  }

  return <ReportDetailClient report={report} />
}
