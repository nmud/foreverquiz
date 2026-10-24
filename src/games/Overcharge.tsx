import { useEffect, useRef, useState } from 'react'
import type { OverchargeResult } from '../engine/types'

/** The charge that fizzles, per round. Fixed for everyone; unknown to the player. Mean safe stop ≈ 7.6. */
const BREAKS = [9, 5, 12, 7, 10]
const PER = 100

type Phase = 'charging' | 'fizzled' | 'banked'

export function Overcharge({ onDone }: { onDone: (r: OverchargeResult) => void }) {
  const [round, setRound] = useState(0)
  const [charges, setCharges] = useState(0)
  const [phase, setPhase] = useState<Phase>('charging')
  const [total, setTotal] = useState(0)
  const log = useRef<{ pumps: number; burst: boolean }[]>([])
  const busy = useRef(false)

  const finishRound = (pumps: number, burst: boolean) => {
    busy.current = true
    log.current.push({ pumps, burst })
    window.setTimeout(() => {
      if (log.current.length >= BREAKS.length) {
        const banked = log.current.filter((r) => !r.burst)
        // Adjusted pumps (Lejuez et al.): average over rounds that did not burst.
        const pool = banked.length ? banked : log.current
        onDone({
          adjPumps: pool.reduce((s, r) => s + r.pumps, 0) / pool.length,
          bursts: log.current.length - banked.length,
          rounds: BREAKS.length,
          damage: banked.reduce((s, r) => s + r.pumps * PER, 0),
        })
        return
      }
      setRound((r) => r + 1)
      setCharges(0)
      setPhase('charging')
      busy.current = false
    }, 850)
  }

  const charge = () => {
    if (busy.current || phase !== 'charging') return
    const n = charges + 1
    setCharges(n)
    if (n >= BREAKS[round]) {
      setPhase('fizzled')
      finishRound(n, true)
    }
  }

  const release = () => {
    if (busy.current || phase !== 'charging' || charges === 0) return
    setPhase('banked')
    setTotal((t) => t + charges * PER)
    finishRound(charges, false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      // A focused button would also fire on keyup; the shortcut alone should count.
      if (e.code === 'Space' || e.key === 'Enter') (document.activeElement as HTMLElement | null)?.blur()
      if (e.code === 'Space' || e.key === 'c') {
        e.preventDefault()
        charge()
      }
      if (e.key === 'Enter' || e.key === 'r') {
        e.preventDefault()
        release()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const size = 0.34 + Math.min(charges, 14) * 0.05

  return (
    <div className="overcharge">
      <div className="hud">
        <span className="rounds" aria-label={`Round ${round + 1} of ${BREAKS.length}`}>
          {BREAKS.map((_, i) => (
            <span key={i} className={i < round ? 'is-done' : i === round ? 'is-now' : ''} />
          ))}
        </span>
        <span className="mono">Banked {total.toLocaleString()}</span>
      </div>
      <div className={`arena overcharge__arena is-${phase}`}>
        <div className="orb-wrap" aria-hidden="true">
          <div className="orb" style={{ ['--s' as string]: size.toFixed(3), ['--heat' as string]: Math.min(1, charges / 12).toFixed(3) }}>
            <span className="orb__core" />
            <span className="orb__ring" key={charges} />
          </div>
        </div>
        <div className="overcharge__readout" aria-live="polite">
          {phase === 'fizzled' ? (
            <span className="bad mono">Fizzled. This round scores 0.</span>
          ) : phase === 'banked' ? (
            <span className="good mono">Released for {(charges * PER).toLocaleString()} damage</span>
          ) : (
            <>
              <span className="overcharge__dmg mono">{(charges * PER).toLocaleString()}</span>
              <span className="muted">damage charged · {charges} charge{charges === 1 ? '' : 's'}</span>
            </>
          )}
        </div>
        <div className="overcharge__actions">
          <button type="button" className="btn btn--ghost btn--lg" onClick={charge} disabled={phase !== 'charging'}>
            Charge <span className="mono">Space</span>
          </button>
          <button type="button" className="btn btn--primary btn--lg" onClick={release} disabled={phase !== 'charging' || charges === 0}>
            Release <span className="mono">Enter</span>
          </button>
        </div>
      </div>
    </div>
  )
}
