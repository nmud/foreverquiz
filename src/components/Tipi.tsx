import { useEffect, useRef, useState } from 'react'
import { TIPI, TIPI_SCALE } from '../data/questions'

interface Props {
  values: (number | null)[]
  onChange: (values: (number | null)[]) => void
  onDone: () => void
}

export function Tipi({ values, onChange, onDone }: Props) {
  const [i, setI] = useState(() => Math.max(0, values.findIndex((v) => v == null)))
  const advancing = useRef<number | null>(null)

  const choose = (score: number) => {
    if (advancing.current) return
    const nextVals = values.slice()
    nextVals[i] = score
    onChange(nextVals)
    // A short beat so the choice registers before the next item replaces it.
    advancing.current = window.setTimeout(() => {
      advancing.current = null
      if (i + 1 < TIPI.length) setI(i + 1)
      else onDone()
    }, 200)
  }

  useEffect(() => () => {
    if (advancing.current) clearTimeout(advancing.current)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 7) choose(n)
      if (e.key === 'Backspace' && i > 0) setI(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="card tipi" aria-labelledby="tipi-q">
      <div className="card__head">
        <p className="label">I see myself as…</p>
        <span className="mono muted">
          {i + 1} / {TIPI.length}
        </span>
      </div>
      <h2 id="tipi-q" className="prompt" key={i}>
        {TIPI[i].text}
      </h2>
      <div className="likert" role="radiogroup" aria-labelledby="tipi-q">
        {TIPI_SCALE.map((label, k) => {
          const score = k + 1
          const on = values[i] === score
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={on}
              className={`likert__opt ${on ? 'is-on' : ''}`}
              onClick={() => choose(score)}
            >
              <span className="likert__dot" style={{ ['--k' as string]: Math.abs(k - 3) }} />
              <span className="likert__label">{label}</span>
              <span className="likert__key mono">{score}</span>
            </button>
          )
        })}
      </div>
      <div className="card__foot">
        <button type="button" className="linkish" onClick={() => setI(i - 1)} disabled={i === 0}>
          Back
        </button>
        <span className="muted hint">Go with your first instinct. Keys 1 to 7 work too.</span>
      </div>
    </section>
  )
}
