export type Health = 'healthy' | 'watch' | 'risk'

export type DashboardRecord = {
  id: string
  name: string
  owner: string
  ownerInitials: string
  nextRefresh: string
  timing: string
  health: Health
  backup: string
  source: string
  note: string
}

export type PortfolioSlice = {
  id: string
  label: string
  shortLabel: string
  value: number
  displayValue: string
  subline: string
  health: Health
  badge?: string
  children: { id: string; label: string; value: number; subline: string }[]
  records: DashboardRecord[]
}

export type Member = {
  id: string
  name: string
  initials: string
  color: string
  dashboards: number
  critical: number
  upcoming: number
  issues: number
  sources: number
  backup: number
  documentation: number
  effort: string
}

const records = (owner: string, names: [string, string, Health, string][]): DashboardRecord[] =>
  names.map(([name, timing, health, note], index) => ({
    id: `${owner.toLowerCase().replaceAll(' ', '-')}-${index}`,
    name,
    owner,
    ownerInitials: owner.split(' ').map((part) => part[0]).join(''),
    nextRefresh: timing,
    timing,
    health,
    backup: index % 3 === 0 ? 'Rahul Mehta' : 'Covered',
    source: index % 2 === 0 ? 'Snowflake' : 'SharePoint',
    note,
  }))

const teamRecords = records('Maya Shah', [
  ['Revenue Dashboard', 'Today · 06:00', 'risk', 'Source file delayed twice this month.'],
  ['Pipeline Tracker', 'Today · 07:00', 'watch', 'Manual refresh is due before the leadership call.'],
  ['Customer Insights', 'Tomorrow · 07:00', 'healthy', 'Automated refresh with healthy lineage.'],
  ['Executive Pack', 'Fri · 06:00', 'risk', 'No documented fallback for one source.'],
  ['Region Performance', 'Mon · 06:30', 'healthy', 'Owner and backup both confirmed.'],
  ['Quarterly Summary', 'Mon · 08:00', 'healthy', 'Scheduled refresh; notes are current.'],
])

export const MEMBERS: Member[] = [
  { id: 'maya', name: 'Maya Shah', initials: 'MS', color: 'coral', dashboards: 9, critical: 3, upcoming: 6, issues: 1, sources: 7, backup: 89, documentation: 91, effort: '10.5 hrs' },
  { id: 'rahul', name: 'Rahul Mehta', initials: 'RM', color: 'blue', dashboards: 8, critical: 2, upcoming: 3, issues: 0, sources: 6, backup: 96, documentation: 88, effort: '7.0 hrs' },
  { id: 'aman', name: 'Aman Kapoor', initials: 'AK', color: 'amber', dashboards: 7, critical: 2, upcoming: 5, issues: 2, sources: 5, backup: 78, documentation: 83, effort: '12.5 hrs' },
  { id: 'priya', name: 'Priya Nair', initials: 'PN', color: 'sage', dashboards: 10, critical: 1, upcoming: 4, issues: 0, sources: 8, backup: 94, documentation: 96, effort: '8.0 hrs' },
  { id: 'nikhil', name: 'Nikhil Rao', initials: 'NR', color: 'ink', dashboards: 8, critical: 1, upcoming: 2, issues: 1, sources: 6, backup: 85, documentation: 86, effort: '6.5 hrs' },
  { id: 'sara', name: 'Sara Klein', initials: 'SK', color: 'violet', dashboards: 10, critical: 2, upcoming: 4, issues: 3, sources: 7, backup: 71, documentation: 79, effort: '11.0 hrs' },
]

