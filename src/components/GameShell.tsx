import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export interface GameMeta {
  title: string
  goal: string
  controls: string[]
  measures: string
  render: (done: (result: object) => void) => ReactNode
}

const ENJOY: [string, number][] = [
  ['Not for me', -1],
  ['Meh', -0.5],
  ['It was fine', 0],
  ['Fun', 0.5],
  ['Loved it', 1],
]

type Phase = 'brief' | 'countdown' | 'play' | 'rate'

interface Props {
  meta: GameMeta
  onComplete: (result: object | undefined, enjoy: number | undefined) => void
}

export function GameShell({ meta, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [count, setCount] = useState(3)
  const result = useRef<object | undefined>(undefined)

  const start = useCallback(() => setPhase('countdown'), [])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (count === 0) {
      setPhase('play')
      return
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 480)
    return () => clearTimeout(t)
  }, [phase, count])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'brief' && e.key === 'Enter') {
        e.preventDefault()
        start()
      }
      if (phase === 'rate') {
        const n = Number(e.key)
        if (n >= 1 && n <= 5) rate(ENJOY[n - 1][1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Games end mid-input; ignore taps and keys for a moment so a stray press is not a rating.
  const readyAt = useRef(0)
  const rate = (v: number) => {
    if (performance.now() >= readyAt.current) onComplete(result.current, v)
  }

  const done = useCallback((r: object) => {
    result.current = r
    readyAt.current = performance.now() + 450
    setPhase('rate')
  }, [])

  if (phase === 'brief' || phase === 'countdown') {
    return (
      <section className="card brief" aria-labelledby="game-title">
        <h2 id="game-title" className="brief__title">
          {meta.title}
        </h2>
        <p className="brief__goal">{meta.goal}</p>
        <ul className="brief__controls">
          {meta.controls.map((c) => (
            <li key={c} className="mono">
              {c}
            </li>
          ))}
        </ul>
        <p className="brief__measures">
          <span className="label">Measures</span> {meta.measures}
        </p>
        <div className="card__foot">
          <button type="button" className="linkish" onClick={() => onComplete(undefined, undefined)}>
            Skip this test
          </button>
          {phase === 'brief' ? (
            <button type="button" className="btn btn--primary" onClick={start} autoFocus>
              Start
            </button>
          ) : (
            <span className="countdown mono" aria-live="assertive" key={count}>
              {count}
            </span>
          )}
        </div>
      </section>
    )
  }

  if (phase === 'play') {
    return (
      <section className="play" aria-label={meta.title}>
        {meta.render(done)}
      </section>
    )
  }

  return (
    <section className="card rate" aria-labelledby="rate-q">
      <p className="label">{meta.title} · done</p>
      <h2 id="rate-q" className="prompt">
        How much did you enjoy that?
      </h2>
      <p className="muted rate__why">Not how well you did. Whether you would want more of it.</p>
      <div className="rate__scale">
        {ENJOY.map(([label, v], k) => (
          <button key={label} type="button" className="rate__opt" onClick={() => rate(v)}>
            <span className="rate__bar" style={{ ['--k' as string]: k }} />
            <span>{label}</span>
            <span className="mono muted">{k + 1}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
