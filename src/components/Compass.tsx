import { useEffect, useState } from 'react'
import { CLASSES } from '../data/classes'
import type { ClassFit } from '../engine/fit'

const R = 130
const N = CLASSES.length
const STEP = 360 / N
const VB = { x: -235, y: -196, w: 470, h: 390 }

const rad = (i: number) => ((-90 + i * STEP) * Math.PI) / 180
const pt = (i: number, r: number): [number, number] => [Math.cos(rad(i)) * r, Math.sin(rad(i)) * r]
const ring = (r: number) => CLASSES.map((_, i) => pt(i, r).join(',')).join(' ')

interface Props {
  /** In CLASSES order. Omit for the idle instrument on the intro screen. */
  fits?: ClassFit[]
}

export function Compass({ fits }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    let b = 0
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setRevealed(true))))
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [])

  const top = fits ? fits.reduce((best, f, i) => (f.fit > fits[best].fit ? i : best), 0) : -1
  // One full turn plus the bearing, so the needle visibly settles onto its class.
  const bearing = top >= 0 ? 360 + top * STEP : 300
  const shape = fits?.map((f, i) => pt(i, (R * Math.max(f.pct, 4)) / 100).join(',')).join(' ')
  const tip = fits ? fits[active ?? top] : null

  return (
    <div className={`compass ${revealed ? 'is-revealed' : ''} ${fits ? 'compass--result' : 'compass--idle'}`}>
      <svg
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        role="img"
        aria-label={
          fits
            ? `Compass of enjoyment likelihood. Highest: ${[...fits].sort((a, b) => b.pct - a.pct).slice(0, 3).map((f) => `${f.cls.name} ${f.pct}%`).join(', ')}.`
            : 'Class compass with the nine classes around its rim.'
        }
      >
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <polygon key={k} points={ring(R * k)} className={k === 1 ? 'compass__rim' : 'compass__ring'} />
        ))}
        {CLASSES.map((c, i) => {
          const [x, y] = pt(i, R)
          return <line key={c.id} x1={0} y1={0} x2={x} y2={y} className={`compass__spoke ${active === i ? 'is-active' : ''}`} />
        })}
        {/* Scale ticks sit between the first two spokes, clear of any data point. */}
        {[25, 50, 75].map((k) => {
          const [x, y] = pt(0.5, (R * k) / 100)
          return (
            <text key={k} x={x} y={y + 3} textAnchor="middle" className="compass__tick">
              {k}
            </text>
          )
        })}

        {shape && (
          <g className="compass__shape">
            <polygon points={shape} className="compass__area" />
            {fits!.map((f, i) => {
              const [x, y] = pt(i, (R * Math.max(f.pct, 4)) / 100)
              return <circle key={f.cls.id} cx={x} cy={y} r={i === top ? 6 : 4.5} className="compass__dot" style={{ fill: `var(--class-${f.cls.id})` }} />
            })}
          </g>
        )}

        <g className="compass__needle" style={{ transform: `rotate(${revealed ? bearing : 0}deg)` }}>
          <path d={`M0,${R * 0.22} L-5,0 L0,${-R * 0.94} L5,0 Z`} className="compass__needle-body" />
          <path d={`M0,0 L5,0 L0,${-R * 0.94} Z`} className="compass__needle-facet" />
        </g>
        <circle r={7} className="compass__hub" />
        <circle r={2.5} className="compass__hub-pin" />

        {CLASSES.map((c, i) => {
          const [lx, ly] = pt(i, R + 20)
          const cos = Math.cos(rad(i))
          const sin = Math.sin(rad(i))
          const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
          const nameDy = sin < -0.5 ? -16 : sin > 0.5 ? 6 : -2
          const f = fits?.[i]
          return (
            <g
              key={c.id}
              className={`compass__label ${i === top ? 'is-top' : ''} ${active === i ? 'is-active' : ''}`}
              tabIndex={fits ? 0 : -1}
              role={fits ? 'button' : undefined}
              aria-label={f ? `${c.name}: ${f.pct}% likely to enjoy. Best spec ${f.spec.name}.` : undefined}
              onPointerEnter={() => fits && setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => fits && setActive(i)}
              onBlur={() => setActive(null)}
            >
              <circle cx={pt(i, R)[0]} cy={pt(i, R)[1]} r={24} className="compass__hit" />
              {!fits && <circle cx={pt(i, R)[0]} cy={pt(i, R)[1]} r={4} style={{ fill: `var(--class-${c.id})` }} className="compass__rimdot" />}
              <text x={lx} y={ly + nameDy} textAnchor={anchor} className="compass__name">
                {c.name}
              </text>
              {f && (
                <text x={lx} y={ly + nameDy + 17} textAnchor={anchor} className="compass__pct">
                  {f.pct}%
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {tip && active != null && (
        <div
          className="compass__tip"
          style={{
            left: `${((pt(active, R)[0] - VB.x) / VB.w) * 100}%`,
            top: `${((pt(active, R)[1] - VB.y) / VB.h) * 100}%`,
          }}
          role="status"
        >
          <span className="compass__tip-key" style={{ background: `var(--class-${tip.cls.id})` }} />
          <strong>{tip.cls.name}</strong>
          <span className="mono">{tip.pct}%</span>
          <span className="compass__tip-spec">
            {tip.spec.name} · {tip.spec.roles.join(' / ')}
          </span>
        </div>
      )}
    </div>
  )
}
