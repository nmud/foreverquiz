import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calculating } from './components/Calculating'
import { GameShell, type GameMeta } from './components/GameShell'
import { Intro } from './components/Intro'
import { Questions } from './components/Questions'
import { Results } from './components/Results'
import { Tipi } from './components/Tipi'
import { QUESTIONS_A, QUESTIONS_B } from './data/questions'
import { buildProfile } from './engine/profile'
import { decodeProfile, encodeProfile } from './engine/share'
import { emptyAnswers, type Answers, type GameId, type GameResults, type Profile } from './engine/types'
import { Interrupt } from './games/Interrupt'
import { Kite } from './games/Kite'
import { Overcharge } from './games/Overcharge'
import { Rotation } from './games/Rotation'
import { Runes } from './games/Runes'
import { Triage } from './games/Triage'

type Step =
  | { kind: 'tipi'; label: string; est: number }
  | { kind: 'questions'; set: 'A' | 'B'; label: string; est: number }
  | { kind: 'game'; id: GameId; label: string; est: number }

/** Alternate self-report and behaviour so attention stays fresh. Estimates are in seconds. */
const FLOW: Step[] = [
  { kind: 'tipi', label: 'Personality', est: 35 },
  { kind: 'game', id: 'interrupt', label: 'Reflex', est: 32 },
  { kind: 'questions', set: 'A', label: 'Playstyle', est: 25 },
  { kind: 'game', id: 'triage', label: 'Triage', est: 30 },
  { kind: 'game', id: 'overcharge', label: 'Risk', est: 28 },
  { kind: 'questions', set: 'B', label: 'Fantasy', est: 28 },
  { kind: 'game', id: 'rotation', label: 'Memory', est: 34 },
  { kind: 'game', id: 'kite', label: 'Movement', est: 24 },
  { kind: 'game', id: 'runes', label: 'Planning', est: 44 },
]
export const TOTAL_EST = FLOW.reduce((s, f) => s + f.est, 0)

const GAMES: Record<GameId, GameMeta> = {
  interrupt: {
    title: 'Kick the cast',
    goal: 'Enemy casters are channeling. Interrupt every red cast before it lands. Blue casts are shielded: leave them alone, kicking one wastes your interrupt.',
    controls: ['Space or tap Kick'],
    measures: 'Response time and inhibitory control · Go/No-Go paradigm',
    render: (done) => <Interrupt onDone={done} />,
  },
  triage: {
    title: 'Keep them standing',
    goal: 'Twenty seconds of incoming damage. Tap a party member to heal them. Mana is limited and each heal triggers a short cooldown, so choose who needs it most.',
    controls: ['Tap a frame', 'or keys 1 to 5'],
    measures: 'Divided attention and triage priority · multiple-object monitoring',
    render: (done) => <Triage onDone={done} />,
  },
  overcharge: {
    title: 'Overcharge',
    goal: 'Each charge adds 100 damage to your spell. Release whenever you like to bank it. Overcharge and it fizzles, and that round scores nothing. Five rounds.',
    controls: ['Space: charge', 'Enter: release'],
    measures: 'Risk appetite · Balloon Analogue Risk Task (Lejuez et al., 2002)',
    render: (done) => <Overcharge onDone={done} />,
  },
  rotation: {
    title: 'Learn the rotation',
    goal: 'Watch the abilities light up, then press them back in the same order. Each correct rotation gets one longer. You have one spare life.',
    controls: ['Tap the abilities', 'or keys 1 to 4'],
    measures: 'Working-memory span · sequence span (Simon / Corsi family)',
    render: (done) => <Rotation onDone={done} />,
  },
  kite: {
    title: 'Kite the elite',
    goal: 'An elite is chasing you. Stay inside the gold ring: close enough to cast, outside its reach. Do not stand in fire.',
    controls: ['Move your pointer or finger in the arena', 'or arrow keys / WASD'],
    measures: 'Spatial tracking and movement under pressure · pursuit task',
    render: (done) => <Kite onDone={done} />,
  },
  runes: {
    title: 'Align the runes',
    goal: 'Rearrange the runes to match the target. Move one rune at a time, only from the top of a stack. The left pillar holds three, the middle two, the right one. Try to hit par.',
    controls: ['Tap a pillar to lift, tap another to place', 'or keys 1 to 3'],
    measures: 'Planning · Tower of London (Shallice, 1982)',
    render: (done) => <Runes onDone={done} />,
  },
}

