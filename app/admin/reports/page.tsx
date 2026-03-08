import { getAllReports, getReportsByStatus, getPendingReportsCount } from '@/lib/supabase/reports'
import ReportsClient from './ReportsClient'

async function getReportStats() {
  const [
    pendingCount,
    reviewingReports,
    resolvedReports,
    dismissedReports,
  ] = await Promise.all([
    getPendingReportsCount(),
    getReportsByStatus('reviewing'),
    getReportsByStatus('resolved'),
    getReportsByStatus('dismissed'),
  ])

  return {
    pending: pendingCount,
    reviewing: reviewingReports.length,
    resolved: resolvedReports.length,
    dismissed: dismissedReports.length,
  }
}

export default async function ReportsPage() {
  const [reports, stats] = await Promise.all([
    getAllReports(),
    getReportStats(),
  ])

  return <ReportsClient initialReports={reports} stats={stats} />
}
