'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { MEMBERS, TEAM_SLICES, getSlice, memberSlices, type Member, type PortfolioSlice } from '@/lib/portfolio-data'
import { parsePortfolioWorkbook, type ImportedPortfolio } from '@/lib/portfolio-import'

type Lens = 'team' | 'member'

type Point = { x: number; y: number }

const cx = 240
const cy = 240
const radius = 174
const gap = 0.018

function polar(angle: number, r: number): Point {
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
}

function wedgePath(start: number, end: number, inner: number, outer: number) {
  const a = polar(start, outer)
  const b = polar(end, outer)
  const c = polar(end, inner)
  const d = polar(start, inner)
  const large = end - start > Math.PI ? 1 : 0
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`
}

function healthClass(health: PortfolioSlice['health']) {
  return `wheel-slice-${health}`
}

function summarize(lens: Lens, member?: Member, selected?: PortfolioSlice, child?: { label: string; value: number; subline: string }, imported?: ImportedPortfolio | null) {
  if (child) return { eyebrow: selected?.label ?? 'Selected view', title: `${child.value} ${child.label}`, subline: child.subline }
  if (selected) return { eyebrow: lens === 'member' ? member?.name ?? 'Team member' : 'Team portfolio', title: selected.displayValue, subline: selected.subline }
  if (member) return { eyebrow: 'Team member', title: member.name, subline: `${member.dashboards} dashboards · ${member.upcoming} upcoming this week` }
  return { eyebrow: 'Team dashboard portfolio', title: `${imported?.counts.dashboards ?? 52} dashboards`, subline: `${imported?.counts.members ?? 6} team members · ${imported ? 'imported workbook' : 'last synced today'}` }
}

export function PortfolioWorkspace() {
  const [lens, setLens] = useState<Lens>('team')
  const [memberId, setMemberId] = useState(MEMBERS[0].id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [childId, setChildId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [imported, setImported] = useState<ImportedPortfolio | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeMembers = imported?.members.length ? imported.members : MEMBERS
  const teamSlices = imported?.teamSlices ?? TEAM_SLICES
  const member = lens === 'member' ? activeMembers.find((item) => item.id === memberId) : undefined
  const slices = useMemo(() => member ? memberSlices(member) : teamSlices, [member, teamSlices])
  const selected = selectedId ? getSlice(selectedId, member) : undefined
  const child = selected?.children.find((item) => item.id === childId)
  const summary = summarize(lens, member, selected, child, imported)
  const isNested = Boolean(selected && selected.children.length > 0 && childId)

  function changeLens(nextLens: Lens) {
    setLens(nextLens)
    setSelectedId(null)
    setChildId(null)
  }

  async function handleWorkbook(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportError(null)
    try {
      const next = await parsePortfolioWorkbook(file)
      setImported(next)
      setLens('team')
      setMemberId(next.members[0]?.id ?? '')
      setSelectedId(null)
      setChildId(null)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read this workbook.')
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  function chooseSlice(slice: PortfolioSlice) {
    setSelectedId(slice.id)
    setChildId(null)
  }

  function goBack() {
    if (childId) setChildId(null)
    else setSelectedId(null)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && (selectedId || childId)) goBack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [childId, selectedId])

  return (
    <main className="portfolio-shell">
      <header className="portfolio-header">
        <div>
          <p className="eyebrow">Portfolio cockpit <span className="live-dot" /> Live</p>
          <h1>Dashboard estate</h1>
        </div>
        <div className="header-actions">
          <div className="data-actions">
            <a className="template-link" href="/portfolio-input-template.xlsx" download>
              Download input workbook
            </a>
            <button className="upload-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? 'Reading workbook…' : imported ? 'Replace workbook' : 'Upload completed workbook'}
            </button>
            <input ref={fileInputRef} className="sr-only" type="file" accept=".xlsx,.xls" onChange={handleWorkbook} aria-label="Upload portfolio workbook" />
          </div>
          <div className="lens-controls" aria-label="Portfolio lens controls">
            <label>
            <span>View</span>
            <select value={lens} onChange={(event) => changeLens(event.target.value as Lens)}>
              <option value="team">Team Portfolio</option>
              <option value="member">Team Member</option>
            </select>
          </label>
          {lens === 'member' && (
            <label>
              <span>Member</span>
              <select value={memberId} onChange={(event) => { setMemberId(event.target.value); setSelectedId(null); setChildId(null) }}>
                {MEMBERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          </div>
        </div>
      </header>
      <div className="import-status" aria-live="polite">
        {imported ? <span><b>Workbook connected:</b> {imported.sourceName} · {imported.counts.dashboards} dashboards · imported {imported.importedAt}</span> : <span>Using illustrative portfolio data. Upload the completed workbook to replace it with your data.</span>}
        {importError && <span className="import-error">{importError}</span>}
      </div>

      <div className="workspace-grid">
        <section className="wheel-stage" aria-label="Interactive portfolio wheel">
          <div className="stage-meta">
            <span>{isNested ? 'Investigate' : selected ? 'Explore' : 'Observe'}</span>
            <span>{isNested ? 'Click a dashboard to inspect' : 'Click a wedge to reveal the next layer'}</span>
          </div>
          <div className="wheel-wrap">
            <svg className="portfolio-wheel" viewBox="0 0 480 480" role="img" aria-label={`${summary.title}, ${summary.subline}`}>
              <circle className="wheel-orbit" cx={cx} cy={cy} r="212" />
              <circle className="wheel-orbit faint" cx={cx} cy={cy} r="190" />
              {slices.map((slice, index) => {
                const start = -Math.PI / 2 + (index / slices.length) * Math.PI * 2 + gap
                const end = -Math.PI / 2 + ((index + 1) / slices.length) * Math.PI * 2 - gap
                const active = selectedId === slice.id
                const quiet = selectedId && !active
                const mid = (start + end) / 2
                const pull = active ? 14 : hoveredId === slice.id ? 7 : 0
                const offset = polar(mid, pull)
                return (
                  <g key={slice.id} className={`wheel-group ${active ? 'is-active' : ''} ${quiet ? 'is-quiet' : ''}`} transform={`translate(${offset.x - cx} ${offset.y - cy})`}>
                    <path className={`wheel-slice ${healthClass(slice.health)}`} d={wedgePath(start, end, 88, radius)} />
                    <path className="wheel-slice-outline" d={wedgePath(start, end, 88, radius)} />
                    <foreignObject x={polar(mid, 125).x - 45} y={polar(mid, 125).y - 25} width="90" height="52" className="slice-label-box">
                      <button className="slice-button" onClick={() => chooseSlice(slice)} onMouseEnter={() => setHoveredId(slice.id)} onMouseLeave={() => setHoveredId(null)} aria-label={`Explore ${slice.label}: ${slice.displayValue} ${slice.subline}`}>
                        <strong>{slice.displayValue}</strong><span>{slice.shortLabel}</span>{slice.badge && <small>{slice.badge}</small>}
                      </button>
                    </foreignObject>
                  </g>
                )
              })}
              {selected && selected.children.length > 0 && !childId && (
                <g className="nested-orbit">
                  {selected.children.map((item, index) => {
                    const start = -Math.PI / 2 + (index / selected.children.length) * Math.PI * 2 + 0.03
                    const end = -Math.PI / 2 + ((index + 1) / selected.children.length) * Math.PI * 2 - 0.03
                    const mid = (start + end) / 2
                    return <g key={item.id}><path className="nested-slice" d={wedgePath(start, end, 182, 210)} /><foreignObject x={polar(mid, 196).x - 38} y={polar(mid, 196).y - 20} width="76" height="40"><button className="nested-button" onClick={() => setChildId(item.id)} aria-label={`Open ${item.label}, ${item.value}`}><strong>{item.value}</strong><span>{item.label}</span></button></foreignObject></g>
                  })}
                </g>
              )}
              <circle className="wheel-center" cx={cx} cy={cy} r="84" />
              <foreignObject x="160" y="165" width="160" height="150">
                <div className="wheel-center-copy"><span>{summary.eyebrow}</span><strong>{summary.title}</strong><small>{summary.subline}</small>{selected && <button onClick={goBack} className="back-button">← {childId ? 'Back to breakdown' : 'Back to overview'}</button>}</div>
              </foreignObject>
            </svg>
          </div>
          {lens === 'member' && <nav className="member-rail" aria-label="Compare team members">{MEMBERS.map((item) => <button key={item.id} className={item.id === memberId ? 'selected' : ''} onClick={() => { setMemberId(item.id); setSelectedId(null); setChildId(null) }} title={`Switch to ${item.name}`}><span className={`member-avatar avatar-${item.color}`}>{item.initials}</span><span>{item.name.split(' ')[0]}</span></button>)}</nav>}
        </section>

        <aside className={`detail-panel ${selected ? 'is-open' : ''}`} aria-live="polite">
          {!selected ? <div className="panel-empty"><span className="panel-index">01</span><p className="eyebrow">Contextual detail</p><h2>Choose a question<br />from the wheel.</h2><p>Hover to see the signal. Click any wedge to keep the portfolio in view while the detail panel fills with the evidence behind it.</p><div className="legend"><span><i className="legend-dot healthy" />Healthy</span><span><i className="legend-dot watch" />Watch</span><span><i className="legend-dot risk" />Risk</span></div></div> : <DetailPanel slice={selected} child={child} onChildSelect={setChildId} />}
        </aside>
      </div>
      <footer className="portfolio-footer"><span>Data freshness <b>{imported ? imported.importedAt : 'Today · 08:42'}</b></span><span>Coverage <b>{imported?.counts.dashboards ?? 52} / {imported?.counts.dashboards ?? 52} dashboards</b></span><span>Use ← to move back through the wheel</span></footer>
    </main>
  )
}

function DetailPanel({ slice, child, onChildSelect }: { slice: PortfolioSlice; child?: { label: string; value: number; subline: string }; onChildSelect: (id: string) => void }) {
  const visible = child ? slice.records.filter((_, index) => index % 2 === 0) : slice.records
  return <div className="panel-content"><div className="panel-topline"><span className={`status-pill ${slice.health}`}>{slice.health === 'risk' ? 'Needs attention' : slice.health === 'watch' ? 'Worth a look' : 'On track'}</span><span>{slice.label}</span></div><h2>{child ? child.label : slice.label}</h2><div className="panel-stat"><strong>{child ? child.value : slice.displayValue}</strong><span>{child ? child.subline : slice.subline}</span></div>{slice.children.length > 0 && !child && <div className="breakdown-list"><p className="section-label">Break down by</p>{slice.children.map((item) => <button key={item.id} onClick={() => onChildSelect(item.id)}><span><b>{item.label}</b><small>{item.subline}</small></span><strong>{item.value}</strong><span className="arrow">↗</span></button>)}</div>}<div className="records"><div className="records-header"><p className="section-label">{child ? 'Dashboards in this view' : 'What is behind this signal'}</p><span>{visible.length} records</span></div>{visible.map((record) => <article className="record" key={record.id}><div className={`record-health ${record.health}`} /><div className="record-main"><h3>{record.name}</h3><p>{record.note}</p><div className="record-meta"><span>{record.owner}</span><span>{record.nextRefresh}</span><span>{record.source}</span></div></div><div className="record-side"><span>{record.health}</span><small>Backup<br />{record.backup}</small></div></article>)}</div></div>
}
