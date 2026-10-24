import { useEffect, useRef, useState } from 'react'
import type { KiteResult } from '../engine/types'

const DURATION = 14
const FIRE_EVERY = 2
const FIRE_WARN = 0.6
const FIRE_LIFE = 5

interface Fire { x: number; y: number; born: number }

export function Kite({ onDone }: { onDone: (r: KiteResult) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState({ t: 0, band: 0, state: 'in' as 'in' | 'close' | 'far' | 'fire' })

  useEffect(() => {
    const el = canvas.current!
    const box = wrap.current!
    const ctx = el.getContext('2d')!
    const css = getComputedStyle(document.documentElement)
    const c = (name: string) => css.getPropertyValue(name).trim()
    const col = {
      grid: c('--color-rule'), ring: c('--color-accent'), wash: c('--color-accent-wash'), danger: c('--color-danger'),
      dangerWash: c('--color-danger-wash'), player: c('--color-ink'), fire: c('--color-fire'), paper: c('--color-paper-2'), muted: c('--color-neutral'),
    }

    let W = 0, H = 0, S = 0
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      W = box.clientWidth
      // Portrait phones get a near-square arena; wide screens a landscape one.
      H = Math.round(Math.min(420, Math.max(260, W * (W < 520 ? 1.05 : 0.62))))
      S = Math.min(W, H)
      el.width = W * dpr
      el.height = H * dpr
      el.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Seeded fire positions: same pressure for everyone.
    let seed = 424242
    const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647)

    const st = {
      p: { x: W * 0.3, y: H * 0.5 },
      e: { x: W * 0.85, y: H * 0.5 },
      target: { x: W * 0.3, y: H * 0.5 },
      keys: new Set<string>(),
      t: 0, band: 0, close: 0, fireT: 0, nextFire: 1.2,
      fires: [] as Fire[],
      done: false,
    }

    const setTarget = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect()
      // On touch, steer a little above the fingertip so the dot stays visible.
      const lift = ev.pointerType === 'touch' ? 36 : 0
      st.target = { x: ev.clientX - r.left, y: ev.clientY - r.top - lift }
    }
    const onKey = (down: boolean) => (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        ev.preventDefault()
        if (down) st.keys.add(k)
        else st.keys.delete(k)
      }
    }
    const kd = onKey(true)
    const ku = onKey(false)
    el.addEventListener('pointermove', setTarget)
    el.addEventListener('pointerdown', setTarget)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('resize', resize)

    let last = performance.now()
    let raf = 0
    let hudAt = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      st.t += dt
      const inner = S * 0.17
      const outer = S * 0.38
      const pSpeed = S * 0.95
      const eSpeed = S * (0.62 + 0.24 * Math.min(1, st.t / DURATION))

      // Keyboard steers the target point; pointer sets it directly.
      if (st.keys.size) {
        const dx = (st.keys.has('arrowright') || st.keys.has('d') ? 1 : 0) - (st.keys.has('arrowleft') || st.keys.has('a') ? 1 : 0)
        const dy = (st.keys.has('arrowdown') || st.keys.has('s') ? 1 : 0) - (st.keys.has('arrowup') || st.keys.has('w') ? 1 : 0)
        st.target = { x: st.p.x + dx * 60, y: st.p.y + dy * 60 }
      }
      const tx = st.target.x - st.p.x
      const ty = st.target.y - st.p.y
      const td = Math.hypot(tx, ty)
      if (td > 1) {
        const step = Math.min(td, pSpeed * dt)
        st.p.x += (tx / td) * step
        st.p.y += (ty / td) * step
      }
      const pr = 9
      st.p.x = Math.max(pr, Math.min(W - pr, st.p.x))
      st.p.y = Math.max(pr, Math.min(H - pr, st.p.y))

      const ex = st.p.x - st.e.x
      const ey = st.p.y - st.e.y
      const dist = Math.hypot(ex, ey)
      if (dist > 1) {
        const step = Math.min(dist - inner * 0.4, eSpeed * dt)
        if (step > 0) {
          st.e.x += (ex / dist) * step
          st.e.y += (ey / dist) * step
        }
      }

      if (st.t >= st.nextFire) {
        st.nextFire += FIRE_EVERY
        let fx = 0, fy = 0
        for (let tries = 0; tries < 8; tries++) {
          fx = S * 0.08 + rnd() * (W - S * 0.16)
          fy = S * 0.08 + rnd() * (H - S * 0.16)
          if (Math.hypot(fx - st.p.x, fy - st.p.y) > S * 0.2) break
        }
        st.fires.push({ x: fx, y: fy, born: st.t })
      }
      st.fires = st.fires.filter((f) => st.t - f.born < FIRE_LIFE)
      const fireR = S * 0.075
      const inFire = st.fires.some((f) => st.t - f.born > FIRE_WARN && Math.hypot(f.x - st.p.x, f.y - st.p.y) < fireR + pr * 0.5)

      const d2 = Math.hypot(st.p.x - st.e.x, st.p.y - st.e.y)
      const state = inFire ? 'fire' : d2 < inner ? 'close' : d2 > outer ? 'far' : 'in'
      if (state === 'in') st.band += dt
      if (d2 < inner) st.close += dt
      if (inFire) st.fireT += dt

      // Draw
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = col.paper
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = col.grid
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke() }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke() }
      ctx.globalAlpha = 1

      for (const f of st.fires) {
        const age = st.t - f.born
        const live = age > FIRE_WARN
        ctx.beginPath()
        ctx.arc(f.x, f.y, fireR, 0, Math.PI * 2)
        if (live) {
          ctx.fillStyle = col.fire
          ctx.globalAlpha = 0.35 + 0.1 * Math.sin(st.t * 12 + f.x)
          ctx.fill()
          ctx.globalAlpha = 1
        }
        ctx.strokeStyle = col.fire
        ctx.setLineDash(live ? [] : [4, 4])
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Range band around the elite
      ctx.beginPath()
      ctx.arc(st.e.x, st.e.y, outer, 0, Math.PI * 2)
      ctx.arc(st.e.x, st.e.y, inner, 0, Math.PI * 2, true)
      ctx.fillStyle = col.wash
      ctx.fill()
      ctx.strokeStyle = col.ring
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(st.e.x, st.e.y, outer, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(st.e.x, st.e.y, inner, 0, Math.PI * 2)
      ctx.fillStyle = col.dangerWash
      ctx.fill()
      ctx.strokeStyle = col.danger
      ctx.stroke()

      // Elite
      ctx.beginPath()
      ctx.arc(st.e.x, st.e.y, 17, 0, Math.PI * 2)
      ctx.fillStyle = col.danger
      ctx.fill()
      ctx.fillStyle = col.paper
      ctx.font = '600 9px Geist, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ELITE', st.e.x, st.e.y + 0.5)

      // Your spell, while in the band
      if (state === 'in' && Math.floor(st.t * 4) % 2 === 0) {
        ctx.strokeStyle = col.ring
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        ctx.beginPath(); ctx.moveTo(st.p.x, st.p.y); ctx.lineTo(st.e.x, st.e.y); ctx.stroke()
        ctx.globalAlpha = 1
      }

      // You
      ctx.beginPath()
      ctx.arc(st.p.x, st.p.y, pr, 0, Math.PI * 2)
      ctx.fillStyle = state === 'in' ? col.ring : state === 'far' ? col.muted : col.danger
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = col.player
      ctx.stroke()

      if (now - hudAt > 100) {
        hudAt = now
        setHud({ t: st.t, band: st.band / Math.max(st.t, 0.001), state })
      }

      if (st.t >= DURATION) {
        st.done = true
        onDone({ inBand: st.band / DURATION, melee: st.close / DURATION, fire: st.fireT / DURATION })
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', setTarget)
      el.removeEventListener('pointerdown', setTarget)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('resize', resize)
    }
  }, [onDone])

  const label = { in: 'In range, casting', close: 'Too close: it is hitting you', far: 'Out of range', fire: 'Standing in fire' }[hud.state]

  return (
    <div className="kite">
      <div className="hud">
        <span className="mono">{Math.max(0, DURATION - hud.t).toFixed(1)} s</span>
        <span className={`mono ${hud.state === 'in' ? 'good' : 'bad'}`} aria-live="off">
          {label}
        </span>
        <span className="mono">In range {Math.round(hud.band * 100)}%</span>
      </div>
      <div className="arena kite__arena" ref={wrap}>
        <canvas ref={canvas} className="kite__canvas" aria-label="Kiting arena: keep your dot inside the gold ring around the elite." />
      </div>
    </div>
  )
}
