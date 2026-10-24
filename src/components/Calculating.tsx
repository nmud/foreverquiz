import { useEffect, useRef, useState } from 'react'

const LINES = [
  'Scoring personality against published norms',
  'Reading six behavioural tests',
  'Weighing 25 traits against nine class profiles',
]

export function Calculating({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setN(1), 650),
      window.setTimeout(() => setN(2), 1300),
      window.setTimeout(() => done.current(), 2100),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])
  return (
    <section className="calc" aria-live="polite">
      <svg viewBox="-50 -50 100 100" className="calc__dial" aria-hidden="true">
        <circle r="44" className="calc__ring" />
        <g className="calc__needle">
          <path d="M0,8 L-3,0 L0,-40 L3,0 Z" />
        </g>
        <circle r="4" className="calc__hub" />
      </svg>
      <ul className="calc__lines">
        {LINES.map((l, i) => (
          <li key={l} className={i < n ? 'is-done' : i === n ? 'is-now' : ''}>
            {l}
          </li>
        ))}
      </ul>
    </section>
  )
}
