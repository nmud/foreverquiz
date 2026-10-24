import { useEffect, useMemo, useRef, useState } from 'react'
import type { RunesResult } from '../engine/types'

type Pegs = number[][]
const CAPS = [3, 2, 1]
const RUNES = [
  { name: 'Fire', tone: 'var(--color-rune-fire)', shape: 'M12 4 L20 19 H4 Z' },
  { name: 'Life', tone: 'var(--color-rune-nature)', shape: 'M12 4 A8 8 0 1 1 11.99 4 Z' },
  { name: 'Arcane', tone: 'var(--color-rune-arcane)', shape: 'M12 3 L20 12 L12 21 L4 12 Z' },
]

/** Classic Tower of London problems. Par is computed, not hard-coded. */
const PROBLEMS: { start: Pegs; goal: Pegs; limit: number }[] = [
  { start: [[0, 1], [2], []], goal: [[1], [2, 0], []], limit: 22 },
  { start: [[0, 1], [2], []], goal: [[1, 2], [0], []], limit: 32 },
]

const key = (p: Pegs) => p.map((s) => s.join('')).join('|')

function moves(p: Pegs): Pegs[] {
  const out: Pegs[] = []
  for (let a = 0; a < 3; a++) {
    if (!p[a].length) continue
    for (let b = 0; b < 3; b++) {
      if (a === b || p[b].length >= CAPS[b]) continue
      const n = p.map((s) => s.slice())
      n[b].push(n[a].pop()!)
      out.push(n)
    }
  }
  return out
}

function par(start: Pegs, goal: Pegs) {
  const target = key(goal)
  const seen = new Map([[key(start), 0]])
  const queue = [start]
  while (queue.length) {
    const p = queue.shift()!
    const d = seen.get(key(p))!
    if (key(p) === target) return d
    for (const n of moves(p)) if (!seen.has(key(n))) (seen.set(key(n), d + 1), queue.push(n))
  }
  return Infinity
}

export function Runes({ onDone }: { onDone: (r: RunesResult) => void }) {
  const [idx, setIdx] = useState(0)
  const prob = PROBLEMS[idx]
  const parMoves = useMemo(() => par(prob.start, prob.goal), [prob])
  const [pegs, setPegs] = useState<Pegs>(prob.start)
  const [held, setHeld] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const left = Math.max(0, Math.ceil(prob.limit - elapsed))
  const [flash, setFlash] = useState<'solved' | 'timeout' | null>(null)
  const [shake, setShake] = useState<number | null>(null)
  const started = useRef(performance.now())
  const firstMove = useRef<number | null>(null)
  const log = useRef<{ solved: boolean; eff: number; first: number | null }[]>([])

  const finish = (solved: boolean) => {
    if (flash || log.current.length > idx) return
    log.current.push({ solved, eff: solved ? parMoves / Math.max(parMoves, count + 1) : 0, first: firstMove.current })
    setFlash(solved ? 'solved' : 'timeout')
    window.setTimeout(() => {
      if (idx + 1 < PROBLEMS.length) {
        const n = PROBLEMS[idx + 1]
        setIdx(idx + 1)
        setPegs(n.start)
        setHeld(null)
        setCount(0)
        setElapsed(0)
        setFlash(null)
        started.current = performance.now()
        firstMove.current = null
      } else {
        const L = log.current
        const solvedRuns = L.filter((r) => r.solved)
        const firsts = L.map((r) => r.first).filter((x): x is number => x != null)
        onDone({
          solved: solvedRuns.length,
          total: L.length,
          efficiency: solvedRuns.length ? solvedRuns.reduce((s, r) => s + r.eff, 0) / solvedRuns.length : 0,
          firstMoveMs: firsts.length ? firsts.reduce((a, b) => a + b, 0) / firsts.length : null,
        })
      }
    }, 900)
  }

  // Solved check happens on placement; `count` there is the pre-increment value.
  const tap = (peg: number) => {
    if (flash) return
    if (held == null) {
      if (!pegs[peg].length) return
      setHeld(peg)
      return
    }
    if (held === peg) {
      setHeld(null)
      return
    }
    if (pegs[peg].length >= CAPS[peg]) {
      setShake(peg)
      window.setTimeout(() => setShake(null), 260)
      return
    }
    const next = pegs.map((s) => s.slice())
    next[peg].push(next[held].pop()!)
    if (firstMove.current == null) firstMove.current = performance.now() - started.current
    setPegs(next)
    setHeld(null)
    setCount(count + 1)
    if (key(next) === key(prob.goal)) finish(true)
  }

  useEffect(() => {
    if (flash) return
    const id = window.setInterval(() => setElapsed((performance.now() - started.current) / 1000), 250)
    return () => clearInterval(id)
  }, [flash, idx])

  useEffect(() => {
    if (!flash && elapsed >= prob.limit) finish(false)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 3 && !e.repeat) tap(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="runes">
      <div className="hud">
        <span className="mono">
          Puzzle {idx + 1} / {PROBLEMS.length}
        </span>
        <span className="mono">
          Moves {count} · par {parMoves}
        </span>
        <span className={`mono ${left <= 5 ? 'bad' : ''}`}>{left} s</span>
      </div>
      <div className={`arena runes__arena ${flash ? `is-${flash}` : ''}`}>
        <div className="runes__target">
          <span className="label">Target</span>
          <Board pegs={prob.goal} small />
        </div>
        <div className="runes__main">
          <Board pegs={pegs} held={held} shake={shake} onTap={tap} />
          <p className="runes__status mono" aria-live="polite">
            {flash === 'solved' ? (
              <span className="good">{count <= parMoves ? 'Solved at par' : `Solved in ${count}`}</span>
            ) : flash === 'timeout' ? (
              <span className="bad">Out of time</span>
            ) : held != null ? (
              'Now tap where it goes'
            ) : (
              'Tap a pillar to lift its top rune'
            )}
          </p>
        </div>
        <button type="button" className="linkish runes__skip" onClick={() => finish(false)}>
          Give up on this one
        </button>
      </div>
    </div>
  )
}

function Board({ pegs, held = null, shake = null, small, onTap }: { pegs: Pegs; held?: number | null; shake?: number | null; small?: boolean; onTap?: (i: number) => void }) {
  return (
    <div className={`board ${small ? 'board--small' : ''}`}>
      {pegs.map((stack, i) => (
        <button
          key={i}
          type="button"
          className={`pillar ${held === i ? 'is-held' : ''} ${shake === i ? 'is-full' : ''}`}
          style={{ ['--cap' as string]: CAPS[i] }}
          onClick={onTap ? () => onTap(i) : undefined}
          tabIndex={onTap ? 0 : -1}
          disabled={!onTap}
          aria-label={onTap ? `Pillar ${i + 1}, holds ${CAPS[i]}, has ${stack.length}. Key ${i + 1}.` : undefined}
        >
          <span className="pillar__rod" />
          <span className="pillar__stack">
            {stack.map((r, k) => (
              <span key={r} className={`rune ${held === i && k === stack.length - 1 ? 'is-lifted' : ''}`} style={{ ['--tone' as string]: RUNES[r].tone }}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={RUNES[r].shape} />
                </svg>
              </span>
            ))}
          </span>
          {!small && <span className="pillar__key mono">{i + 1}</span>}
        </button>
      ))}
    </div>
  )
}
