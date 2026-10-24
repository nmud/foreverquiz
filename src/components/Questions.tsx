import { useEffect, useRef, useState } from 'react'
import type { Question } from '../data/questions'

interface Props {
  questions: Question[]
  choices: Record<string, string[]>
  onChange: (id: string, picked: string[]) => void
  onDone: () => void
}

export function Questions({ questions, choices, onChange, onDone }: Props) {
  const [i, setI] = useState(0)
  const q = questions[i]
  const picked = choices[q.id] ?? []
  const timer = useRef<number | null>(null)

  const advance = () => {
    if (i + 1 < questions.length) setI(i + 1)
    else onDone()
  }

  const choose = (id: string) => {
    if (q.pick) {
      const has = picked.includes(id)
      onChange(q.id, has ? picked.filter((x) => x !== id) : [...picked, id].slice(-q.pick))
      return
    }
    if (timer.current) return
    onChange(q.id, [id])
    timer.current = window.setTimeout(() => {
      timer.current = null
      advance()
    }, 220)
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1].id)
      if (e.key === 'Enter' && q.pick && picked.length) advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className={`card questions ${q.pick ? 'questions--grid' : ''}`} aria-labelledby="q-prompt">
      <div className="card__head">
        <p className="label">{q.pick ? `Pick up to ${q.pick}` : 'Pick one'}</p>
        <span className="mono muted">
          {i + 1} / {questions.length}
        </span>
      </div>
      <h2 id="q-prompt" className="prompt" key={q.id}>
        {q.prompt}
      </h2>
      <div className="options" role={q.pick ? 'group' : 'radiogroup'} aria-labelledby="q-prompt" key={`${q.id}-opts`}>
        {q.options.map((o, k) => {
          const on = picked.includes(o.id)
          return (
            <button
              key={o.id}
              type="button"
              role={q.pick ? 'checkbox' : 'radio'}
              aria-checked={on}
              className={`option ${on ? 'is-on' : ''}`}
              style={{ ['--k' as string]: k }}
              onClick={() => choose(o.id)}
            >
              <span className="option__key mono">{k + 1}</span>
              <span className="option__text">
                <span className="option__label">{o.label}</span>
                {o.detail && <span className="option__detail">{o.detail}</span>}
              </span>
            </button>
          )
        })}
      </div>
      <div className="card__foot">
        <button type="button" className="linkish" onClick={() => setI(i - 1)} disabled={i === 0}>
          Back
        </button>
        {q.pick ? (
          <button type="button" className="btn btn--primary" onClick={advance} disabled={!picked.length}>
            Continue
          </button>
        ) : (
          <span className="muted hint">Keys 1 to {q.options.length} work too.</span>
        )}
      </div>
    </section>
  )
}
