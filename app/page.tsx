'use client'

import { useState } from 'react'
import { realAds } from '@/lib/realAds'

type Ad = {
  brand: string
  copy: string
  cta: string
  image: string | null
  video: string | null
  hasVideo?: boolean
}

type AdBrief = {
  hook: string
  visual: string
  cta: string
}

type GapConcept = {
  territory: string
  hook: string
  visual: string
  cta: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clean(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*(?!\s)/g, '')
    .replace(/^#+\s*/gm, '')
    .trim()
}

function parseAdBriefs(raw: string): AdBrief[] {
  const blocks = raw
    .split(/\n(?=(?:\d+\.\s*)?Hook:|Brief\s*\d+:)/i)
    .filter(Boolean)

  return blocks
    .map((block) => {
      const hook   = block.match(/(?:\d+\.\s*)?Hook:\s*(.+)/i)?.[1]?.trim() || ''
      const visual = block.match(/Visual:\s*([\s\S]*?)(?=CTA:|(?:\d+\.\s*)?Hook:|Brief\s*\d+:|$)/i)?.[1]?.trim() || ''
      const cta    = block.match(/CTA:\s*(.+)/i)?.[1]?.trim() || ''
      return { hook: clean(hook), visual: clean(visual), cta: clean(cta) }
    })
    .filter((b) => b.hook || b.visual || b.cta)
}

// ─── Export to PDF ───────────────────────────────────────────────────────────

function exportToPDF(
  competitorName: 'Ella+Ross',
  comparisonBrand: 'Everyroom Furniture',
  sections: { title: string; items: string[] }[],
  concepts: GapConcept[],
  briefs: AdBrief[],
) {
  const date = new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const sectionHTML = sections
    .filter((s) => s.items.length > 0)
    .map(
      (s) => `
      <div class="section">
        <h3>${s.title}</h3>
        <ul>
          ${s.items.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('')

  const conceptsHTML = concepts
    .map(
      (c, i) => `
      <div class="concept">
        <div class="concept-header">
          <span class="concept-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="concept-territory">${c.territory}</span>
        </div>
        <div class="concept-row">
          <span class="concept-label hook-label">Hook</span>
          <span>${c.hook}</span>
        </div>
        <div class="concept-row">
          <span class="concept-label visual-label">Visual</span>
          <span>${c.visual}</span>
        </div>
        <div class="concept-row">
          <span class="concept-label cta-label">CTA</span>
          <span class="cta-pill">${c.cta}</span>
        </div>
      </div>`
    )
    .join('')

  const briefsHTML = briefs
    .map(
      (b, i) => `
      <div class="brief">
        <div class="brief-num">${String(i + 1).padStart(2, '00')}</div>
        <div class="brief-body">
          <div class="brief-hook">${b.hook}</div>
          ${b.visual ? `<div class="brief-visual">${b.visual}</div>` : ''}
          <div class="brief-cta">${b.cta}</div>
        </div>
      </div>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${competitorName} vs ${comparisonBrand} — Ad Intelligence Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px; color: #1a1a1a; background: #fff;
          padding: 48px; max-width: 900px; margin: 0 auto;
        }
        .report-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding-bottom: 24px; border-bottom: 2px solid #000; margin-bottom: 36px;
        }
        .report-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #000; }
        .report-brands { font-size: 13px; color: #666; margin-top: 4px; }
        .report-meta { text-align: right; font-size: 11px; color: #999; line-height: 1.8; }
        .brand-pill {
          display: inline-block; padding: 2px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600; margin-right: 6px;
        }
        .brand-a { background: #ede9fe; color: #5b21b6; }
        .brand-b { background: #cffafe; color: #0e7490; }
        .section-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 36px; }
        .section { border: 1px solid #e5e5e5; border-radius: 10px; padding: 16px; }
        .section h3 {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #888; margin-bottom: 12px;
        }
        .section ul { list-style: none; padding: 0; }
        .section ul li {
          font-size: 12px; color: #333; line-height: 1.6; padding: 6px 0;
          border-bottom: 1px solid #f0f0f0; display: flex; gap: 8px;
        }
        .section ul li:last-child { border-bottom: none; }
        .section ul li::before { content: '—'; color: #ccc; flex-shrink: 0; }
        .section:nth-child(1) { border-top: 3px solid #818cf8; }
        .section:nth-child(2) { border-top: 3px solid #a78bfa; }
        .section:nth-child(3) { border-top: 3px solid #22d3ee; }
        .section:nth-child(4) { border-top: 3px solid #34d399; }
        .section:nth-child(5) { border-top: 3px solid #fb923c; }
        .section:nth-child(6) { border-top: 3px solid #f472b6; }
        .divider { display: flex; align-items: center; gap: 12px; margin: 32px 0 24px; }
        .divider-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: #999; white-space: nowrap;
        }
        .divider-line { flex: 1; height: 1px; background: #e5e5e5; }
        .concepts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 36px; }
        .concept { border: 1px solid #fde68a; border-radius: 10px; padding: 16px; background: #fffbeb; }
        .concept-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
          padding-bottom: 10px; border-bottom: 1px solid #fde68a;
        }
        .concept-num { font-size: 10px; font-weight: 700; color: #92400e; }
        .concept-territory { font-size: 13px; font-weight: 700; color: #78350f; }
        .concept-row {
          display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px;
          font-size: 12px; color: #374151; line-height: 1.5;
        }
        .concept-label {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; white-space: nowrap; padding-top: 2px; min-width: 36px;
        }
        .hook-label   { color: #7c3aed; }
        .visual-label { color: #0891b2; }
        .cta-label    { color: #b45309; }
        .cta-pill {
          display: inline-block; background: #fef3c7; border: 1px solid #fde68a;
          border-radius: 20px; padding: 1px 10px; font-size: 11px; font-weight: 600; color: #92400e;
        }
        .briefs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .brief { display: flex; gap: 12px; border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px; }
        .brief-num { font-size: 10px; font-weight: 700; color: #ccc; padding-top: 2px; }
        .brief-body { flex: 1; }
        .brief-hook { font-size: 12px; font-weight: 600; color: #111; line-height: 1.5; margin-bottom: 6px; }
        .brief-visual { font-size: 11px; color: #666; line-height: 1.5; margin-bottom: 8px; }
        .brief-cta {
          display: inline-block; background: #f4f4f5; border-radius: 20px;
          padding: 2px 10px; font-size: 10px; font-weight: 600; color: #52525b;
        }
        .report-footer {
          margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e5e5;
          display: flex; justify-content: space-between; font-size: 10px; color: #bbb;
        }
        @media print {
          body { padding: 32px; }
          .section-grid { break-inside: avoid; }
          .concept { break-inside: avoid; }
          .brief { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <div class="report-title">Ad Intelligence Report</div>
          <div class="report-brands" style="margin-top: 8px;">
            <span class="brand-pill brand-a">${competitorName}</span>
            <span style="color: #ccc; font-size: 11px;">vs</span>
            <span class="brand-pill brand-b">${comparisonBrand}</span>
          </div>
        </div>
        <div class="report-meta">
          <div>Generated ${date}</div>
          <div>Meta Hook Intelligence</div>
          <div style="color: #ccc;">Internal use only</div>
        </div>
      </div>

      <div class="section-grid">${sectionHTML}</div>

      ${concepts.length > 0 ? `
        <div class="divider">
          <span class="divider-label">Gap-Driven Creative Concepts</span>
          <div class="divider-line"></div>
        </div>
        <div class="concepts-grid">${conceptsHTML}</div>
      ` : ''}

      ${briefs.length > 0 ? `
        <div class="divider">
          <span class="divider-label">Tactical Ad Briefs</span>
          <div class="divider-line"></div>
        </div>
        <div class="briefs-grid">${briefsHTML}</div>
      ` : ''}

      <div class="report-footer">
        <span>${competitorName} vs ${comparisonBrand}</span>
        <span>${date}</span>
      </div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

// ─── Insight card styles ─────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, { border: string; bg: string; dot: string; title: string; label: string }> = {
  default:    { border: 'border-zinc-800',       bg: 'bg-[#111111]',       dot: 'bg-zinc-500',    title: 'text-zinc-100',    label: 'text-zinc-500' },
  hooks:      { border: 'border-blue-900/60',    bg: 'bg-blue-950/20',     dot: 'bg-blue-400',    title: 'text-blue-300',    label: 'text-blue-500/70' },
  competitor: { border: 'border-violet-900/60',  bg: 'bg-violet-950/20',   dot: 'bg-violet-400',  title: 'text-violet-300',  label: 'text-violet-500/70' },
  comparison: { border: 'border-cyan-900/60',    bg: 'bg-cyan-950/20',     dot: 'bg-cyan-400',    title: 'text-cyan-300',    label: 'text-cyan-500/70' },
  whitespace: { border: 'border-emerald-900/60', bg: 'bg-emerald-950/20',  dot: 'bg-emerald-400', title: 'text-emerald-300', label: 'text-emerald-500/70' },
  cta:        { border: 'border-orange-900/60',  bg: 'bg-orange-950/20',   dot: 'bg-orange-400',  title: 'text-orange-300',  label: 'text-orange-500/70' },
  visual:     { border: 'border-pink-900/60',    bg: 'bg-pink-950/20',     dot: 'bg-pink-400',    title: 'text-pink-300',    label: 'text-pink-500/70' },
}

function InsightCard({
  title,
  items,
  variant = 'default',
  label,
}: {
  title: string
  items: string[]
  variant?: keyof typeof INSIGHT_STYLES
  label?: string
}) {
  const s = INSIGHT_STYLES[variant] || INSIGHT_STYLES.default
  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
        <div className={`text-sm font-semibold ${s.title}`}>{title}</div>
      </div>
      {label && (
        <div className={`mb-4 ml-3.5 text-[10px] uppercase tracking-[0.15em] ${s.label}`}>
          {label}
        </div>
      )}
      <div className="ml-3.5 mt-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="text-xs italic text-zinc-600">No data found</div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="flex gap-2.5 border-b border-zinc-800/60 pb-2.5 text-sm text-zinc-300 last:border-b-0 last:pb-0"
            >
              <span className="mt-0.5 shrink-0 text-[10px] text-zinc-600">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="leading-relaxed">{clean(item)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Ad card ─────────────────────────────────────────────────────────────────

function AdCard({ ad }: { ad: Ad }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111111] p-3 text-xs transition-colors hover:border-zinc-700">
      {(ad.video || ad.image) && (
        <div className="relative mb-3 overflow-hidden rounded-lg">
          {ad.video ? (
            <>
              {!playing && (
                <div className="relative cursor-pointer" onClick={() => setPlaying(true)}>
                  {ad.image ? (
                    <img src={ad.image} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 w-full bg-zinc-900" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
                      <svg className="h-4 w-4 translate-x-0.5 fill-black" viewBox="0 0 16 16">
                        <path d="M6 3.5L12.5 8 6 12.5V3.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    VIDEO
                  </div>
                </div>
              )}
              {playing && (
                <video
                  src={ad.video}
                  poster={ad.image ?? undefined}
                  controls autoPlay muted playsInline
                  className="h-36 w-full object-cover"
                />
              )}
            </>
          ) : ad.image ? (
            <>
              <img src={ad.image} className="h-36 w-full object-cover" />
              {ad.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white">
                    Video creative
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
      <div className="mb-1 font-semibold text-white">{ad.brand}</div>
      <div className="line-clamp-3 leading-relaxed text-zinc-500">{ad.copy}</div>
      {ad.cta && (
        <div className="mt-2.5 inline-flex rounded-full border border-zinc-700 px-2.5 py-0.5 text-[10px] text-zinc-400">
          {ad.cta}
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading]                       = useState(false)
  const [result, setResult]                         = useState('')
  const [competitorName, setCompetitorName]         = useState('Brother Canada')
  const [comparisonBrand, setComparisonBrand]       = useState('Canon')
  const [country, setCountry]                       = useState('ALL')
  const [adSource, setAdSource]                     = useState('')
  const [comparisonAdSource, setComparisonAdSource] = useState('')
  const [ads, setAds]                               = useState<Ad[]>(realAds)
  const [comparisonAds, setComparisonAds]           = useState<Ad[]>([])

  const getSection = (start: string, end?: string): string => {
    if (!result) return ''
    const regex = end
      ? new RegExp(`${start}:[\\s\\S]*?(?=${end}:|$)`, 'i')
      : new RegExp(`${start}:[\\s\\S]*`, 'i')
    const match = result.match(regex)?.[0] || ''
    return clean(match.replace(new RegExp(`${start}:`, 'i'), '').trim())
  }

  const getLines = (start: string, end?: string): string[] =>
    getSection(start, end)
      .split('\n')
      .map((l) => clean(l.replace(/^[\d\-.*]+\.?\s*/, '').trim()))
      .filter((l) => l.length > 0)

  const topHooks              = getLines('Top Hooks', 'Offer Patterns')
  const competitorStrengths   = getLines('Competitor Strengths', 'Comparison Brand Strengths')
  const comparisonStrengths   = getLines('Comparison Brand Strengths', 'Shared Weaknesses')
  const whiteSpaceOpps        = getLines('White Space Opportunities', 'CTA Comparison')
  const ctaComparison         = getLines('CTA Comparison', 'Visual Style Comparison')
  const visualStyleComparison = getLines('Visual Style Comparison', 'Gap-Driven Creative Concepts')

  const gapDrivenConceptsRaw = getSection('Gap-Driven Creative Concepts', 'Ad Brief Ideas')
  const gapDrivenConcepts: GapConcept[] = gapDrivenConceptsRaw
    .split(/\n(?=\d+\.\s*Territory:)/)
    .map((block) => ({
      territory: clean(block.match(/Territory:\s(.*)/)?.[1]?.trim() || ''),
      hook:      clean(block.match(/Hook:\s*(.*)/)?.[1]?.trim() || ''),
      visual:    clean(block.match(/Visual:\s*(.*)/)?.[1]?.trim() || ''),
      cta:       clean(block.match(/CTA:\s*(.*)/)?.[1]?.trim() || ''),
    }))
    .filter((c) => c.territory)

  const adBriefs = parseAdBriefs(getSection('Ad Brief Ideas'))

  const handleAnalyze = async () => {
    setLoading(true)

    const generatedAdLibraryUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(competitorName)}`
    const generatedComparisonUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(comparisonBrand)}`

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorName,
          comparisonBrand,
          adSource:          adSource          || generatedAdLibraryUrl,
          comparisonAdSource: comparisonAdSource || generatedComparisonUrl,
          ads,
        }),
      })
      const data = await response.json()
      setResult(data.result)
      if (data.scrapedAds)    setAds(data.scrapedAds)
      if (data.comparisonAds) setComparisonAds(data.comparisonAds)
    } catch (error) {
      console.error(error)
      setResult('Error analyzing ads.')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] text-zinc-200">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-[#0f0f0f] px-5 py-3">
        <span className="mr-2 whitespace-nowrap text-sm font-semibold tracking-wide text-white">
          Meta Hook Intelligence
        </span>

        <input
          value={competitorName}
          onChange={(e) => setCompetitorName(e.target.value)}
          placeholder="Competitor brand"
          className="w-48 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600"
        />

        <input
          value={comparisonBrand}
          onChange={(e) => setComparisonBrand(e.target.value)}
          placeholder="Comparison brand"
          className="w-48 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="ALL">All Countries</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="IN">India</option>
          <option value="AU">Australia</option>
        </select>

        {/* Optional URL overrides — collapsed by default */}
        <input
          value={adSource}
          onChange={(e) => setAdSource(e.target.value)}
          placeholder="Override primary URL (optional)"
          className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600"
        />
        <input
          value={comparisonAdSource}
          onChange={(e) => setComparisonAdSource(e.target.value)}
          placeholder="Override comparison URL (optional)"
          className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="whitespace-nowrap rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              Analyzing...
            </span>
          ) : (
            'Analyze'
          )}
        </button>

        {result && (
          <button
            onClick={() =>
              exportToPDF(
                competitorName,
                comparisonBrand,
                [
                  { title: 'Top Hooks',                    items: topHooks },
                  { title: `${competitorName} Strengths`,  items: competitorStrengths },
                  { title: `${comparisonBrand} Strengths`, items: comparisonStrengths },
                  { title: 'White Space',                  items: whiteSpaceOpps },
                  { title: 'CTA Comparison',               items: ctaComparison },
                  { title: 'Visual Style',                 items: visualStyleComparison },
                ],
                gapDrivenConcepts,
                adBriefs,
              )
            }
            className="whitespace-nowrap rounded-lg border border-zinc-700 bg-transparent px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Export PDF
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar — Competitor ads ── */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-zinc-800/60 bg-[#0d0d0d]">
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              {competitorName}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              {ads.length} ads
            </span>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {ads.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-zinc-600">
                No ads loaded
              </div>
            ) : (
              ads.map((ad, i) => <AdCard key={i} ad={ad} />)
            )}
          </div>
        </div>

        {/* ── Center panel — Insights ── */}
        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Ready to analyze</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Enter two brand names, pick a country, and hit Analyze
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 p-6">

              {/* Insight grid */}
              <div>
                <h2 className="mb-4 text-[10px] uppercase tracking-widest text-zinc-500">
                  Competitive Analysis
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <InsightCard title="Top Hooks"                       items={topHooks}              variant="hooks"      label="Most repeated across ads" />
                  <InsightCard title={`${competitorName} Strengths`}   items={competitorStrengths}   variant="competitor" label="What they clearly own" />
                  <InsightCard title={`${comparisonBrand} Strengths`}  items={comparisonStrengths}   variant="comparison" label="What they clearly own" />
                  <InsightCard title="White Space"                     items={whiteSpaceOpps}        variant="whitespace" label="Opportunities neither brand uses" />
                  <InsightCard title="CTA Comparison"                  items={ctaComparison}         variant="cta"        label="Call-to-action patterns" />
                  <InsightCard title="Visual Style"                    items={visualStyleComparison} variant="visual"     label="Creative format differences" />
                </div>
              </div>

              {/* Gap-driven concepts */}
              {gapDrivenConcepts.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    Gap-Driven Creative Concepts
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {gapDrivenConcepts.map((concept, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-[#0f0f0f] p-5"
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <span className="rounded-full border border-amber-900/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                            Territory
                          </span>
                          <span className="text-sm font-semibold text-amber-100">
                            {concept.territory}
                          </span>
                        </div>
                        <div className="space-y-3.5">
                          <div>
                            <div className="mb-1 text-[9px] uppercase tracking-[0.2em] text-fuchsia-500">Hook</div>
                            <div className="text-sm leading-relaxed text-zinc-300">{concept.hook}</div>
                          </div>
                          <div>
                            <div className="mb-1 text-[9px] uppercase tracking-[0.2em] text-cyan-500">Visual</div>
                            <div className="text-sm leading-relaxed text-zinc-400">{concept.visual}</div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-amber-500">CTA</div>
                            <div className="rounded-full border border-amber-900/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                              {concept.cta}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tactical briefs */}
              {adBriefs.length > 0 && (
                <div>
                  <h2 className="mb-4 text-[10px] uppercase tracking-widest text-zinc-500">
                    Tactical Ad Briefs
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {adBriefs.map((brief, i) => (
                      <div key={i} className="rounded-xl border border-zinc-800 bg-[#111111] p-4">
                        <div className="mb-1 text-[9px] uppercase tracking-widest text-zinc-600">Hook</div>
                        <div className="mb-3 text-sm font-medium leading-relaxed text-white">{brief.hook}</div>
                        {brief.visual && (
                          <>
                            <div className="mb-1 text-[9px] uppercase tracking-widest text-zinc-600">Visual</div>
                            <div className="mb-3 text-xs leading-relaxed text-zinc-400">{brief.visual}</div>
                          </>
                        )}
                        <div className="mb-1 text-[9px] uppercase tracking-widest text-zinc-600">CTA</div>
                        <div className="inline-flex rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300">
                          {brief.cta}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── Right sidebar — Comparison brand ads ── */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-zinc-800/60 bg-[#0d0d0d]">
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              {comparisonBrand}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              {comparisonAds.length} ads
            </span>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {comparisonAds.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-zinc-600">
                No ads loaded
              </div>
            ) : (
              comparisonAds.map((ad, i) => <AdCard key={i} ad={ad} />)
            )}
          </div>
        </div>

      </div>
    </main>
  )
}