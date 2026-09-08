import { read, utils, type WorkBook } from 'xlsx'
import type { DashboardRecord, Health, Member, PortfolioSlice } from './portfolio-data'

export type ImportedPortfolio = {
  members: Member[]
  teamSlices: PortfolioSlice[]
  importedAt: string
  sourceName: string
  counts: { members: number; dashboards: number; risks: number; sources: number }
}

type Row = Record<string, unknown>

function rows(workbook: WorkBook, name: string): Row[] {
  const sheet = workbook.Sheets[name]
  return sheet ? utils.sheet_to_json<Row>(sheet, { defval: '' }) : []
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function number(value: unknown) {
  const parsed = Number.parseFloat(text(value).replace('%', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function health(value: unknown): Health {
  const normalized = text(value).toLowerCase()
  if (normalized.includes('risk') || normalized.includes('critical')) return 'risk'
  if (normalized.includes('watch') || normalized.includes('issue') || normalized.includes('delay')) return 'watch'
  return 'healthy'
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '—'
}

function color(index: number) {
  return ['coral', 'blue', 'amber', 'sage', 'ink', 'violet'][index % 6]
}

function ownerName(memberId: string, memberById: Map<string, Member>) {
  return memberById.get(memberId)?.name || memberId || 'Unassigned'
}

function makeRecords(dashboards: Row[], memberById: Map<string, Member>): DashboardRecord[] {
  return dashboards.map((row, index) => {
    const ownerId = text(row['Owner Member ID'])
    const owner = ownerName(ownerId, memberById)
    const status = text(row.Health || row.Status || row['Documentation Status'])
    return {
      id: text(row['Dashboard ID']) || `dashboard-${index + 1}`,
      name: text(row['Dashboard Name']) || `Dashboard ${index + 1}`,
      owner,
      ownerInitials: initials(owner),
      nextRefresh: [text(row['Next Refresh Date']), text(row['Refresh Time'])].filter(Boolean).join(' · ') || 'Not scheduled',
      timing: text(row['Next Refresh Date']) || 'Not scheduled',
      health: health(status),
      backup: text(row['Backup Owner ID']) || 'Not assigned',
      source: text(row['Primary Source ID']) || 'Not mapped',
      note: text(row.Notes) || 'No notes provided.',
    }
  })
}

export async function parsePortfolioWorkbook(file: File): Promise<ImportedPortfolio> {
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { cellDates: false })
  const memberRows = rows(workbook, 'Team Members')
  const dashboardRows = rows(workbook, 'Dashboards')
  const refreshRows = rows(workbook, 'Refreshes')
  const riskRows = rows(workbook, 'Risks')
  const sourceRows = rows(workbook, 'Sources')
  const coverageRows = rows(workbook, 'Backup Coverage')
  const documentationRows = rows(workbook, 'Documentation')
  const workloadRows = rows(workbook, 'Workload')

  if (!memberRows.length && !dashboardRows.length) {
    throw new Error('The workbook needs Team Members and Dashboards tabs with at least one data row.')
  }

  const members: Member[] = memberRows.map((row, index) => {
    const name = text(row.Name) || `Member ${index + 1}`
    return {
      id: text(row['Member ID']) || `member-${index + 1}`,
      name,
      initials: initials(name),
      color: color(index),
      dashboards: number(row['Dashboards Owned']),
      critical: number(row['Critical Dashboards']),
      upcoming: number(row['Upcoming Refreshes']),
      issues: number(row['Open Issues']),
      sources: number(row['Connected Sources']),
      backup: number(row['Backup Coverage %']),
      documentation: number(row['Documentation %']),
      effort: `${number(row['Weekly Effort Hours'])} hrs`,
    }
  })

  const memberById = new Map(members.map((member) => [member.id, member]))
  const records = makeRecords(dashboardRows, memberById)
  const total = dashboardRows.length
  const critical = dashboardRows.filter((row) => text(row['Critical?']).toLowerCase() === 'yes').length
  const upcoming = refreshRows.filter((row) => text(row.Status).toLowerCase() !== 'completed').length
  const riskCount = riskRows.filter((row) => text(row.Status).toLowerCase() === 'open').length
  const covered = coverageRows.filter((row) => text(row['Coverage Status']).toLowerCase() === 'covered').length
  const documented = documentationRows.filter((row) => text(row['Documentation Status']).toLowerCase() === 'current').length
  const effort = workloadRows.reduce((sum, row) => sum + number(row['Estimated Hours']), 0)
  const sourceCount = sourceRows.length
  const ratio = (value: number, base: number) => base ? Math.round((value / base) * 100) : 0

  const teamSlices: PortfolioSlice[] = [
    { id: 'ownership', label: 'Ownership', shortLabel: 'Ownership', value: total, displayValue: String(total), subline: 'dashboards', health: 'healthy', children: [], records },
    { id: 'refreshes', label: 'Upcoming refreshes', shortLabel: 'Refreshes', value: upcoming, displayValue: String(upcoming), subline: 'open refresh records', health: upcoming > 5 ? 'watch' : 'healthy', badge: `${refreshRows.length} logged`, children: [], records },
    { id: 'critical', label: 'Critical dashboards', shortLabel: 'Critical', value: critical, displayValue: String(critical), subline: 'business-critical', health: critical > 0 ? 'risk' : 'healthy', children: [], records: records.filter((record) => record.health !== 'healthy') },
    { id: 'risks', label: 'Issues / risks', shortLabel: 'Risks', value: riskCount, displayValue: String(riskCount), subline: 'open risks', health: riskCount > 0 ? 'risk' : 'healthy', badge: `${riskRows.length} logged`, children: [], records: records.filter((record) => record.health === 'risk' || record.health === 'watch') },
    { id: 'sources', label: 'Data sources', shortLabel: 'Sources', value: sourceCount, displayValue: String(sourceCount), subline: 'connected sources', health: 'watch', children: [], records },
    { id: 'coverage', label: 'Backup coverage', shortLabel: 'Coverage', value: ratio(covered, total), displayValue: `${ratio(covered, total)}%`, subline: 'of dashboards covered', health: ratio(covered, total) < 80 ? 'risk' : 'healthy', children: [], records },
    { id: 'documentation', label: 'Documentation', shortLabel: 'Docs', value: ratio(documented, total), displayValue: `${ratio(documented, total)}%`, subline: 'up to date', health: ratio(documented, total) < 80 ? 'risk' : 'healthy', children: [], records },
    { id: 'workload', label: 'Weekly effort', shortLabel: 'Effort', value: effort, displayValue: `${effort}h`, subline: 'estimated workload', health: effort > 40 ? 'watch' : 'healthy', children: [], records },
  ]

  return { members, teamSlices, importedAt: new Date().toLocaleString(), sourceName: file.name, counts: { members: members.length, dashboards: total, risks: riskRows.length, sources: sourceCount } }
}
