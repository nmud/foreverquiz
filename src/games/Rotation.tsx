import { useEffect, useRef, useState } from 'react'
import type { RotationResult } from '../engine/types'

const ABILITIES = [
  { name: 'Strike', glyph: 'M5 19 L17 7 M14 4 L20 4 L20 10 M7 14 L10 17', tone: 'warrior' },
  { name: 'Guard', glyph: 'M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z', tone: 'paladin' },
  { name: 'Flame', glyph: 'M12 3 C14 7 18 9 18 14 A6 6 0 0 1 6 14 C6 11 8 9.5 9 8 C9.5 10 10.5 11 12 11 C11 8 11 5 12 3 Z', tone: 'druid' },
  { name: 'Frost', glyph: 'M12 3 V21 M4.2 7.5 L19.8 16.5 M19.8 7.5 L4.2 16.5 M9.5 4.5 L12 6.5 L14.5 4.5 M9.5 19.5 L12 17.5 L14.5 19.5', tone: 'mage' },
] as const

const START = 3
const MAX = 9
const ON_MS = 420
const OFF_MS = 160

/** Same sequences for everyone. No ability three times running, which reads as a glitch. */
function sequence(len: number, attempt: number) {
  let seed = 7919 * len + 104729 * attempt
  const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647)
  const out: number[] = []
  while (out.length < len) {
    const n = Math.floor(rnd() * ABILITIES.length)
    if (out.length >= 2 && out[out.length - 1] === n && out[out.length - 2] === n) continue
    out.push(n)
  }
  return out
}

type Phase = 'watch' | 'input' | 'right' | 'wrong'

export function Rotation({ onDone }: { onDone: (r: RotationResult) => void }) {
  const [len, setLen] = useState(START)
  const [attempt, setAttempt] = useState(0)
  const [lives, setLives] = useState(1)
  const [phase, setPhase] = useState<Phase>('watch')
  const [lit, setLit] = useState<number | null>(null)
  const [pos, setPos] = useState(0)
  const [pressed, setPressed] = useState<{ i: number; ok: boolean } | null>(null)
  const best = useRef(START - 1)
  const seq = useRef<number[]>(sequence(START, 0))

  // Play the sequence back.
  useEffect(() => {
    if (phase !== 'watch') return
    seq.current = sequence(len, attempt)
    const timers: number[] = []
    const lead = 450
    seq.current.forEach((n, k) => {
      timers.push(window.setTimeout(() => setLit(n), lead + k * (ON_MS + OFF_MS)))
      timers.push(window.setTimeout(() => setLit(null), lead + k * (ON_MS + OFF_MS) + ON_MS))
    })
    timers.push(window.setTimeout(() => {
      setPos(0)
      setPhase('input')
    }, lead + len * (ON_MS + OFF_MS)))
    return () => timers.forEach(clearTimeout)
  }, [phase, len, attempt])

  const press = (i: number) => {
    if (phase !== 'input') return
    const ok = seq.current[pos] === i
    setPressed({ i, ok })
    window.setTimeout(() => setPressed((p) => (p?.i === i ? null : p)), 160)
    if (!ok) {
      setPhase('wrong')
      window.setTimeout(() => {
        if (lives > 0) {
          setLives(lives - 1)
          setAttempt((a) => a + 1)
          setPhase('watch')
        } else onDone({ span: best.current })
      }, 750)
      return
    }
    if (pos + 1 < len) {
      setPos(pos + 1)
      return
    }
    best.current = len
    setPhase('right')
    window.setTimeout(() => {
      if (len >= MAX) onDone({ span: best.current })
      else {
        setLen(len + 1)
        setPhase('watch')
      }
    }, 550)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= ABILITIES.length && !e.repeat) press(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const status =
    phase === 'watch' ? 'Watch the rotation' : phase === 'input' ? `Your turn · ${pos} of ${len}` : phase === 'right' ? 'Clean rotation' : lives > 0 ? 'Wrong ability · one more try' : 'Wrong ability'

  return (
    <div className="rotation">
      <div className="hud">
        <span className="mono">Length {len}</span>
        <span className="mono">{lives ? '1 spare life' : 'No spare lives'}</span>
      </div>
      <div className={`arena rotation__arena is-${phase}`}>
        <p className={`rotation__status ${phase === 'wrong' ? 'bad' : phase === 'right' ? 'good' : ''}`} aria-live="polite">
          {status}
        </p>
        <div className="abilities">
          {ABILITIES.map((a, i) => (
            <button
              key={a.name}
              type="button"
              className={`ability ${lit === i ? 'is-lit' : ''} ${pressed?.i === i ? (pressed.ok ? 'is-ok' : 'is-bad') : ''}`}
              style={{ ['--tone' as string]: `var(--class-${a.tone})` }}
              onPointerDown={(e) => {
                e.preventDefault()
                press(i)
              }}
              aria-disabled={phase !== 'input'}
              aria-label={`${a.name}, key ${i + 1}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={a.glyph} />
              </svg>
              <span className="ability__name">{a.name}</span>
              <span className="ability__key mono">{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="pips" aria-hidden="true">
          {Array.from({ length: len }, (_, k) => (
            <span key={k} className={phase === 'input' && k < pos ? 'is-on' : phase === 'right' ? 'is-on' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}
