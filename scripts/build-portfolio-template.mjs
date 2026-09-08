import { writeFileSync } from 'node:fs'
import { utils, write } from 'xlsx'

const workbook = utils.book_new()

const addSheet = (name, rows, widths = []) => {
  const sheet = utils.aoa_to_sheet(rows)
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  if (widths.length) sheet['!cols'] = widths.map((wch) => ({ wch }))
  utils.book_append_sheet(workbook, sheet, name)
}

addSheet('Read Me', [
  ['Portfolio Input Workbook'],
  ['Purpose', 'Fill the input tabs with your real dashboard estate data. The Answer Summary tab calculates the headline answers used by the portfolio cockpit.'],
  ['How to use', 'Start with Team Members and Dashboards. Then add refreshes, risks, sources, backup coverage, documentation, and workload records.'],
  ['Required values', 'Use one row per item. Keep IDs unique and use the exact Yes/No, Healthy/Watch/Risk, Open/Closed, and Covered/Not covered values shown in the tabs.'],
  ['Date format', 'Use YYYY-MM-DD. Enter times as HH:MM where relevant.'],
  ['Important', 'The workbook is intentionally formula-driven. Replace the sample rows with your real entries; do not overwrite the formulas in Answer Summary.'],
  ['Tabs', 'Team Members · Dashboards · Refreshes · Risks · Sources · Backup Coverage · Documentation · Workload · Answer Summary'],
], [22, 110])

addSheet('Team Members', [
  ['Member ID', 'Name', 'Active?', 'Dashboards Owned', 'Critical Dashboards', 'Upcoming Refreshes', 'Open Issues', 'Connected Sources', 'Backup Coverage %', 'Documentation %', 'Weekly Effort Hours'],
  ['M001', 'Example Owner', 'Yes', '', '', '', '', '', '', '', ''],
], [14, 24, 12, 18, 18, 20, 14, 18, 18, 16, 20])

addSheet('Dashboards', [
  ['Dashboard ID', 'Dashboard Name', 'Owner Member ID', 'Business Area', 'Critical?', 'Health', 'Next Refresh Date', 'Refresh Time', 'Backup Owner ID', 'Primary Source ID', 'Documentation Status', 'Notes'],
  ['D001', 'Example Dashboard', 'M001', 'Example area', 'Yes', 'Healthy', '2026-08-07', '06:00', 'M001', 'S001', 'Current', 'Replace this example row'],
], [16, 28, 18, 20, 12, 12, 18, 14, 18, 18, 20, 34])

addSheet('Refreshes', [
  ['Refresh ID', 'Dashboard ID', 'Due Date', 'Due Time', 'Status', 'Refresh Type', 'Owner Member ID', 'Actual Refresh Date', 'Notes'],
  ['R001', 'D001', '2026-08-07', '06:00', 'Scheduled', 'Automated', 'M001', '', 'Replace this example row'],
], [14, 16, 16, 14, 16, 18, 18, 20, 34])

addSheet('Risks', [
  ['Risk ID', 'Dashboard ID', 'Risk Type', 'Severity', 'Status', 'Owner Member ID', 'Due Date', 'Mitigation', 'Notes'],
  ['K001', 'D001', 'Source delay', 'Watch', 'Open', 'M001', '2026-08-08', 'Confirm source SLA', 'Replace this example row'],
], [14, 16, 22, 14, 14, 18, 16, 34, 34])

addSheet('Sources', [
  ['Source ID', 'Source Name', 'System', 'Owner Member ID', 'Criticality', 'Last Updated', 'Reliability', 'Notes'],
  ['S001', 'Example source', 'Example system', 'M001', 'High', '2026-08-06', 'Healthy', 'Replace this example row'],
], [14, 24, 20, 18, 14, 18, 16, 34])

addSheet('Backup Coverage', [
  ['Dashboard ID', 'Primary Owner ID', 'Backup Owner ID', 'Coverage Status', 'Last Tested', 'Notes'],
  ['D001', 'M001', 'M001', 'Covered', '2026-08-01', 'Replace this example row'],
], [16, 18, 18, 18, 18, 34])

addSheet('Documentation', [
  ['Dashboard ID', 'Owner Member ID', 'Documentation Status', 'Last Reviewed', 'Runbook Link', 'Notes'],
  ['D001', 'M001', 'Current', '2026-08-01', 'https://example.com', 'Replace this example row'],
], [16, 18, 22, 18, 40, 34])

addSheet('Workload', [
  ['Workload ID', 'Member ID', 'Week Start', 'Dashboard ID', 'Task Type', 'Estimated Hours', 'Actual Hours', 'Status', 'Notes'],
  ['W001', 'M001', '2026-08-03', 'D001', 'Refresh', 2, '', 'Planned', 'Replace this example row'],
], [16, 16, 16, 16, 22, 18, 16, 16, 34])

addSheet('Answer Summary', [
  ['Portfolio Answer Summary', 'Value', 'Definition'],
  ['Total dashboards', '=COUNTA(Dashboards!A2:A1000)', 'Count of dashboard rows'],
  ['Active team members', '=COUNTIF(\'Team Members\'!C2:C1000,"Yes")', 'Members marked Active? = Yes'],
  ['Critical dashboards', '=COUNTIF(Dashboards!E2:E1000,"Yes")', 'Dashboards marked Critical? = Yes'],
  ['Upcoming refreshes next 7 days', '=COUNTIFS(Refreshes!C2:C1000,">="&TODAY(),Refreshes!C2:C1000,"<="&TODAY()+7,Refreshes!E2:E1000,"<>Completed")', 'Due from today through the next 7 days and not Completed'],
  ['Open risks', '=COUNTIF(Risks!E2:E1000,"Open")', 'Risks marked Open'],
  ['Critical risks', '=COUNTIFS(Risks!D2:D1000,"Critical",Risks!E2:E1000,"Open")', 'Open risks marked Critical'],
  ['Dashboards with backup', '=COUNTIF(\'Backup Coverage\'!D2:D1000,"Covered")', 'Coverage rows marked Covered'],
  ['Backup coverage %', '=IFERROR(B8/B2,0)', 'Dashboards with backup divided by total dashboards'],
  ['Documented dashboards', '=COUNTIF(Documentation!C2:C1000,"Current")', 'Documentation rows marked Current'],
  ['Documentation %', '=IFERROR(B10/B2,0)', 'Current documentation divided by total dashboards'],
  ['Connected sources', '=COUNTA(Sources!A2:A1000)', 'Count of source rows'],
  ['Estimated weekly effort hours', '=SUM(Workload!F2:F1000)', 'Sum of Estimated Hours'],
  ['Actual weekly effort hours', '=SUM(Workload!G2:G1000)', 'Sum of Actual Hours'],
  [],
  ['Allowed values', 'Use these exact values to keep formulas working'],
  ['Health', 'Healthy | Watch | Risk'],
  ['Yes/No', 'Yes | No'],
  ['Risk status', 'Open | Closed | Accepted'],
  ['Coverage status', 'Covered | Not covered'],
  ['Documentation status', 'Current | Needs update | Missing'],
], [34, 22, 90])

const summary = workbook.Sheets['Answer Summary']
for (const cell of ['B9', 'B11']) summary[cell].z = '0%'

writeFileSync('/vercel/share/v0-project/public/portfolio-input-template.xlsx', write(workbook, { bookType: 'xlsx', type: 'buffer' }))
