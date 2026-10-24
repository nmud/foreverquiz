import { useMemo, useState } from 'react'
import { DIM_META, SIGNATURE, friction, reason } from '../data/dims'
import { BIG_FIVE_LABEL } from '../data/questions'
import { fitClasses, ranked, type ClassFit } from '../engine/fit'
import { FANTASY_LABEL } from '../engine/profile'
import { encodeProfile } from '../engine/share'
import { BIG_FIVE, type GameId, type Profile } from '../engine/types'
import { Compass } from './Compass'

const GAME_LABEL: Record<GameId, string> = {
  interrupt: 'Kick the cast',
  triage: 'Keep them standing',
  overcharge: 'Overcharge',
  rotation: 'Learn the rotation',
  kite: 'Kite the elite',
  runes: 'Align the runes',
}

export function Results({ profile, shared, onRestart }: { profile: Profile; shared: boolean; onRestart: () => void }) {
  const fits = useMemo(() => fitClasses(profile), [profile])
  const order = useMemo(() => ranked(fits), [fits])
  const best = order[0]
  const runnerUp = order[1]
  const margin = best.pct - runnerUp.pct
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = `${location.origin}${location.pathname}#r=${encodeProfile(profile)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy your result link', url)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="results">
      {shared && (
        <p className="results__shared">
          You are looking at someone’s shared result.{' '}
          <button type="button" className="linkish" onClick={onRestart}>
            Take the quiz yourself
          </button>
        </p>
      )}

      <section className="verdict" style={{ ['--hero' as string]: `var(--class-${best.cls.id})` }}>
        <div className="verdict__copy reveal" style={{ ['--i' as string]: 0 }}>
          <p className="label">Your compass points to</p>
          <h1 className="verdict__name">{best.cls.name}</h1>
          <p className="verdict__spec">
            <span className="verdict__key" />
            {best.spec.name} <span className="muted">· {best.spec.roles.join(' / ')}</span>
          </p>
          <div className="verdict__score">
            <span className="verdict__pct">{best.pct}%</span>
            <span className="verdict__pct-label">
              estimated likelihood you enjoy maining it
              <span className="muted"> · {margin >= 8 ? 'clear lead' : margin >= 3 ? 'narrow lead' : 'near tie'} over {runnerUp.cls.name}</span>
            </span>
          </div>
          <p className="verdict__blurb">{best.cls.blurb}</p>
          <Reasons fit={best} profile={profile} />
        </div>
        <figure className="verdict__compass reveal" style={{ ['--i' as string]: 1 }}>
          <Compass fits={fits} />
          <figcaption className="caption">Each spoke is a class. The further the shape reaches, the more likely you are to enjoy it. Hover or focus a class for its best spec.</figcaption>
        </figure>
      </section>

      <section className="panel reveal" style={{ ['--i' as string]: 2 }} aria-labelledby="all-classes">
        <h2 id="all-classes" className="section-title">All nine classes</h2>
        <ol className="ranklist">
          {order.map((f, i) => (
            <RankRow key={f.cls.id} fit={f} rank={i + 1} profile={profile} />
          ))}
        </ol>
      </section>

      <section className="signature reveal" style={{ ['--i' as string]: 3 }}>
        <div className="panel">
          <h2 className="section-title">Playstyle signature</h2>
          <p className="section-sub">Self-report and test behaviour combined. The centre line is neutral.</p>
          <ul className="diverge">
            {SIGNATURE.map((d) => (
              <li key={d}>
                <span className="diverge__pole">{DIM_META[d].poles[0]}</span>
                <span className="diverge__track" title={`${Math.round(profile.dims[d] * 100)}`}>
                  <span
                    className={`diverge__fill ${profile.dims[d] < 0 ? 'is-left' : 'is-right'}`}
                    style={{ ['--w' as string]: Math.abs(profile.dims[d]).toFixed(3) }}
                  />
                </span>
                <span className="diverge__pole diverge__pole--right">{DIM_META[d].poles[1]}</span>
              </li>
            ))}
          </ul>
          {profile.fantasy.length > 0 && (
            <p className="fantasy-line">
              <span className="label">Drawn to</span> {profile.fantasy.map((f) => FANTASY_LABEL[f]).join(' · ')}
            </p>
          )}
        </div>

        <div className="signature__side">
          {profile.big5 && (
            <div className="panel">
              <h2 className="section-title">Big Five</h2>
              <p className="section-sub">Percentile against published TIPI norms. The tick marks the median person.</p>
              <ul className="bars">
                {BIG_FIVE.map((t) => (
                  <li key={t}>
                    <span className="bars__label">{BIG_FIVE_LABEL[t]}</span>
                    <span className="bars__track">
                      <span className="bars__fill" style={{ ['--w' as string]: (profile.big5![t] / 100).toFixed(3) }} />
                      <span className="bars__median" />
                    </span>
                    <span className="bars__value mono">{ordinal(profile.big5![t])}</span>
                  </li>
                ))}
              </ul>
              {profile.consistency && profile.consistency !== 'high' && (
                <p className="note">
                  {profile.consistency === 'low'
                    ? 'Your paired answers disagreed a lot, so personality was counted at half weight.'
                    : 'Some paired answers disagreed; personality is a little less certain.'}
                </p>
              )}
            </div>
          )}
          <div className="panel">
            <h2 className="section-title">Test readout</h2>
            <dl className="stats">
              <Stat label="Interrupt reaction" value={profile.stats.rt != null ? `${profile.stats.rt} ms` : '—'} sub={profile.stats.hit != null ? `${Math.round(profile.stats.hit * 100)}% of casts kicked` : undefined} />
              <Stat label="Shielded casts kicked" value={profile.stats.fa != null ? `${Math.round(profile.stats.fa * 100)}%` : '—'} sub="lower is more disciplined" />
              <Stat label="Party kept alive" value={profile.stats.survivors ? `${profile.stats.survivors[0]} of ${profile.stats.survivors[1]}` : '—'} />
              <Stat label="Charges before release" value={profile.stats.pumps != null ? profile.stats.pumps.toFixed(1) : '—'} sub={profile.stats.bursts != null ? `${profile.stats.bursts} fizzled of 5` : undefined} />
              <Stat label="Rotation span" value={profile.stats.span != null ? `${profile.stats.span}` : '—'} sub="typical adult span: 5 to 7" />
              <Stat label="Time in range" value={profile.stats.kite != null ? `${Math.round(profile.stats.kite * 100)}%` : '—'} />
              <Stat label="Rune puzzles solved" value={profile.stats.runes ? `${profile.stats.runes[0]} of ${profile.stats.runes[1]}` : '—'} />
            </dl>
            <EnjoyLine enjoy={profile.enjoy} />
          </div>
        </div>
      </section>

      <section className="panel method reveal" style={{ ['--i' as string]: 4 }} aria-labelledby="method">
        <h2 id="method" className="section-title">How the compass is calculated</h2>
        <div className="method__grid">
          <div>
            <h3>Personality</h3>
            <p>Ten-Item Personality Inventory (Gosling, Rentfrow and Swann, 2003), converted to percentiles with its published norms. Each trait is asked twice, once reversed, so contradictory answers are caught and down-weighted. Trait links to play behaviour follow work on WoW players such as Yee et al. (2011).</p>
          </div>
          <div>
            <h3>Behaviour</h3>
            <p>Six short tasks adapted from lab paradigms: Go/No-Go for response inhibition, the Balloon Analogue Risk Task (Lejuez et al., 2002) for risk, sequence span for working memory, Tower of London (Shallice, 1982) for planning, plus a triage task and a pursuit task. Everyone gets the same sequences, so results are comparable.</p>
          </div>
          <div>
            <h3>Enjoyment</h3>
            <p>After each test you rated how much fun it was. Research on games and self-determination theory (Ryan, Rigby and Przybylski, 2006) ties enjoyment to feeling competent, so both your performance and your rating count. Your rating counts more.</p>
          </div>
          <div>
            <h3>Scoring</h3>
            <p>About 75 pieces of evidence feed 25 traits, each shrunk toward neutral when evidence is thin. Each class is a weighted profile of what it asks of a player. Class scales are normed on 20,000 simulated random respondents, so no class wins by default. Fit becomes a likelihood through a logistic curve.</p>
          </div>
        </div>
        <p className="note">This is an informed estimate, not a verdict. Forever is in beta and class kits may change at launch. Ten personality items trade precision for speed.</p>
      </section>

      <div className="actions reveal" style={{ ['--i' as string]: 5 }}>
        <button type="button" className="btn btn--primary" onClick={share}>
          {copied ? 'Link copied' : 'Copy share link'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRestart}>
          {shared ? 'Take the quiz' : 'Retake the quiz'}
        </button>
      </div>
    </div>
  )
}

function Reasons({ fit, profile }: { fit: ClassFit; profile: Profile }) {
  return (
    <div className="reasons">
      <ul>
        {fit.pulls.map(([d]) => (
          <li key={d}>{reason(d, profile.dims[d])}.</li>
        ))}
      </ul>
      {fit.friction && (
        <p className="reasons__friction">
          <span className="label">Friction</span> {friction(fit.cls.name, fit.friction[0], fit.cls.weights[fit.friction[0]] ?? 0, profile.dims[fit.friction[0]])}
        </p>
      )}
    </div>
  )
}

function RankRow({ fit, rank, profile }: { fit: ClassFit; rank: number; profile: Profile }) {
  return (
    <li className={`rank ${rank === 1 ? 'is-top' : ''}`}>
      <details>
        <summary>
          <span className="rank__n mono">{rank}</span>
          <span className="rank__key" style={{ background: `var(--class-${fit.cls.id})` }} />
          <span className="rank__name">{fit.cls.name}</span>
          <span className="rank__spec">
            {fit.spec.name} · {fit.spec.roles.join(' / ')}
          </span>
          <span className="rank__bar">
            <span style={{ ['--w' as string]: (fit.pct / 100).toFixed(3), background: `var(--class-${fit.cls.id})` }} />
          </span>
          <span className="rank__pct mono">{fit.pct}%</span>
        </summary>
        <div className="rank__detail">
          <p>{fit.cls.blurb}</p>
          <p className="muted">
            Resource: {fit.cls.resource} · Specs: {fit.cls.specs.map((s) => `${s.name} (${s.roles.join('/')})`).join(', ')} · Early beta tier lists: {fit.cls.betaTier}
          </p>
          <Reasons fit={fit} profile={profile} />
        </div>
      </details>
    </li>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className="mono">{value}</dd>
      {sub && <dd className="stat__sub">{sub}</dd>}
    </div>
  )
}

function EnjoyLine({ enjoy }: { enjoy: Profile['enjoy'] }) {
  const rated = (Object.entries(enjoy) as [GameId, number][]).sort((a, b) => b[1] - a[1])
  if (rated.length < 2) return null
  return (
    <p className="note">
      Most fun: <strong>{GAME_LABEL[rated[0][0]]}</strong>. Least: <strong>{GAME_LABEL[rated[rated.length - 1][0]]}</strong>.
    </p>
  )
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}
