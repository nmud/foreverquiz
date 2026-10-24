import { useEffect, useRef, useState } from 'react'
import type { ClassId, TriageResult } from '../engine/types'

const DURATION = 20
const HEAL = 30
const COST = 8
const GCD = 0.45
const REGEN = 2.5
const TANK_DRAIN = 5
const AOE_AT = [6, 12, 17]
const AOE_DMG = 14

const PARTY: { name: string; cls: ClassId; start: number }[] = [
  { name: 'Tank', cls: 'warrior', start: 100 },
  { name: 'Rogue', cls: 'rogue', start: 82 },
  { name: 'Mage', cls: 'mage', start: 74 },
  { name: 'Hunter', cls: 'hunter', start: 88 },
  { name: 'Shaman', cls: 'shaman', start: 78 },
]

/** Same damage script for everyone (seeded), so scores compare fairly. */
function script() {
  let seed = 20261104
  const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647)
  const hits: { t: number; target: number; dmg: number }[] = []
  let t = 1
  while (t < DURATION - 0.5) {
    const target = rnd() < 0.15 ? 0 : 1 + Math.floor(rnd() * 4)
    hits.push({ t, target, dmg: 20 + Math.round(rnd() * 14) })
    t += 0.9 + rnd() * 0.7
  }
  return hits
}

interface Snap {
  hp: number[]
  mana: number
  gcd: number
  t: number
  flash: number[]
  aoe: boolean
}

export function Triage({ onDone }: { onDone: (r: TriageResult) => void }) {
  const [snap, setSnap] = useState<Snap>(() => ({ hp: PARTY.map((p) => p.start), mana: 100, gcd: 0, t: 0, flash: PARTY.map(() => -9), aoe: false }))
  const [denied, setDenied] = useState<number | null>(null)
  const healRef = useRef<(i: number) => void>(() => {})

  useEffect(() => {
    const hits = script()
    const st = {
      hp: PARTY.map((p) => p.start),
      mana: 100,
      gcdUntil: 0,
      t: 0,
      next: 0,
      aoe: 0,
      flash: PARTY.map(() => -9),
      heals: 0,
      onLowest: 0,
      overheal: 0,
      healed: 0,
      hpArea: 0,
      over: false,
    }
    let last = performance.now()
    let raf = 0

    const hurt = (i: number, dmg: number, flash = true) => {
      if (st.hp[i] <= 0) return
      st.hp[i] = Math.max(0, st.hp[i] - dmg)
      if (flash) st.flash[i] = st.t
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      st.t += dt
      hurt(0, TANK_DRAIN * dt, false)
      while (st.next < hits.length && hits[st.next].t <= st.t) {
        const h = hits[st.next++]
        hurt(h.target, h.dmg)
      }
      while (st.aoe < AOE_AT.length && AOE_AT[st.aoe] <= st.t) {
        st.aoe++
        PARTY.forEach((_, i) => hurt(i, AOE_DMG))
      }
      st.mana = Math.min(100, st.mana + REGEN * dt)
      st.hpArea += (st.hp.reduce((a, b) => a + b, 0) / (PARTY.length * 100)) * dt

      if (st.t >= DURATION || st.hp.every((h) => h <= 0)) {
        st.over = true
        onDone({
          survivors: st.hp.filter((h) => h > 0).length,
          total: PARTY.length,
          avgHp: st.hpArea / Math.max(st.t, 0.001),
          overheal: st.overheal / Math.max(1, st.overheal + st.healed),
          priority: st.heals ? st.onLowest / st.heals : 0,
          heals: st.heals,
        })
        return
      }
      setSnap({
        hp: st.hp.slice(),
        mana: st.mana,
        gcd: Math.max(0, st.gcdUntil - st.t) / GCD,
        t: st.t,
        flash: st.flash.slice(),
        aoe: AOE_AT.some((a) => st.t >= a && st.t < a + 0.35),
      })
      raf = requestAnimationFrame(tick)
    }

    healRef.current = (i: number) => {
      if (st.over) return
      if (st.hp[i] <= 0 || st.t < st.gcdUntil || st.mana < COST) {
        setDenied(i)
        window.setTimeout(() => setDenied(null), 200)
        return
      }
      const living = st.hp.filter((h) => h > 0)
      if (st.hp[i] <= Math.min(...living) + 6) st.onLowest++
      const gain = Math.min(HEAL, 100 - st.hp[i])
      st.healed += gain
      st.overheal += HEAL - gain
      st.hp[i] += gain
      st.mana -= COST
      st.heals++
      st.gcdUntil = st.t + GCD
    }

    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= PARTY.length) healRef.current(n - 1)
    }
    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(tick)
    return () => {
      st.over = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
  }, [onDone])

  return (
    <div className="triage">
      <div className="hud">
        <span className="mono">{Math.max(0, DURATION - snap.t).toFixed(1)} s</span>
        <span className="muted">Tap the most urgent frame</span>
      </div>
      <div className={`arena triage__arena ${snap.aoe ? 'is-aoe' : ''}`}>
        <div className="frames">
          {PARTY.map((p, i) => {
            const hp = snap.hp[i]
            const dead = hp <= 0
            const hurt = snap.t - snap.flash[i] < 0.25
            return (
              <button
                key={p.name}
                type="button"
                className={`frame ${dead ? 'is-dead' : ''} ${hurt ? 'is-hurt' : ''} ${hp < 35 && !dead ? 'is-low' : ''} ${denied === i ? 'is-denied' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  healRef.current(i)
                }}
                aria-label={`${p.name}, ${Math.round(hp)} health${dead ? ', dead' : ''}. Key ${i + 1}.`}
              >
                <span className="frame__top">
                  <span className="frame__key" style={{ background: `var(--class-${p.cls})` }} />
                  <span className="frame__name">{p.name}</span>
                  <span className="frame__n mono">{i + 1}</span>
                </span>
                <span className="frame__bar">
                  <span className="frame__fill" style={{ ['--w' as string]: (hp / 100).toFixed(3) }} />
                </span>
                <span className="frame__hp mono">{dead ? 'Dead' : Math.ceil(hp)}</span>
              </button>
            )
          })}
        </div>
        <div className="mana">
          <span className="mana__label mono">Mana</span>
          <span className="mana__bar">
            <span className="mana__fill" style={{ ['--w' as string]: (snap.mana / 100).toFixed(3) }} />
          </span>
          <span className="mana__gcd" style={{ ['--w' as string]: snap.gcd.toFixed(3) }} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