type View = { at: 'intro' } | { at: 'step'; index: number } | { at: 'calc' } | { at: 'results'; shared: boolean }

function readShared(): Profile | null {
  const m = location.hash.match(/^#r=([\w-]+)$/)
  return m ? decodeProfile(m[1]) : null
}

export default function App() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [shared] = useState(readShared)
  const [view, setView] = useState<View>(() => (shared ? { at: 'results', shared: true } : { at: 'intro' }))
  const [profile, setProfile] = useState<Profile | null>(shared)

  const go = useCallback((v: View) => {
    setView(v)
    window.scrollTo({ top: 0 })
  }, [])

  const next = useCallback(
    (index: number) => {
      if (index + 1 < FLOW.length) go({ at: 'step', index: index + 1 })
      else go({ at: 'calc' })
    },
    [go],
  )

  useEffect(() => {
    if (view.at !== 'calc') return
    const p = buildProfile(answers)
    setProfile(p)
    history.replaceState(null, '', `#r=${encodeProfile(p)}`)
  }, [view.at, answers])

  // A result link pasted into an open tab only changes the hash; follow it.
  useEffect(() => {
    const onHash = () => {
      const p = readShared()
      if (p) {
        setProfile(p)
        go({ at: 'results', shared: true })
      } else if (!location.hash) go({ at: 'intro' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go])

  const restart = useCallback(() => {
    history.replaceState(null, '', location.pathname)
    setAnswers(emptyAnswers())
    setProfile(null)
    go({ at: 'intro' })
  }, [go])

  const index = view.at === 'step' ? view.index : view.at === 'intro' ? -1 : FLOW.length
  const remaining = useMemo(() => FLOW.slice(Math.max(0, index)).reduce((s, f) => s + f.est, 0), [index])

  let body: React.ReactNode = null
  if (view.at === 'intro') body = <Intro totalSeconds={TOTAL_EST} onStart={() => go({ at: 'step', index: 0 })} />
  else if (view.at === 'calc') body = <Calculating onDone={() => go({ at: 'results', shared: false })} />
  else if (view.at === 'results' && profile) body = <Results profile={profile} shared={view.shared} onRestart={restart} />
  else if (view.at === 'step') {
    const step = FLOW[view.index]
    const i = view.index
    if (step.kind === 'tipi') {
      body = (
        <Tipi
          values={answers.tipi}
          onChange={(tipi) => setAnswers((a) => ({ ...a, tipi }))}
          onDone={() => next(i)}
        />
      )
    } else if (step.kind === 'questions') {
      body = (
        <Questions
          key={step.set}
          questions={step.set === 'A' ? QUESTIONS_A : QUESTIONS_B}
          choices={answers.choices}
          onChange={(id, picked) => setAnswers((a) => ({ ...a, choices: { ...a.choices, [id]: picked } }))}
          onDone={() => next(i)}
        />
      )
    } else {
      const id = step.id
      body = (
        <GameShell
          key={id}
          meta={GAMES[id]}
          onComplete={(result, enjoy) => {
            setAnswers((a) => ({
              ...a,
              games: result ? ({ ...a.games, [id]: result } as GameResults) : a.games,
              enjoy: enjoy == null ? a.enjoy : { ...a.enjoy, [id]: enjoy },
            }))
            next(i)
          }}
        />
      )
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          <CompassGlyph />
          <span>Forever Class Compass</span>
        </div>
        {view.at === 'step' && (
          <div className="topbar__progress" aria-live="polite">
            <span className="mono">{String(index + 1).padStart(2, '0')}/{String(FLOW.length).padStart(2, '0')}</span>
            <span className="topbar__label">{FLOW[index].label}</span>
            <span className="mono topbar__eta">≈{formatTime(remaining)} left</span>
          </div>
        )}
      </header>
      {view.at === 'step' && (
        <div className="progress" aria-hidden="true">
          {FLOW.map((f, i) => (
            <span key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} style={{ flexGrow: f.est }} />
          ))}
        </div>
      )}
      <main className="stage">{body}</main>
      <footer className="foot">
        Fan-made and unofficial. Not affiliated with Blizzard Entertainment. Class kits reflect the 1.60 beta and may change at launch.
      </footer>
    </div>
  )
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.round(s % 60)).padStart(2, '0')}`
}

function CompassGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="wordmark__glyph">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <path d="M12 12 L18 6" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12 L8 16" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.8" fill="var(--color-accent)" />
    </svg>
  )
}
