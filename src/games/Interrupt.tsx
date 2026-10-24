import { useEffect, useRef, useState } from 'react'
import type { InterruptResult } from '../engine/types'

const CAST_MS = 1050
/** Fixed for every player so results are comparable: 12 go, 4 no-go, never no-go first. */
const SCHEDULE = [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1]
const GAPS = [600, 820, 450, 700, 520, 900, 480, 650, 760, 540, 880, 470, 610, 720, 500, 680]
const GO = ['Pyroblast', 'Shadow Bolt', 'Chain Heal', 'Fear', 'Polymorph', 'Mind Blast', 'Hex', 'Greater Heal', 'Starfire', 'Soul Fire', 'Lightning Bolt', 'Mind Control']
const NOGO = ['Divine Ward', 'Arcane Bulwark', 'Stoneform', 'Frost Ward']

type Feedback = { kind: 'kick' | 'waste' | 'miss' | 'let' | 'early'; rt?: number } | null

export function Interrupt({ onDone }: { onDone: (r: InterruptResult) => void }) {
  const [trial, setTrial] = useState(-1)
  const [casting, setCasting] = useState(false)
  const [fb, setFb] = useState<Feedback>(null)
  const pressRef = useRef<() => void>(() => {})

  useEffect(() => {
    // Fresh per mount, so a remount (StrictMode, retake) never inherits a half-run.
    const st = { trial: -1, casting: false, start: 0, responded: false, rts: [] as number[], fa: 0, premature: 0, timer: 0 }
    const schedule = (fn: () => void, ms: number) => {
      st.timer = window.setTimeout(fn, ms)
    }
    const nextTrial = () => {
      const t = st.trial + 1
      if (t >= SCHEDULE.length) {
        const go = SCHEDULE.filter(Boolean).length
        const meanRT = st.rts.length ? st.rts.reduce((a, b) => a + b, 0) / st.rts.length : null
        onDone({ meanRT, hitRate: st.rts.length / go, faRate: st.fa / (SCHEDULE.length - go), premature: st.premature })
        return
      }
      st.trial = t
      setTrial(t)
      setFb(null)
      schedule(() => {
        st.casting = true
        st.responded = false
        st.start = performance.now()
        setCasting(true)
        schedule(endCast, CAST_MS)
      }, GAPS[t])
    }
    const endCast = () => {
      st.casting = false
      setCasting(false)
      if (!st.responded) setFb({ kind: SCHEDULE[st.trial] ? 'miss' : 'let' })
      schedule(nextTrial, 380)
    }
    const press = () => {
      if (!st.casting) {
        if (st.trial >= 0) {
          st.premature++
          setFb({ kind: 'early' })
        }
        return
      }
      if (st.responded) return
      st.responded = true
      const rt = performance.now() - st.start
      clearTimeout(st.timer)
      st.casting = false
      setCasting(false)
      if (SCHEDULE[st.trial]) {
        st.rts.push(rt)
        setFb({ kind: 'kick', rt })
      } else {
        st.fa++
        setFb({ kind: 'waste' })
      }
      schedule(nextTrial, 420)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (!e.repeat) press()
      }
    }
    pressRef.current = press
    window.addEventListener('keydown', onKey)
    nextTrial()
    return () => {
      clearTimeout(st.timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onDone])

  const go = trial >= 0 && SCHEDULE[trial] === 1
  const spell = trial < 0 ? '' : go ? GO[SCHEDULE.slice(0, trial).filter(Boolean).length % GO.length] : NOGO[SCHEDULE.slice(0, trial).filter((x) => !x).length % NOGO.length]

  return (
    <div className="interrupt">
      <div className="hud">
        <span className="mono">
          Cast {Math.max(1, trial + 1)} / {SCHEDULE.length}
        </span>
        <span className="hud__rule">
          <span className="chip chip--danger">Red: kick</span>
          <span className="chip chip--safe">Blue, shielded: let it go</span>
        </span>
      </div>
      <div
        className={`arena interrupt__arena ${fb?.kind === 'waste' || fb?.kind === 'early' ? 'is-bad' : ''}`}
        onPointerDown={(e) => {
          e.preventDefault()
          pressRef.current()
        }}
      >
        <div className={`caster ${casting ? 'is-casting' : ''}`}>
          <div className="caster__name">{casting ? spell : '…'}</div>
          <div className={`castbar ${go ? 'castbar--go' : 'castbar--nogo'}`} aria-hidden="true">
            {casting && <span className="castbar__fill" key={trial} style={{ animationDuration: `${CAST_MS}ms` }} />}
            {casting && !go && <ShieldGlyph />}
          </div>
          <div className="caster__fb mono" aria-live="polite">
            {fb?.kind === 'kick' && <span className="good">Interrupted · {Math.round(fb.rt!)} ms</span>}
            {fb?.kind === 'waste' && <span className="bad">Wasted: that cast was shielded</span>}
            {fb?.kind === 'miss' && <span className="bad">Too slow, the cast landed</span>}
            {fb?.kind === 'let' && <span className="muted">Good, you let it go</span>}
            {fb?.kind === 'early' && <span className="bad">Nothing to kick yet</span>}
          </div>
        </div>
        <button type="button" className="kick" tabIndex={-1} aria-label="Kick (Space)">
          Kick <span className="mono">Space</span>
        </button>
      </div>
    </div>
  )
}

function ShieldGlyph() {
  return (
    <svg className="castbar__shield" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" />
    </svg>
  )
}