const teamChildren = (slice: string) => {
  const map: Record<string, { id: string; label: string; value: number; subline: string }[]> = {
    refreshes: [
      { id: 'today', label: 'Today', value: 3, subline: 'due before 09:00' },
      { id: 'tomorrow', label: 'Tomorrow', value: 2, subline: 'scheduled' },
      { id: 'week', label: 'This week', value: 9, subline: 'across 5 owners' },
      { id: 'overdue', label: 'Overdue', value: 2, subline: 'need attention' },
    ],
    risks: [
      { id: 'critical', label: 'Critical', value: 3, subline: 'business-critical' },
      { id: 'source', label: 'Source delays', value: 2, subline: 'late twice this month' },
      { id: 'coverage', label: 'No backup', value: 2, subline: 'single points of failure' },
    ],
    workload: [
      { id: 'maya', label: 'Maya Shah', value: 9, subline: 'dashboards owned' },
      { id: 'priya', label: 'Priya Nair', value: 10, subline: 'dashboards owned' },
      { id: 'rahul', label: 'Rahul Mehta', value: 8, subline: 'dashboards owned' },
    ],
  }
  return map[slice] ?? []
}

export const TEAM_SLICES: PortfolioSlice[] = [
  { id: 'ownership', label: 'Ownership', shortLabel: 'Ownership', value: 52, displayValue: '52', subline: 'dashboards', health: 'healthy', children: teamChildren('ownership'), records: teamRecords },
  { id: 'refreshes', label: 'Upcoming refreshes', shortLabel: 'Refreshes', value: 14, displayValue: '14', subline: 'next 7 days', health: 'watch', badge: '3 due today', children: teamChildren('refreshes'), records: teamRecords },
  { id: 'critical', label: 'Critical dashboards', shortLabel: 'Critical', value: 7, displayValue: '7', subline: 'business-critical', health: 'risk', badge: '2 unbacked', children: [], records: teamRecords.filter((_, i) => i % 2 === 0) },
  { id: 'risks', label: 'Issues / risks', shortLabel: 'Risks', value: 7, displayValue: '7', subline: 'need attention', health: 'risk', badge: '2 overdue', children: teamChildren('risks'), records: teamRecords.filter((record) => record.health === 'risk' || record.health === 'watch') },
  { id: 'sources', label: 'Data sources', shortLabel: 'Sources', value: 18, displayValue: '18', subline: 'connected sources', health: 'watch', badge: '3 high impact', children: [], records: teamRecords },
  { id: 'coverage', label: 'Backup coverage', shortLabel: 'Coverage', value: 86, displayValue: '86%', subline: 'of dashboards covered', health: 'watch', children: [], records: teamRecords },
  { id: 'documentation', label: 'Documentation', shortLabel: 'Docs', value: 88, displayValue: '88%', subline: 'up to date', health: 'healthy', children: [], records: teamRecords },
  { id: 'workload', label: 'Weekly effort', shortLabel: 'Effort', value: 48, displayValue: '48h', subline: 'estimated team effort', health: 'watch', children: teamChildren('workload'), records: teamRecords },
]

export function memberSlices(member: Member): PortfolioSlice[] {
  const base = [
    ['dashboards', 'Dashboards', member.dashboards, `${member.dashboards} owned`, 'healthy'],
    ['refreshes', 'Upcoming refreshes', member.upcoming, `${member.upcoming} this week`, 'watch'],
    ['critical', 'Critical', member.critical, `${member.critical} need focus`, 'risk'],
    ['issues', 'Issues', member.issues, `${member.issues} open issue${member.issues === 1 ? '' : 's'}`, member.issues > 1 ? 'risk' : 'healthy'],
    ['sources', 'Sources', member.sources, `${member.sources} connected`, 'watch'],
    ['backup', 'Backup coverage', member.backup, `${member.backup}% covered`, member.backup < 80 ? 'risk' : 'healthy'],
    ['documentation', 'Documentation', member.documentation, `${member.documentation}% current`, 'healthy'],
    ['effort', 'Weekly effort', Number.parseFloat(member.effort), member.effort, 'watch'],
  ] as const
  return base.map(([id, label, value, subline, health]) => ({
    id, label, shortLabel: label, value, displayValue: id === 'backup' || id === 'documentation' ? `${value}%` : id === 'effort' ? `${value}h` : String(value), subline, health,
    children: id === 'refreshes' ? teamChildren('refreshes') : [], records: teamRecords.map((record) => ({ ...record, owner: member.name, ownerInitials: member.initials })),
  }))
}

export function getSlice(id: string, member?: Member) {
  return (member ? memberSlices(member) : TEAM_SLICES).find((slice) => slice.id === id)
}
