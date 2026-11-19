import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, Crown, Shield, Swords, Zap, RotateCcw, Sparkles } from 'lucide-react'
import { getAttackProfile, resolveExchange } from '../game/engine/combatEngine'
import { chooseCpuPowerIndex } from '../game/engine/aiEngine'
import { playPowerSound } from '../game/engine/audioEngine'

type Props = { onExit: () => void; onWin?: () => void }
type Side = 'blue' | 'red'
type Power = { name: string; type: string; icon: string; strength: number; color: string; note: string }

const blueHeroes = [
  { name: 'NOVA', title: 'THE LIGHTNING STRIKER', image: '/images/fighters/blue-idle.png', accent: '#79dcff', bonus: 3, passive: 'ENERGY CONTROL · +3 POWER' },
  { name: 'VOLT', title: 'THE STORM WARRIOR', image: '/images/fighters/blue-idle.png', accent: '#b6a0ff', bonus: 5, passive: 'BURST SPECIALIST · +5 POWER' },
  { name: 'FROST', title: 'THE ICE GUARDIAN', image: '/images/fighters/blue-idle.png', accent: '#8ceaff', bonus: 2, passive: 'CONTROL SPECIALIST · +2 POWER' },
]
const redHeroes = [
  { name: 'EMBER', title: 'THE FIRE CHAMPION', image: '/images/fighters/red-idle.png', accent: '#ffb19a', bonus: 4, passive: 'FLAME MASTERY · +4 POWER' },
  { name: 'HEX', title: 'THE SHADOW LORD', image: '/images/fighters/red-idle.png', accent: '#c49bff', bonus: 5, passive: 'VOID MASTERY · +5 POWER' },
  { name: 'SOLIS', title: 'THE SOLAR KNIGHT', image: '/images/fighters/red-idle.png', accent: '#ffe18a', bonus: 3, passive: 'RADIANT GUARD · +3 POWER' },
]
const powerPool: Power[] = [
  { name: 'THUNDER SPEAR', type: 'LIGHTNING', icon: 'ϟ', strength: 78, color: '#55c8ff', note: 'A focused bolt that pierces the arena.' },
  { name: 'INFERNO WAVE', type: 'FIRE', icon: '✦', strength: 86, color: '#ff754d', note: 'A sweeping wave of controlled flame.' },
  { name: 'FROST BREAKER', type: 'ICE', icon: '❄', strength: 72, color: '#8deaff', note: 'A freezing strike that slows the rival.' },
  { name: 'VOID CRUSH', type: 'SHADOW', icon: '◈', strength: 92, color: '#b58aff', note: 'A dense shadow blast with heavy impact.' },
  { name: 'SOLAR BURST', type: 'SOLAR', icon: '☼', strength: 88, color: '#ffd36c', note: 'A bright burst of concentrated energy.' },
  { name: 'WIND CUTTER', type: 'WIND', icon: '〰', strength: 66, color: '#a9e6cf', note: 'A fast pressure wave across the ground.' },
  { name: 'CRYSTAL GUARD', type: 'SHIELD', icon: '⬡', strength: 70, color: '#83c9ff', note: 'A defensive wall that absorbs impact.' },
  { name: 'METEOR KICK', type: 'IMPACT', icon: '✹', strength: 82, color: '#ff9b70', note: 'A high-speed physical finisher.' },
  { name: 'PLASMA ORB', type: 'PLASMA', icon: '●', strength: 80, color: '#76a9ff', note: 'A compact energy orb with a sharp hit.' },
  { name: 'PHANTOM DASH', type: 'SPEED', icon: '➤', strength: 75, color: '#d0a8ff', note: 'A sudden dash followed by a clean strike.' },
  { name: 'TIDAL DRAGON', type: 'WATER', icon: '🌊', strength: 91, color: '#53cfff', note: 'A roaring water dragon surges across the arena.' },
  { name: 'OCEAN SPIRAL', type: 'WATER', icon: '💧', strength: 76, color: '#55b9ff', note: 'A twisting water current sweeps the rival away.' },
  { name: 'PHOENIX ROAR', type: 'FIRE', icon: '🔥', strength: 94, color: '#ff754d', note: 'A blazing phoenix wave erupts from the hands.' },
  { name: 'FROST NOVA', type: 'ICE', icon: '❄', strength: 84, color: '#8deaff', note: 'A ring of ice shards bursts outward.' },
  { name: 'GUARDIAN AEGIS', type: 'SHIELD', icon: '🛡️', strength: 89, color: '#83c9ff', note: 'A protective barrier absorbs the incoming force.' },
  { name: 'MEND AURA', type: 'HEAL', icon: '💚', strength: 68, color: '#65dda7', note: 'A green healing pulse restores a little health.' },
]
function shufflePowers(): Power[] {
  const pool = [...powerPool]
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  return pool.slice(0, 5)
}

export default function SuperheroClash({ onExit, onWin }: Props) {
  const [blueHero, setBlueHero] = useState(0)
  const [redHero, setRedHero] = useState(0)
  const [opponentMode, setOpponentMode] = useState<'human' | 'cpu'>('human')
  const [bluePlayerName, setBluePlayerName] = useState('NOVA')
  const [redPlayerName, setRedPlayerName] = useState('EMBER')
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<'select' | 'p1' | 'p2' | 'ready' | 'clash' | 'result' | 'finished'>('select')
  const [bluePowers, setBluePowers] = useState<Power[]>([])
  const [redPowers, setRedPowers] = useState<Power[]>([])
  const [bluePick, setBluePick] = useState<number | null>(null)
  const [redPick, setRedPick] = useState<number | null>(null)
  const [blueHealth, setBlueHealth] = useState(100)
  const [redHealth, setRedHealth] = useState(100)
  const [winner, setWinner] = useState<Side | null>(null)
  const [clashId, setClashId] = useState(0)
  const [impactSide, setImpactSide] = useState<Side | null>(null)
  const [dominantSide, setDominantSide] = useState<Side | null>(null)
  const [clashBeat, setClashBeat] = useState<'charge' | 'windup' | 'release' | 'collision' | 'breakthrough' | 'impact' | 'recovery'>('charge')
  const [impactDamage, setImpactDamage] = useState(0)
  const [comboLabel, setComboLabel] = useState('')
  const [comboHits, setComboHits] = useState(0)
  const timersRef = useRef<number[]>([])
  const clearCombatTimers = () => { timersRef.current.forEach(timer => window.clearTimeout(timer)); timersRef.current = [] }
  useEffect(() => () => clearCombatTimers(), [])
  const [blueReaction, setBlueReaction] = useState<'hurt' | 'stumble' | 'fall' | 'guard'>('guard')
  const [redReaction, setRedReaction] = useState<'hurt' | 'stumble' | 'fall' | 'guard'>('guard')

  const blue = blueHeroes[blueHero], red = redHeroes[redHero]
  const blueDisplayName = bluePlayerName.trim() || blue.name
  const redDisplayName = redPlayerName.trim() || (opponentMode === 'cpu' ? 'ARENA CPU' : red.name)
  const bluePower = bluePick === null ? null : bluePowers[bluePick]
  const redPower = redPick === null ? null : redPowers[redPick]
  const poseForPower = (power: Power | null) => {
    if (!power) return 'punch'
    if (power.type === 'SHIELD' || power.type === 'HEAL') return 'guard'
    if (['IMPACT', 'SPEED'].includes(power.type)) return 'kick'
    return 'cast'
  }
  const fighterImage = (side: Side, power: Power | null, reaction: string, isClashing: boolean) => {
    // One full-body action sprite per fighter. The sprite keeps the same frame
    // size; elemental effects are layered from the hands as separate effects.
    if (reaction === 'fall') return `/images/fighters/${side}-down.png`
    if (reaction === 'hurt' || reaction === 'stumble') return `/images/fighters/${side}-hurt.png`
    if (isClashing && power && !['SHIELD', 'HEAL'].includes(power.type)) {
      const action = ['IMPACT', 'SPEED'].includes(power.type) ? 'kick' : 'punch'
      return `/images/fighters/${side}-${action}.png`
    }
    return `/images/fighters/${side}-idle.png`
  }
  const begin = () => {
    clearCombatTimers(); setBlueHealth(100); setRedHealth(100); setRound(1); setWinner(null); setDominantSide(null); setImpactDamage(0); setComboLabel(''); setComboHits(0); setClashBeat('charge')
    setBluePowers(shufflePowers()); setRedPowers(shufflePowers()); setBluePick(null); setRedPick(null); setImpactSide(null); setBlueReaction('guard'); setRedReaction('guard'); setPhase('p1')
  }
  const choose = (side: Side, index: number) => {
    if (side === 'blue' && phase === 'p1') {
      setBluePick(index)
      if (opponentMode === 'cpu') {
        const cpuIndex = chooseCpuPowerIndex(redPowers, bluePowers[index])
        setRedPick(cpuIndex); setPhase('ready')
      } else setPhase('p2')
    }
    if (side === 'red' && phase === 'p2') { setRedPick(index); setPhase('ready') }
  }
  const resolve = () => {
    if (!bluePower || !redPower || phase !== 'ready') return
    clearCombatTimers()
    setPhase('clash')
    setClashId(v => v + 1)
    setClashBeat('charge')

    // The original power-strength contest is preserved, but each move now
    // resolves through its own attack profile, contact box, hit count and reaction.
    const blueCombatPower = { ...bluePower, strength: bluePower.strength + blue.bonus }
    const redCombatPower = { ...redPower, strength: redPower.strength + red.bonus }
    const exchange = resolveExchange(blueCombatPower, redCombatPower, blueHealth, redHealth)
    const attackPower = exchange.winner === 'blue' ? blueCombatPower : redCombatPower
    playPowerSound(attackPower.type, attackPower.strength)
    const winningSide: Side = exchange.winner
    const blueTakesHit = exchange.victim === 'blue' && exchange.damage > 0
    const redTakesHit = exchange.victim === 'red' && exchange.damage > 0
    const actualDamage = exchange.damage
    const nextBlue = exchange.blueHealth
    const nextRed = exchange.redHealth
    setComboLabel(exchange.comboLabel)
    setComboHits(exchange.hitCount)
    setDominantSide(winningSide)
    setImpactSide(exchange.victim)
    setImpactDamage(actualDamage)
    setBlueReaction('guard')
    setRedReaction('guard')

    // Preserve a consistent 3.6s cinematic exchange while each move keeps
    // its own startup / active / recovery timing proportions.
    const timing = exchange.profile
    const timingTotal = timing.startupMs + timing.activeMs + timing.recoveryMs
    const timingScale = 3600 / timingTotal
    const windupAt = Math.round(timing.startupMs * timingScale * .55)
    const releaseAt = Math.round(timing.startupMs * timingScale)
    const collisionAt = Math.round((timing.startupMs + timing.activeMs * .48) * timingScale)
    const breakthroughAt = Math.round((timing.startupMs + timing.activeMs * .76) * timingScale)
    const impactAt = Math.round((timing.startupMs + timing.activeMs) * timingScale)
    const recoveryAt = Math.round((timing.startupMs + timing.activeMs + timing.recoveryMs * .5) * timingScale)
    const victimReaction = timing.reaction === 'freeze' || timing.reaction === 'guard-break' ? 'stumble' : 'hurt'
    timersRef.current.push(window.setTimeout(() => setClashBeat('windup'), windupAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('release'), releaseAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('collision'), collisionAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('breakthrough'), breakthroughAt))
    timersRef.current.push(window.setTimeout(() => {
      setClashBeat('impact')
      setBlueHealth(nextBlue)
      setRedHealth(nextRed)
      setBlueReaction(blueTakesHit ? (nextBlue <= 0 ? 'fall' : victimReaction) : 'guard')
      setRedReaction(redTakesHit ? (nextRed <= 0 ? 'fall' : victimReaction) : 'guard')
    }, impactAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('recovery'), recoveryAt))
    timersRef.current.push(window.setTimeout(() => {
      if (nextBlue <= 0 || nextRed <= 0) {
        const winSide: Side = nextBlue > nextRed ? 'blue' : 'red'
        setWinner(winSide)
        setPhase('finished')
        onWin?.()
      } else setPhase('result')
    }, 3600))
  }
  const nextRound = () => {
    clearCombatTimers(); setDominantSide(null); setImpactDamage(0); setComboLabel(''); setComboHits(0); setClashBeat('charge')
    setRound(v => v + 1); setBluePowers(shufflePowers()); setRedPowers(shufflePowers()); setBluePick(null); setRedPick(null); setImpactSide(null); setBlueReaction('guard'); setRedReaction('guard'); setPhase('p1')
  }
  const reset = () => { clearCombatTimers(); setPhase('select'); setWinner(null); setImpactSide(null); setDominantSide(null); setImpactDamage(0); setComboLabel(''); setComboHits(0); setClashBeat('charge'); setBlueHealth(100); setRedHealth(100); setBluePick(null); setRedPick(null) }

  return <main className="gsh-screen gsh-real-game gsh-clean-clash" aria-label="Global Super Hero fighting game">
    <header className="gsh-back-row"><button onClick={onExit}><ArrowLeft size={17}/> EXIT ARENA</button><div className="gsh-brand"><Crown size={18}/> GLOBAL SUPER HERO</div><span className="gsh-round-tag">2 PLAYER · POWER CLASH</span></header>

    {phase === 'select' && <section className="gc-select">
      <div className="gc-kicker">THE ARENA IS READY</div><h1>CHOOSE YOUR CHAMPIONS</h1><p>Two heroes enter. Every round brings five new powers. Choose wisely.</p>
      <div className="gc-select-grid">
        <article className="gc-hero-card blue"><div className="gc-player-label">PLAYER 1</div><img src={blue.image} alt="Blue hero"/><h2>{blue.name}</h2><span>{blue.title} · {blue.passive}</span><label className="gc-name-field">PLAYER 1 NAME<input maxLength={18} value={bluePlayerName} onChange={e => setBluePlayerName(e.target.value)} placeholder="Enter player 1 name"/></label><div className="gc-hero-switch">{blueHeroes.map((h, i) => <button key={h.name} className={blueHero === i ? 'active' : ''} onClick={() => {setBlueHero(i);setBluePlayerName(h.name)}}>{h.name}</button>)}</div></article>
        <div className="gc-vs">VS</div>
        <article className="gc-hero-card red"><div className="gc-player-label">PLAYER 2</div><img src={red.image} alt="Red hero"/><h2>{red.name}</h2><span>{red.title} · {red.passive}</span><label className="gc-name-field">PLAYER 2 NAME<input maxLength={18} value={redPlayerName} onChange={e => setRedPlayerName(e.target.value)} placeholder="Enter player 2 name"/></label><div className="gc-hero-switch">{redHeroes.map((h, i) => <button key={h.name} className={redHero === i ? 'active' : ''} onClick={() => {setRedHero(i);setRedPlayerName(h.name)}}>{h.name}</button>)}</div><div className="gc-opponent-mode"><button className={opponentMode === 'human' ? 'active' : ''} onClick={() => setOpponentMode('human')}>2 PLAYERS</button><button className={opponentMode === 'cpu' ? 'active' : ''} onClick={() => setOpponentMode('cpu')}>VS CPU</button></div></article>
      </div>
      <button className="gc-primary" onClick={begin}>ENTER THE ARENA <Swords size={19}/></button>
    </section>}

    {phase !== 'select' && <section className="gc-game">
      <div className="gc-top-hud">
        <div className="gc-hud-side blue"><div><small>PLAYER 1</small><strong>{blueDisplayName}</strong></div><div className="gc-health"><i style={{ width: `${blueHealth}%` }}/></div><b>{blueHealth}%</b></div>
        <div className="gc-round"><small>ROUND</small><strong>{round.toString().padStart(2, '0')}</strong></div>
        <div className="gc-hud-side red"><div><small>PLAYER 2</small><strong>{redDisplayName}</strong></div><div className="gc-health"><i style={{ width: `${redHealth}%` }}/></div><b>{redHealth}%</b></div>
      </div>

      <div className={`gc-stage ${phase === 'clash' ? `is-clashing beat-${clashBeat} dominant-${dominantSide}` : ''} ${phase === 'result' ? `impact-${impactSide}` : ''} ${phase === 'finished' ? `is-finished winner-${winner}` : ''}`} key={clashId}>
        <div className="gc-arena-backdrop"><img src="/images/arena-background.png" alt="Grand championship arena"/><div className="gc-arena-vignette"/><div className="gc-floor-ring ring-one"/><div className="gc-floor-ring ring-two"/></div>
        {phase === 'clash' && <>
          {impactSide && <div className={`gc-hit-spark gc-hit-${impactSide}`} aria-hidden="true"/>}
          <div className={`gc-breakthrough ${dominantSide || 'blue'}`} aria-hidden="true" />
          <div className={`gc-target-burst ${impactSide || 'red'}`} aria-hidden="true" />
          <div className="gc-impact"><i/><b>{clashBeat === 'impact' ? 'DIRECT HIT' : 'CLASH'}</b><i/></div>
        </>}
        <div className={`gc-fighter blue ${phase === 'clash' ? `blue-attack pose-${poseForPower(bluePower)} ${clashBeat === 'impact' && impactSide === 'blue' ? 'blue-hurt' : ''} ${clashBeat === 'impact' && impactSide === 'blue' && blueHealth - impactDamage <= 0 ? 'blue-fall' : ''}` : phase === 'result' ? `blue-${blueReaction}` : phase === 'finished' ? (winner === 'blue' ? 'gc-champion-fighter' : 'blue-fall gc-defeated-fighter') : ''}`}>
          <img className="gc-base-pose" src={fighterImage('blue', bluePower, blueReaction, phase === 'clash')} alt={`${blueDisplayName} fighter action`} />
        </div>
        <div className={`gc-fighter red ${phase === 'clash' ? `red-attack pose-${poseForPower(redPower)} ${clashBeat === 'impact' && impactSide === 'red' ? 'red-hurt' : ''} ${clashBeat === 'impact' && impactSide === 'red' && redHealth - impactDamage <= 0 ? 'red-fall' : ''}` : phase === 'result' ? `red-${redReaction}` : phase === 'finished' ? (winner === 'red' ? 'gc-champion-fighter' : 'red-fall gc-defeated-fighter') : ''}`}>
          <img className="gc-base-pose" src={fighterImage('red', redPower, redReaction, phase === 'clash')} alt={`${redDisplayName} fighter action`} />
        </div>
        {phase === 'clash' && bluePower && redPower && dominantSide && impactSide && <LivePowerCanvas
          bluePower={bluePower} redPower={redPower} winningSide={dominantSide} impactSide={impactSide} beat={clashBeat} blueAccent={blue.accent} redAccent={red.accent}
        />}
        {phase === 'clash' && clashBeat === 'impact' && impactDamage > 0 && <div className={`gc-damage-number ${impactSide || 'red'}`}>−{impactDamage}<small>{comboLabel}{comboHits > 1 ? ` · ${comboHits} HITS` : ''}</small></div>}
        {phase === 'result' && <div className="gc-result-banner"><strong>ROUND COMPLETE</strong><span>CHOOSE AGAIN</span></div>}
      {phase === 'finished' && <div className={`gc-win-celebration gc-premium-victory ${winner || 'blue'}`} aria-live="assertive">
        <div className="gc-victory-dim"/>
        <div className="gc-victory-spotlight"/>
        <div className="gc-victory-rays"/>
        <div className="gc-victory-halo halo-outer"/><div className="gc-victory-halo halo-inner"/>
        <div className="gc-victory-orbit orbit-one"/><div className="gc-victory-orbit orbit-two"/>
        <div className="gc-victory-confetti confetti-a"/><div className="gc-victory-confetti confetti-b"/><div className="gc-victory-confetti confetti-c"/><div className="gc-victory-confetti confetti-d"/><div className="gc-victory-confetti confetti-e"/><div className="gc-victory-confetti confetti-f"/>
        <div className="gc-firework fw-one"/><div className="gc-firework fw-two"/><div className="gc-firework fw-three"/><div className="gc-firework fw-four"/><div className="gc-firework fw-five"/>
        <div className="gc-victory-content">
          <div className="gc-victory-overline"><i/> THE FINAL BLOW <i/></div>
          <div className="gc-victory-crest"><div className="gc-crest-ring"><Crown size={42} strokeWidth={1.7}/></div><span>★</span></div>
          <div className="gc-win-copy"><span>✦ VICTORY ✦</span><strong>{winner === 'blue' ? blueDisplayName : redDisplayName}</strong><b>ARENA CHAMPION</b></div>
          <div className="gc-victory-subtitle">THE ARENA HAS A NEW LEGEND</div>
          <div className="gc-victory-sparks"><i/><i/><i/><i/><i/><i/><i/></div>
        </div>
      </div>}
      </div>

      <div className="gc-turn-status">
        {phase === 'p1' && <><span className="gc-dot blue-dot"/> PLAYER 1 — CHOOSE A NUMBER</>}
        {phase === 'p2' && <><span className="gc-dot red-dot"/> PLAYER 2 — YOUR TURN. PLAYER 1'S PICK IS HIDDEN.</>}
        {phase === 'ready' && <><Sparkles size={16}/> BOTH POWERS LOCKED — READY TO REVEAL?</>}
        {phase === 'clash' && <><Zap size={16}/> POWER CHARGING — THE STRIKE IS COMING</>}
        {phase === 'result' && <><Shield size={16}/> ROUND COMPLETE — CHOOSE AGAIN</>}
        {phase === 'finished' && <><Crown size={16}/> BATTLE FINISHED</>}
      </div>

      {(phase === 'p1' || phase === 'p2' || phase === 'ready') && <div className="gc-pick-panels">
        <PowerPicker side="blue" powers={bluePowers} selected={phase === 'ready' ? bluePick : null} active={phase === 'p1'} locked={bluePick !== null} onChoose={i => choose('blue', i)} />
        <div className="gc-middle-action">
          <div className="gc-lock-state">{bluePick === null ? 'P1 WAITING' : 'P1 LOCKED'}<span>{redPick === null ? 'P2 WAITING' : 'P2 LOCKED'}</span></div>
          {phase === 'ready' && <button className="gc-primary gc-reveal" onClick={resolve}>ATTACK! <Swords size={18}/></button>}
          {phase !== 'ready' && <div className="gc-vs-mini">VS</div>}
        </div>
        <PowerPicker side="red" powers={redPowers} selected={phase === 'ready' ? redPick : null} active={phase === 'p2'} locked={redPick !== null} onChoose={i => choose('red', i)} />
      </div>}
      {(phase === 'clash' || phase === 'result' || phase === 'finished') && <div className="gc-reveal-row">
        <div className="gc-revealed blue"><small>{blueDisplayName}'S POWER</small><strong><em>{bluePower?.icon}</em>{bluePower?.name}</strong><span>{bluePower?.note}</span></div>
        <div className="gc-revealed red"><small>{redDisplayName}'S POWER</small><strong><em>{redPower?.icon}</em>{redPower?.name}</strong><span>{redPower?.note}</span></div>
      </div>}
      {phase === 'result' && <button className="gc-primary gc-next" onClick={nextRound}>NEXT ROUND <Zap size={18}/></button>}
      {phase === 'finished' && <div className="gc-finish-actions"><button className="gc-primary" onClick={reset}><RotateCcw size={17}/> NEXT FIGHT · EDIT PLAYERS</button></div>}
      <div className="gc-footnote">POWER SLOTS SHUFFLE EVERY ROUND <span>·</span> NO KEYBOARD REQUIRED <span>·</span> FIRST TO ZERO HEALTH LOSES</div>
    </section>}
  </main>
}

function PowerPicker({ side, powers, selected, active, locked, onChoose }: { side: Side; powers: Power[]; selected: number | null; active: boolean; locked: boolean; onChoose: (i: number) => void }) {
  const selectedProfile = selected !== null && powers[selected] ? getAttackProfile(powers[selected]) : null
  return <div className={`gc-picker ${side} ${active ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}>
    <div className="gc-picker-head"><strong>{side === 'blue' ? 'PLAYER 1' : 'PLAYER 2'}</strong><span>{locked ? 'POWER LOCKED' : active ? 'SELECT ONE POWER' : 'WAITING'}</span></div>
    <div className="gc-power-grid gc-number-grid">{powers.map((power, i) => <button key={`${power.name}-${i}`} aria-label={`Choose option ${i + 1}`} title={`Option ${i + 1}`} disabled={!active || locked} className={`gc-number-option ${selected === i ? 'chosen' : ''}`} onClick={() => onChoose(i)}><span className="gc-option-number">{i + 1}</span></button>)}</div>
    {selected !== null && powers[selected] && <div className={`gc-selected-power power-${powers[selected].type.toLowerCase()}`} style={{ '--selected-power': powers[selected].color } as CSSProperties}>
      <div className="gc-selected-power-heading"><span className="gc-selected-power-icon">{powers[selected].icon}</span><div className="gc-selected-power-copy"><small>OPTION {selected + 1} · {powers[selected].type} POWER</small><strong>{powers[selected].name}</strong></div><span className="gc-selected-check">✓</span></div>
      <p>{powers[selected].note}</p>
      <div className="gc-attack-form"><span className="gc-attack-form-label">ATTACK FORM</span><strong>{attackFormFor(powers[selected])}</strong><span className="gc-attack-form-hint">{attackFormHint(powers[selected])}</span></div>
      {selectedProfile && <div className="gc-move-stats"><span><b>{selectedProfile.startupMs}ms</b><small>STARTUP</small></span><span><b>{selectedProfile.activeMs}ms</b><small>ACTIVE</small></span><span><b>{selectedProfile.recoveryMs}ms</b><small>RECOVERY</small></span><span><b>{selectedProfile.hitCount}×</b><small>HITS</small></span></div>}
      {locked && <div className="gc-choice-confirm">POWER LOCKED · READY FOR THE CLASH</div>}
    </div>}
  </div>
}


function attackFormFor(power: Power): string {
  if (power.type === 'LIGHTNING') return 'LIGHTNING CAST · SPEAR RELEASE'
  if (power.type === 'FIRE') return 'FLAME CAST · INFERNO SURGE'
  if (power.type === 'ICE') return 'ICE CAST · CRYSTAL BURST'
  if (power.type === 'SHADOW') return 'VOID CAST · SHADOW CRUSH'
  if (power.type === 'SOLAR') return 'SOLAR CAST · RADIANT BLAST'
  if (power.type === 'WIND') return 'WIND CAST · PRESSURE WAVE'
  if (power.type === 'SHIELD') return 'DEFENSIVE STANCE · AEGIS FORM'
  if (power.type === 'IMPACT') return 'POWER STRIKE · METEOR FORM'
  if (power.type === 'PLASMA') return 'ENERGY CAST · PLASMA ORB'
  if (power.type === 'SPEED') return 'PHANTOM DASH · QUICK STRIKE'
  if (power.type === 'WATER') return 'WATER CAST · TIDAL SURGE'
  if (power.type === 'HEAL') return 'SUPPORT FORM · HEALING PULSE'
  return `${power.type} FORM · SPECIAL RELEASE`
}
function attackFormHint(power: Power): string {
  if (['SHIELD', 'HEAL'].includes(power.type)) return 'A defensive/support action with a dedicated visual effect'
  if (['IMPACT', 'SPEED'].includes(power.type)) return 'A close-range physical attack with a fast impact finish'
  return 'A signature energy attack with a distinct elemental release'
}

type LivePowerCanvasProps = {
  bluePower: Power
  redPower: Power
  winningSide: Side
  impactSide: Side
  beat: 'charge' | 'windup' | 'release' | 'collision' | 'breakthrough' | 'impact' | 'recovery'
  blueAccent: string
  redAccent: string
}

type LiveParticle = { x:number; y:number; vx:number; vy:number; life:number; max:number; size:number; hue:number; alpha:number }

function LivePowerCanvas({ bluePower, redPower, winningSide, impactSide, beat, blueAccent, redAccent }: LivePowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const valuesRef = useRef({ bluePower, redPower, winningSide, impactSide, beat, blueAccent, redAccent })
  valuesRef.current = { bluePower, redPower, winningSide, impactSide, beat, blueAccent, redAccent }

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = canvas?.parentElement
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !stage || !ctx) return
    let raf = 0
    let width = 0
    let height = 0
    let start = performance.now()
    let last = start
    const particles: LiveParticle[] = []
    // All 16 transparent VFX textures are preloaded at arena entry and reused by this renderer.
    const resize = () => {
      const rect = stage.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(stage)

    const rand = (min:number,max:number) => min + Math.random() * (max-min)
    const hexRgb = (hex:string) => {
      const raw = hex.replace('#','')
      const full = raw.length === 3 ? raw.split('').map(v=>v+v).join('') : raw
      const n = parseInt(full,16)
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }
    }
    const rgba = (hex:string,a:number) => {
      const c=hexRgb(hex)
      return `rgba(${c.r},${c.g},${c.b},${Math.max(0,Math.min(1,a))})`
    }
    const addBurst = (x:number,y:number,color:string,count:number,force:number) => {
      const hue = (() => { const c=hexRgb(color); return c.r>c.g && c.r>c.b ? 20 : c.b>c.r ? 205 : 145 })()
      for(let i=0;i<count && particles.length<520;i++){
        const angle=rand(0,Math.PI*2), speed=rand(force*.25,force)
        particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:rand(.35,.9),max:.9,size:rand(1.2,4.5),hue,alpha:rand(.5,1)})
      }
    }
    const drawOrb = (x:number,y:number,r:number,color:string,power:Power,t:number,alpha=1) => {
      if(r<=0) return
      ctx.save()
      ctx.globalAlpha=alpha
      const glow=ctx.createRadialGradient(x-r*.2,y-r*.2,r*.04,x,y,r*1.8)
      glow.addColorStop(0,rgba(color,.92))
      glow.addColorStop(.12,rgba(color,.98))
      glow.addColorStop(.42,rgba(color,.56))
      glow.addColorStop(1,rgba(color,0))
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*1.8,0,Math.PI*2);ctx.fill()
      ctx.shadowColor=color;ctx.shadowBlur=r*1.4
      ctx.fillStyle=rgba(color,.94);ctx.beginPath();ctx.arc(x,y,r*.62,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=0
      ctx.fillStyle=rgba(color,.72);ctx.beginPath();ctx.arc(x-r*.15,y-r*.17,r*.16,0,Math.PI*2);ctx.fill()
      ctx.strokeStyle=rgba(color,.9);ctx.lineWidth=Math.max(1,r*.07)
      ctx.beginPath();ctx.ellipse(x,y,r*1.1,r*.55,t*.9,0,Math.PI*2);ctx.stroke()
      // Individual live geometry gives each power family its own silhouette.
      if(power.type==='LIGHTNING'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,r*.12);ctx.beginPath()
        ctx.moveTo(x-r*.9,y);ctx.lineTo(x-r*.35,y-r*.55);ctx.lineTo(x-r*.05,y+r*.12);ctx.lineTo(x+r*.25,y-r*.45);ctx.lineTo(x+r*.8,y);ctx.stroke()
      } else if(power.type==='FIRE'){
        for(let k=0;k<3;k++){const a=t*2+k*2.1;ctx.fillStyle=rgba(k===1?'#fff1b0':color,.7);ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.35,y+Math.sin(a)*r*.35,r*.18,r*.58,a,0,Math.PI*2);ctx.fill()}
      } else if(power.type==='ICE'){
        ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(1,r*.08)
        for(let k=0;k<6;k++){const a=k*Math.PI/3+t*.25;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r*.95,y+Math.sin(a)*r*.95);ctx.stroke()}
      } else if(power.type==='WATER'){
        ctx.strokeStyle=rgba('#d8f7ff',.9);ctx.lineWidth=Math.max(2,r*.12);ctx.beginPath();ctx.ellipse(x,y,r*.95,r*.42,t*1.7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(x,y,r*.62,r*.26,-t*1.5,0,Math.PI*2);ctx.stroke()
      } else if(power.type==='SHADOW'){
        ctx.strokeStyle=rgba('#d7c0ff',.85);ctx.lineWidth=Math.max(2,r*.1);ctx.beginPath();ctx.arc(x,y,r*.8,t,t+Math.PI*1.5);ctx.stroke()
      } else if(power.type==='SOLAR'){
        ctx.strokeStyle='rgba(255,255,220,.95)';ctx.lineWidth=Math.max(1,r*.07)
        for(let k=0;k<12;k++){const a=k*Math.PI/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8);ctx.lineTo(x+Math.cos(a)*r*1.25,y+Math.sin(a)*r*1.25);ctx.stroke()}
      } else if(power.type==='PLASMA'){
        ctx.strokeStyle=rgba('#ffffff',.8);ctx.lineWidth=Math.max(1,r*.06);ctx.beginPath();ctx.arc(x,y,r*.72,t,t+Math.PI*1.6);ctx.stroke()
      } else if(power.type==='SHIELD'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,r*.09);ctx.beginPath()
        ctx.moveTo(x,y-r*.95);ctx.lineTo(x+r*.78,y-r*.55);ctx.lineTo(x+r*.66,y+r*.38);ctx.lineTo(x,y+r*.95);ctx.lineTo(x-r*.66,y+r*.38);ctx.lineTo(x-r*.78,y-r*.55);ctx.closePath();ctx.stroke()
        ctx.fillStyle=rgba(power.color,.18);ctx.fill()
      } else if(power.type==='HEAL'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(3,r*.18);ctx.lineCap='round'
        ctx.beginPath();ctx.moveTo(x-r*.45,y);ctx.lineTo(x+r*.45,y);ctx.moveTo(x,y-r*.45);ctx.lineTo(x,y+r*.45);ctx.stroke()
        ctx.strokeStyle=rgba(power.color,.8);ctx.lineWidth=Math.max(1,r*.07);ctx.beginPath();ctx.arc(x,y,r*1.15,-t,t+Math.PI*1.7);ctx.stroke()
      } else if(power.type==='WIND'){
        ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(2,r*.1)
        for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(x-r*.25,y+(k-1)*r*.28,r*.75,-.8+t*.25,.8+t*.25);ctx.stroke()}
      } else if(power.type==='IMPACT' || power.type==='SPEED'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,r*.1)
        for(let k=0;k<8;k++){const a=k*Math.PI/4+t;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25);ctx.lineTo(x+Math.cos(a)*r*1.15,y+Math.sin(a)*r*1.15);ctx.stroke()}
      } else {
        ctx.strokeStyle=rgba('#ffffff',.78);ctx.lineWidth=Math.max(1,r*.07);ctx.beginPath();ctx.arc(x,y,r*.8,-t,t+Math.PI);ctx.stroke()
      }
      ctx.restore()
    }
    const drawTrail = (x1:number,y1:number,x2:number,y2:number,color:string,power:Power,alpha:number) => {
      const dx=x2-x1,dy=y2-y1
      const grad=ctx.createLinearGradient(x1,y1,x2,y2)
      grad.addColorStop(0,rgba(color,0))
      grad.addColorStop(.45,rgba(color,.42*alpha))
      grad.addColorStop(1,rgba(color,.96*alpha))
      ctx.save()
      ctx.lineCap='round'
      ctx.strokeStyle=grad
      ctx.lineWidth=power.type==='WIND'?5:Math.max(4,width*.006)
      ctx.shadowColor=color;ctx.shadowBlur=22
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(x1+dx*.48,y1+dy*.48-8,x2,y2);ctx.stroke()
      ctx.shadowBlur=0
      ctx.strokeStyle=rgba(color,.4*alpha);ctx.lineWidth=Math.max(12,width*.018)
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()
      ctx.restore()
    }

    const drawAttack = (x:number,y:number,dir:number,power:Power,t:number,scale=1) => {
      const r=Math.max(12,width*.018)*scale
      ctx.save()
      ctx.translate(x,y);ctx.rotate(dir<0?Math.PI:0)
      ctx.globalCompositeOperation='source-over'
      ctx.shadowColor=power.color;ctx.shadowBlur=18*scale
      if(power.name==='TIDAL DRAGON'){
        // Large, unmistakable water-dragon projectile: long serpentine body,
        // swept horns, jaw, eye, whiskers and layered water mane.
        ctx.save()
        ctx.lineCap='round';ctx.lineJoin='round'
        const wave=Math.sin(t*5.2)*r*.16
        // Long coiling body behind the head
        for(let k=0;k<5;k++){
          const yy=(k-2)*r*.22
          ctx.strokeStyle=rgba(k%2?'#69ddff':'#087fc4',.88-k*.055)
          ctx.lineWidth=r*(.24-k*.018)
          ctx.beginPath()
          ctx.moveTo(-r*3.9,yy+wave)
          ctx.bezierCurveTo(-r*2.9,yy-r*1.15+Math.sin(t*3+k)*r*.22,-r*1.7,yy+r*1.15,r*.05,yy-r*.18)
          ctx.stroke()
        }
        // Dragon head silhouette facing travel direction
        const head=ctx.createLinearGradient(-r*1.4,-r*.8,r*2.2,r*.5)
        head.addColorStop(0,'#07558f');head.addColorStop(.38,'#087fc4');head.addColorStop(.72,'#25c4ed');head.addColorStop(1,'#8cecff')
        ctx.fillStyle=head;ctx.beginPath()
        ctx.moveTo(-r*1.65,-r*.45);ctx.quadraticCurveTo(-r*.8,-r*1.35,r*.15,-r*.82)
        ctx.lineTo(r*.8,-r*1.05);ctx.lineTo(r*1.45,-r*.62)
        ctx.lineTo(r*2.25,-r*.12);ctx.lineTo(r*1.55,r*.16)
        ctx.quadraticCurveTo(r*.85,r*.92,-r*.05,r*.65)
        ctx.lineTo(-r*.85,r*.95);ctx.lineTo(-r*1.45,r*.42);ctx.closePath();ctx.fill()
        // Horns, crest and fins
        ctx.fillStyle='#38c9f2'
        ctx.beginPath();ctx.moveTo(-r*.75,-r*.48);ctx.lineTo(-r*1.45,-r*1.62);ctx.lineTo(-r*.15,-r*.9);ctx.closePath();ctx.fill()
        ctx.beginPath();ctx.moveTo(r*.05,-r*.65);ctx.lineTo(r*.45,-r*1.55);ctx.lineTo(r*.72,-r*.48);ctx.closePath();ctx.fill()
        ctx.fillStyle='#36b9ec'
        for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(-r*(1.0-k*.15),r*.22+k*r*.12);ctx.lineTo(-r*(1.75-k*.12),r*(.72+k*.18));ctx.lineTo(-r*(.45-k*.08),r*(.48+k*.12));ctx.closePath();ctx.fill()}
        // Eye, nostril and jaw highlight
        ctx.fillStyle='#073c69';ctx.beginPath();ctx.arc(r*.95,-r*.36,r*.105,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(r*.98,-r*.39,r*.035,0,Math.PI*2);ctx.fill()
        ctx.strokeStyle='rgba(190,246,255,.92)';ctx.lineWidth=Math.max(2,r*.045)
        ctx.beginPath();ctx.moveTo(r*.55,r*.24);ctx.quadraticCurveTo(r*1.25,r*.58,r*1.92,r*.18)
        ctx.moveTo(-r*.55,r*.28);ctx.quadraticCurveTo(-r*1.65,r*1.05,-r*2.55,r*.55)
        ctx.moveTo(-r*.5,-r*.25);ctx.quadraticCurveTo(-r*1.55,-r*1.0,-r*2.35,-r*.65);ctx.stroke()
        // Scale glints
        for(let k=0;k<8;k++){const xx=-r*1.1+k*r*.25;ctx.fillStyle='rgba(190,246,255,.72)';ctx.beginPath();ctx.arc(xx,Math.sin(k*1.8+t*3)*r*.2,r*.045,0,Math.PI*2);ctx.fill()}
        ctx.restore()
      } else if(power.name==='METEOR KICK'){
        // A flaming meteor-shaped kick projectile; deliberately not an arrow/beam.
        ctx.save()
        ctx.lineCap='round'
        for(let k=0;k<9;k++){
          const a=(k/9)*Math.PI*2+t*1.7
          const len=r*(1.55+(k%3)*.28)
          ctx.strokeStyle=rgba(k%2?'#ffb15e':'#ff4a20',.78)
          ctx.lineWidth=r*(.12+(k%2)*.035)
          ctx.beginPath()
          ctx.moveTo(-r*.35+Math.cos(a)*r*.25,Math.sin(a)*r*.25)
          ctx.quadraticCurveTo(-len*.65,Math.sin(a)*len*.9, -len,Math.cos(a)*len*.45)
          ctx.stroke()
        }
        const meteor=ctx.createRadialGradient(-r*.2,-r*.15,r*.08,0,0,r*1.35)
        meteor.addColorStop(0,'#fff0c4');meteor.addColorStop(.18,'#ffd16a')
        meteor.addColorStop(.43,'#ffb044');meteor.addColorStop(.72,'#ff5425');meteor.addColorStop(1,'rgba(255,65,20,0)')
        ctx.fillStyle=meteor;ctx.beginPath();ctx.ellipse(0,0,r*1.2,r*.72,-.12,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#ffbd55';ctx.beginPath();ctx.ellipse(r*.15,-r*.04,r*.63,r*.29,-.12,0,Math.PI*2);ctx.fill()
        // Chunky burning fragments orbit the meteor
        for(let k=0;k<7;k++){const a=t*2.3+k*Math.PI*2/7;ctx.fillStyle=k%2?'#ff6b2e':'#ffe6a0';ctx.beginPath();ctx.arc(Math.cos(a)*r*(1.1+(k%3)*.16),Math.sin(a)*r*.72, r*(.07+(k%2)*.035),0,Math.PI*2);ctx.fill()}
        ctx.restore()
      } else if(power.name==='PHOENIX ROAR'){
        for(let k=0;k<5;k++){const yy=(k-2)*r*.34;ctx.fillStyle=rgba(k%2?'#ff7a26':'#ffe8a0',.82);ctx.beginPath();ctx.moveTo(-r*1.2,yy);ctx.quadraticCurveTo(-r*.2,yy-r*(1.2+k*.08),r*1.1,yy-r*.15);ctx.quadraticCurveTo(r*.3,yy+r*.65,-r*1.2,yy);ctx.fill()}
        ctx.fillStyle='#fff5d4';ctx.beginPath();ctx.ellipse(r*.45,0,r*.75,r*.23,0,0,Math.PI*2);ctx.fill()
      } else if(power.name==='FROST NOVA'){
        for(let k=0;k<14;k++){const a=k*Math.PI/7+t*.4;ctx.save();ctx.rotate(a);ctx.fillStyle=k%2?'rgba(130,226,255,.8)':'rgba(255,255,255,.95)';ctx.beginPath();ctx.moveTo(r*.35,-r*.12);ctx.lineTo(r*2.1,0);ctx.lineTo(r*.35,r*.12);ctx.closePath();ctx.fill();ctx.restore()}
        ctx.strokeStyle='rgba(225,252,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.1,t,t+Math.PI*1.8);ctx.stroke()
      } else if(power.name==='OCEAN SPIRAL'){
        // A readable rotating water vortex: deep-blue core, cyan spiral bands and spray.
        const vortex=ctx.createRadialGradient(0,0,r*.08,0,0,r*1.65)
        vortex.addColorStop(0,'#063d75');vortex.addColorStop(.28,'#087fc4');vortex.addColorStop(.62,'#20bde9');vortex.addColorStop(1,'rgba(35,190,238,0)')
        ctx.fillStyle=vortex;ctx.beginPath();ctx.arc(0,0,r*1.65,0,Math.PI*2);ctx.fill()
        for(let k=0;k<5;k++){
          ctx.save();ctx.rotate(t*(k%2?1.25:-.92)+k*.72)
          ctx.strokeStyle=rgba(k%2?'#39d6ff':'#087fc4',.92-k*.09);ctx.lineWidth=r*(.10-k*.009);ctx.lineCap='round'
          ctx.beginPath();ctx.ellipse(0,0,r*(.48+k*.22),r*(.22+k*.07),-.24,-Math.PI*.15,Math.PI*1.55);ctx.stroke()
          ctx.restore()
        }
        ctx.fillStyle='#07558f';ctx.beginPath();ctx.arc(r*.12,0,r*.34,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='rgba(178,245,255,.9)';ctx.beginPath();ctx.arc(r*.22,-r*.1,r*.09,0,Math.PI*2);ctx.fill()
        for(let k=0;k<9;k++){const a=t*1.7+k*Math.PI*2/9;ctx.fillStyle=rgba('#66e5ff',.82);ctx.beginPath();ctx.arc(Math.cos(a)*r*(1.05+(k%3)*.13),Math.sin(a)*r*(.62+(k%2)*.1),r*.055,0,Math.PI*2);ctx.fill()}
      } else if(power.type==='FIRE'){
        // A pointed, layered flame mass with a turbulent tail, not a glowing line.
        for(let k=0;k<7;k++){
          const wobble=Math.sin(t*15+k*1.7)*r*.22
          const len=r*(1.3+k*.22)
          ctx.fillStyle=rgba(k%3===0?'#fff1bb':k%3===1?power.color:'#ff3b16',.72-k*.055)
          ctx.beginPath();ctx.moveTo(-r*1.3,wobble)
          ctx.bezierCurveTo(-len*.45,-r*(.7+k*.12),len*.15,-r*(.55+k*.1),len,0)
          ctx.bezierCurveTo(len*.15,r*(.55+k*.1),-len*.45,r*(.7+k*.12),-r*1.3,wobble);ctx.fill()
        }
        ctx.fillStyle='rgba(255,255,230,.96)';ctx.beginPath();ctx.ellipse(r*.25,0,r*.72,r*.24,0,0,Math.PI*2);ctx.fill()
      } else if(power.type==='LIGHTNING'){
        for(let branch=0;branch<5;branch++){
          const off=(branch-2)*r*.32
          ctx.strokeStyle=branch%2?'#bceeff':'#ffffff';ctx.lineWidth=branch===2?4:2.2
          ctx.beginPath();ctx.moveTo(-r*1.6,off*.3)
          ctx.lineTo(-r*.75,off-r*.3);ctx.lineTo(-r*.2,off+r*.22);ctx.lineTo(r*.45,off-r*.4);ctx.lineTo(r*1.8,off*.15)
          ctx.stroke()
        }
        ctx.fillStyle='rgba(190,245,255,.95)';ctx.beginPath();ctx.arc(0,0,r*.3,0,Math.PI*2);ctx.fill()
      } else if(power.type==='ICE'){
        for(let k=0;k<4;k++){
          const off=(k-1.5)*r*.45
          ctx.fillStyle=k%2?'rgba(140,231,255,.8)':'rgba(255,255,255,.95)'
          ctx.beginPath();ctx.moveTo(-r*.9,off);ctx.lineTo(r*(1.5+k*.16),off-r*.18);ctx.lineTo(r*.35,off+r*.2);ctx.closePath();ctx.fill()
        }
        ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r*1.9,0);ctx.stroke()
      } else if(power.type==='WATER'){
        for(let k=0;k<5;k++){
          const off=(k-2)*r*.25
          ctx.strokeStyle=rgba(k%2?'#e4fbff':power.color,.75);ctx.lineWidth=r*.24
          ctx.beginPath();ctx.moveTo(-r*2,off+Math.sin(t*5+k)*r*.2)
          ctx.bezierCurveTo(-r,off-r*.9,r*.2,off+r*.9,r*2.2,off+Math.sin(t*4+k)*r*.2);ctx.stroke()
        }
        const waterCore=ctx.createRadialGradient(r*.12,-r*.08,r*.04,r*.12,0,r*.92);waterCore.addColorStop(0,'rgba(224,250,255,.72)');waterCore.addColorStop(.28,'rgba(51,198,242,.92)');waterCore.addColorStop(1,'rgba(5,91,157,.08)');ctx.fillStyle=waterCore;ctx.beginPath();ctx.ellipse(r*.25,0,r*.78,r*.42,0,0,Math.PI*2);ctx.fill()
      } else if(power.type==='PLASMA'){
        // Dense plasma nucleus with rotating ion bands and a hot white centre.
        const plasma=ctx.createRadialGradient(-r*.18,-r*.12,1,0,0,r*2.05)
        plasma.addColorStop(0,'#ffffff');plasma.addColorStop(.13,'#e9f4ff')
        plasma.addColorStop(.34,rgba(power.color,.98));plasma.addColorStop(.72,rgba(power.color,.55));plasma.addColorStop(1,rgba(power.color,0))
        ctx.fillStyle=plasma;ctx.beginPath();ctx.arc(0,0,r*2.05,0,Math.PI*2);ctx.fill()
        for(let k=0;k<4;k++){
          ctx.save();ctx.rotate(t*(k%2?1.6:-1.25)+k*Math.PI/4)
          ctx.strokeStyle=rgba(k%2?'#ffffff':'#b9d9ff',.9-k*.12);ctx.lineWidth=3+k
          ctx.beginPath();ctx.ellipse(0,0,r*(1.1+k*.16),r*(.35+k*.08),0,-Math.PI*.78,Math.PI*.78);ctx.stroke()
          ctx.restore()
        }
        for(let k=0;k<7;k++){const a=t*2+k*Math.PI*2/7;ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(Math.cos(a)*r*1.45,Math.sin(a)*r*.72,2.2,0,Math.PI*2);ctx.fill()}
      } else if(power.type==='SHADOW'){
        ctx.rotate(t*2)
        const g=ctx.createRadialGradient(0,0,2,0,0,r*2.1);g.addColorStop(0,'#080512');g.addColorStop(.35,rgba(power.color,.95));g.addColorStop(1,rgba(power.color,0))
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*2,0,Math.PI*2);ctx.fill()
        for(let k=0;k<3;k++){ctx.strokeStyle=rgba('#e3d4ff',.9-k*.2);ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*(.55+k*.38),t+k,t+k+Math.PI*1.35);ctx.stroke()}
      } else if(power.type==='SOLAR'){
        const g=ctx.createRadialGradient(0,0,1,0,0,r*2.2);g.addColorStop(0,'#fff');g.addColorStop(.25,'#fff2ae');g.addColorStop(.55,power.color);g.addColorStop(1,rgba(power.color,0))
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*2.2,0,Math.PI*2);ctx.fill()
        for(let k=0;k<18;k++){const a=k*Math.PI/9+t*.7;ctx.strokeStyle='rgba(255,246,190,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);ctx.lineTo(Math.cos(a)*r*(1.5+(k%3)*.3),Math.sin(a)*r*(1.5+(k%3)*.3));ctx.stroke()}
      } else if(power.type==='SHIELD'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=5;ctx.beginPath()
        ctx.moveTo(r*1.5,0);ctx.lineTo(r*.65,-r*.9);ctx.lineTo(-r*.7,-r*.8);ctx.lineTo(-r*1.35,0);ctx.lineTo(-r*.65,r*.85);ctx.lineTo(r*.65,r*.85);ctx.closePath();ctx.stroke()
        ctx.fillStyle=rgba(power.color,.3);ctx.fill()
        ctx.strokeStyle=rgba('#ffffff',.8);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.7,t,t+Math.PI*1.3);ctx.stroke()
      } else if(power.type==='HEAL'){
        ctx.strokeStyle='rgba(240,255,248,.98)';ctx.lineWidth=6;ctx.lineCap='round'
        ctx.beginPath();ctx.moveTo(-r*.55,0);ctx.lineTo(r*.55,0);ctx.moveTo(0,-r*.55);ctx.lineTo(0,r*.55);ctx.stroke()
        ctx.strokeStyle=rgba(power.color,.9);ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.45,t,t+Math.PI*1.65);ctx.stroke()
        for(let k=0;k<6;k++){const a=k*Math.PI/3+t;ctx.fillStyle=rgba('#b8ffda',.85);ctx.beginPath();ctx.arc(Math.cos(a)*r*1.9,Math.sin(a)*r*1.9,3,0,Math.PI*2);ctx.fill()}
      } else if(power.type==='WIND'){
        for(let k=0;k<4;k++){ctx.strokeStyle=rgba('#eaffff',.8-k*.12);ctx.lineWidth=3+k;ctx.beginPath();ctx.moveTo(-r*2,-r*.5+k*r*.32);ctx.bezierCurveTo(-r*.2,-r*1.2+k*r*.32,r*.3,r*1.2+k*r*.32,r*2.2,-r*.1+k*r*.32);ctx.stroke()}
      } else if(power.type==='IMPACT' || power.type==='SPEED'){
        ctx.fillStyle=rgba(power.color,.35);ctx.beginPath();ctx.ellipse(0,0,r*2.2,r*.9,0,0,Math.PI*2);ctx.fill()
        for(let k=0;k<9;k++){const yy=(k-4)*r*.24;ctx.strokeStyle=k%2?'#fff':power.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-r*2,yy);ctx.lineTo(r*(1.4+(k%3)*.25),yy*.35);ctx.stroke()}
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(r*.45,0,r*.25,0,Math.PI*2);ctx.fill()
      } else {
        const g=ctx.createRadialGradient(-r*.2,-r*.2,1,0,0,r*1.7);g.addColorStop(0,'#fff');g.addColorStop(.2,power.color);g.addColorStop(1,rgba(power.color,0))
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.7,0,Math.PI*2);ctx.fill()
        ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*1.5,r*.6,t,0,Math.PI*2);ctx.stroke()
      }
      ctx.restore()
    }
    const drawPowerWake = (x1:number,y1:number,x2:number,y2:number,power:Power,t:number) => {
      const dx=x2-x1,dy=y2-y1,dir=dx>=0?1:-1
      // Contrast rail: a restrained navy edge keeps every coloured power readable
      // against the user's bright original arena without changing the background.
      ctx.save()
      ctx.globalCompositeOperation='source-over'
      ctx.lineCap='round'
      ctx.strokeStyle='rgba(3,25,54,.34)'
      ctx.lineWidth=Math.max(10,width*.024)
      ctx.shadowColor='rgba(2,18,42,.24)'
      ctx.shadowBlur=9
      ctx.beginPath()
      ctx.moveTo(x1,y1)
      ctx.quadraticCurveTo(x1+dx*.5,y1+dy*.5+Math.sin(t*4)*8,x2,y2)
      ctx.stroke()
      ctx.restore()
      if(power.name==='TIDAL DRAGON'){
        // Broad, readable water wake with multiple rolling ribbons and bubbles.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<7;k++){
          const offset=(k-3)*7
          ctx.strokeStyle=rgba(k%2?'#38cfff':'#087fc4',.78-k*.055)
          ctx.lineWidth=8+(k%3)*3
          ctx.shadowColor='#24bfff';ctx.shadowBlur=10
          ctx.beginPath();ctx.moveTo(x1,y1+offset)
          ctx.bezierCurveTo(x1+dx*.24,y1+dy*.24+Math.sin(t*5+k)*24+offset,
            x1+dx*.72,y1+dy*.72+Math.cos(t*4+k)*22-offset*.5,x2,y2+offset*.35)
          ctx.stroke()
        }
        for(let k=0;k<9;k++){const q=(k+1)/10;const bx=x1+dx*q,by=y1+dy*q+Math.sin(t*4+k)*15;ctx.fillStyle='rgba(88,218,255,.92)';ctx.beginPath();ctx.arc(bx,by,2+(k%3),0,Math.PI*2);ctx.fill()}
        ctx.restore()
      } else if(power.name==='METEOR KICK'){
        // Fiery comet wake with turbulent tongues, sparks and a smoky core.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<8;k++){
          const off=(k-3.5)*5, wave=Math.sin(t*12+k*1.6)*17
          ctx.strokeStyle=rgba(k%2?'#ffe8ad':'#ff5727',.78-k*.055)
          ctx.lineWidth=5+(k%3)*3;ctx.shadowColor='#ff5a20';ctx.shadowBlur=18
          ctx.beginPath();ctx.moveTo(x1,y1+off)
          ctx.bezierCurveTo(x1+dx*.28,y1+dy*.28+wave+off,
            x1+dx*.72,y1+dy*.72-wave*.6+off*.5,x2,y2+off*.25)
          ctx.stroke()
        }
        for(let k=0;k<4;k++){const q=(k+1)/5;addBurst(x1+dx*q,y1+dy*q+rand(-9,9),'#ff8a32',2,45)}
        ctx.restore()
      } else if(power.type==='FIRE'){
        // Ember drift and heat shimmer trail; the detailed flame texture is the projectile body.
        for(let k=0;k<4;k++){
          const q=(k+1)/5, x=x1+dx*q, y=y1+dy*q+Math.sin(t*10+k*1.7)*9
          ctx.save();ctx.globalAlpha=.16+q*.2;ctx.fillStyle='#ff9a4a';ctx.shadowColor='#ff6b28';ctx.shadowBlur=16
          ctx.beginPath();ctx.ellipse(x,y,5+q*4,2+q*2,Math.atan2(dy,dx),0,Math.PI*2);ctx.fill();ctx.restore()
        }
        if(Math.random()<.7) addBurst(x2,y2,power.color,2,58)
      } else if(power.type==='LIGHTNING'){
        ctx.save();ctx.strokeStyle=rgba('#b9edff',.9);ctx.lineWidth=2.5;ctx.shadowColor=power.color;ctx.shadowBlur=14
        for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(x1,y1+(k-1.5)*5);let x=x1,y=y1+(k-1.5)*5
          for(let n=1;n<=8;n++){x=x1+dx*n/8;y=y1+dy*n/8+Math.sin(t*17+n*2+k)*11;ctx.lineTo(x,y)}ctx.stroke()}
        ctx.restore()
      } else if(power.type==='WATER'){
        ctx.save();ctx.lineCap='round'
        for(let k=0;k<4;k++){ctx.strokeStyle=rgba(k%2?'#4bd8ff':power.color,.78);ctx.lineWidth=7+k*2;ctx.beginPath();ctx.moveTo(x1,y1+(k-1.5)*7);ctx.bezierCurveTo(x1+dx*.3,y1+dy*.3+Math.sin(t*5+k)*28,x1+dx*.7,y1+dy*.7+Math.cos(t*5+k)*28,x2,y2+(k-1.5)*5);ctx.stroke()}
        ctx.restore()
      } else if(power.type==='ICE'){
        ctx.save();ctx.strokeStyle=rgba('#dffaff',.8);ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.lineDashOffset=-t*45;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()
      } else if(power.type==='SHADOW'){
        ctx.save();ctx.strokeStyle=rgba(power.color,.45);ctx.lineWidth=width*.035;ctx.shadowColor=power.color;ctx.shadowBlur=24;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,(y1+y2)/2+Math.sin(t*3)*30,x2,y2);ctx.stroke();ctx.restore()
      } else if(power.type==='SOLAR'){
        // A broad, layered solar stream with visible rays and a hot travelling centre.
        ctx.save();ctx.lineCap='round';ctx.globalCompositeOperation='source-over'
        const grad=ctx.createLinearGradient(x1,y1,x2,y2);grad.addColorStop(0,rgba(power.color,0));grad.addColorStop(.48,rgba(power.color,.2));grad.addColorStop(1,'rgba(255,255,230,.95)')
        for(let k=0;k<5;k++){ctx.strokeStyle=k===2?grad:rgba(k%2?'#fff4bd':power.color,.42);ctx.lineWidth=k===2?width*.055:width*(.012+k*.002);ctx.shadowColor=power.color;ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(x1,y1+(k-2)*5);ctx.bezierCurveTo(x1+dx*.32,y1+dy*.32+Math.sin(t*7+k)*18,x1+dx*.7,y1+dy*.7+Math.cos(t*6+k)*16,x2,y2+(k-2)*3);ctx.stroke()}
        ctx.restore()
      } else if(power.type==='PLASMA'){
        // Plasma has a wide ion wake, not a thin straight beam.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<6;k++){const wave=Math.sin(t*10+k*1.35)*12;ctx.strokeStyle=rgba(k%2?'#ffffff':power.color,.68-k*.07);ctx.lineWidth=width*(k===2?.024:.009);ctx.shadowColor=power.color;ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(x1,y1+(k-2.5)*7);ctx.bezierCurveTo(x1+dx*.28,y1+dy*.28+wave,x1+dx*.72,y1+dy*.72-wave*.65,x2,y2+(k-2.5)*5);ctx.stroke()}
        ctx.restore()
      } else if(power.type==='SHADOW'){
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<4;k++){ctx.strokeStyle=rgba(k%2?'#e8d8ff':power.color,.38);ctx.lineWidth=width*(.018+k*.004);ctx.shadowColor=power.color;ctx.shadowBlur=25;ctx.beginPath();ctx.moveTo(x1,y1+(k-1.5)*9);ctx.bezierCurveTo(x1+dx*.25,y1+dy*.25+Math.sin(t*5+k)*25,x1+dx*.72,y1+dy*.72+Math.cos(t*5+k)*22,x2,y2);ctx.stroke()}
        ctx.restore()
      } else {
        // Every remaining power gets a visible tapered, multi-strand wake.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        const grad=ctx.createLinearGradient(x1,y1,x2,y2);grad.addColorStop(0,rgba(power.color,0));grad.addColorStop(.55,rgba(power.color,.24));grad.addColorStop(1,rgba(power.color,.92))
        for(let k=0;k<5;k++){ctx.strokeStyle=k===2?grad:rgba(power.color,.38-k*.045);ctx.lineWidth=width*(k===2?.045:.009);ctx.shadowColor=power.color;ctx.shadowBlur=17;ctx.beginPath();ctx.moveTo(x1,y1+(k-2)*7);ctx.quadraticCurveTo(x1+dx*.52,y1+dy*.52+Math.sin(t*8+k)*17,x2,y2+(k-2)*4);ctx.stroke()}
        ctx.restore()
        if(Math.random()<.8) addBurst(x2,y2,power.color,3,58)
      }
    }

    // Procedural-only power renderer. No PNG/SVG power artwork is loaded or drawn.
    // Each frame draws the live attack silhouette, its internal animation and its glow.
    const drawProceduralPower = (x:number,y:number,dir:number,power:Power,t:number,scale=1,alpha=1) => {
      ctx.save()
      ctx.globalAlpha = alpha
      drawAttack(x,y,dir,power,t,scale)
      ctx.restore()
    }

    const drawImpact = (x:number,y:number,power:Power,t:number) => {
      const progress=Math.min(1,t)
      const radius=14+progress*width*.155
      ctx.save();ctx.globalAlpha=1-progress
      const g=ctx.createRadialGradient(x,y,1,x,y,radius)
      g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,rgba(power.color,.95));g.addColorStop(1,rgba(power.color,0))
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill()
      for(let ring=0;ring<5;ring++){ctx.strokeStyle=rgba(ring%2===0?'#ffffff':power.color,1-progress);ctx.lineWidth=ring===0?6:3;ctx.beginPath();ctx.arc(x,y,radius*(.32+ring*.17),0,Math.PI*2);ctx.stroke()}
      ctx.strokeStyle=rgba('#ffffff',.72*(1-progress));ctx.lineWidth=2;for(let ray=0;ray<18;ray++){const a=ray*Math.PI/9;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*radius*.25,y+Math.sin(a)*radius*.25);ctx.lineTo(x+Math.cos(a)*radius*1.18,y+Math.sin(a)*radius*1.18);ctx.stroke()}
      ctx.restore()
    }

    const drawAnimeFighter = (x:number, floorY:number, side:Side, beatName:string, t:number, isWinner:boolean, isVictim:boolean, accent:string) => {
      const dir = side === 'blue' ? 1 : -1
      const scale = Math.min(1.8, Math.max(1.2, height / 360))
      const phase = beatName
      const bob = Math.sin(t * 5.4 + (side === 'red' ? 1.2 : 0)) * 2.4
      let lean = 0, arm = -.25, leg = .12, crouch = 0
      if (phase === 'charge' || phase === 'windup') { crouch = 7; arm = phase === 'charge' ? -.95 : -1.3; lean = -.12 }
      if (phase === 'release' || phase === 'breakthrough') { lean = isWinner ? .52 : -.2; arm = isWinner ? 1.35 : -.8; leg = isWinner ? .9 : -.1; crouch = -2 }
      if (phase === 'collision') { crouch = 4; arm = .9; lean = .12 }
      if (phase === 'impact' && isVictim) { lean = -.72; arm = -1.8; leg = -.8; crouch = -3 }
      if (phase === 'recovery') { lean = 0; arm = -.15; leg = 0; crouch = 0 }
      ctx.save(); ctx.translate(x, floorY + bob); ctx.scale(dir * scale, scale)
      // Aura silhouette and ground shadow.
      ctx.globalAlpha = .2 + Math.sin(t * 7) * .045
      ctx.fillStyle = side === 'blue' ? '#54caff' : '#ff785f'
      ctx.beginPath(); ctx.ellipse(0, -94, 43 + Math.sin(t * 4) * 4, 103, 0, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(17,42,65,.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 49, 8, 0, 0, Math.PI*2); ctx.fill()
      ctx.translate(0, -crouch)
      ctx.rotate(lean)
      const main = side === 'blue' ? '#1978bd' : '#c64c42'
      const light = accent
      const dark = side === 'blue' ? '#123c70' : '#692e45'
      const stroke = (x1:number,y1:number,x2:number,y2:number,w:number,color:string) => { ctx.strokeStyle=color; ctx.lineWidth=w; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke() }
      // Back leg and boot.
      stroke(-7, -48, -17 + Math.sin(t*5)*3, -23, 13, dark)
      stroke(-17 + Math.sin(t*5)*3, -23, -22, -5, 11, main)
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-32,-8,22,9,4); ctx.fill()
      // Front leg animates into the kick frame.
      const kneeX = 12 + Math.sin(leg) * 13
      stroke(8,-48,kneeX,-27,14,main)
      stroke(kneeX,-27,kneeX+Math.cos(leg)*15,-7,11,dark)
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(kneeX+4,-10,23,9,4); ctx.fill()
      // Torso armour, waist and shoulder plates.
      const torso = ctx.createLinearGradient(-22,-112,24,-50); torso.addColorStop(0,light); torso.addColorStop(.42,main); torso.addColorStop(1,dark)
      ctx.fillStyle=torso; ctx.beginPath(); ctx.moveTo(-19,-111);ctx.lineTo(18,-111);ctx.lineTo(24,-67);ctx.lineTo(11,-48);ctx.lineTo(-13,-48);ctx.lineTo(-24,-70);ctx.closePath();ctx.fill()
      ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-105);ctx.lineTo(1,-78);ctx.lineTo(13,-105);ctx.stroke()
      ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(-23,-106);ctx.lineTo(-34,-96);ctx.lineTo(-24,-78);ctx.lineTo(-12,-91);ctx.closePath();ctx.fill()
      // Rear arm and front attacking arm.
      stroke(-19,-101,-31,-83,11,dark); stroke(-31,-83,-36,-68,9,main)
      const shoulderX=17, shoulderY=-99
      const elbowX=shoulderX+Math.cos(arm)*20, elbowY=shoulderY+Math.sin(arm)*20
      stroke(shoulderX,shoulderY,elbowX,elbowY,13,main)
      stroke(elbowX,elbowY,elbowX+Math.cos(arm+.25)*20,elbowY+Math.sin(arm+.25)*20,10,light)
      ctx.fillStyle='#f1f7ff';ctx.beginPath();ctx.arc(elbowX+Math.cos(arm+.25)*20,elbowY+Math.sin(arm+.25)*20,6,0,Math.PI*2);ctx.fill()
      // Neck, face, eyes and stylized hair crest.
      ctx.fillStyle='#e5b89e';ctx.fillRect(-6,-124,13,15)
      ctx.fillStyle='#f2c9ad';ctx.beginPath();ctx.ellipse(0,-139,17,20,0,0,Math.PI*2);ctx.fill()
      ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-17,-143);ctx.lineTo(-20,-164);ctx.lineTo(-7,-155);ctx.lineTo(0,-174);ctx.lineTo(8,-155);ctx.lineTo(20,-163);ctx.lineTo(15,-137);ctx.closePath();ctx.fill()
      ctx.fillStyle='#102d4c';ctx.fillRect(4,-142,8,3)
      ctx.fillStyle='#fff';ctx.fillRect(8,-142,3,2)
      // Waist sash and energy trim.
      ctx.fillStyle=light;ctx.fillRect(-15,-61,30,5);ctx.fillStyle=dark;ctx.fillRect(-7,-60,14,4)
      ctx.restore()
    }

    const frame=(now:number)=>{
      const dt=Math.min(.04,(now-last)/1000);last=now
      const elapsed=(now-start)/1000
      ctx.clearRect(0,0,width,height)
      const midX=width*.5, midY=height*.355
      const blueStart={x:width*.355,y:height*.325}
      const redStart={x:width*.645,y:height*.325}
      // Procedural articulated fighters animate every rendered frame; these are not position-only image swaps.
      drawAnimeFighter(width*.205, height*.91, 'blue', valuesRef.current.beat, elapsed, winningSide==='blue', impactSide==='blue' && valuesRef.current.beat==='impact', valuesRef.current.blueAccent)
      drawAnimeFighter(width*.795, height*.91, 'red', valuesRef.current.beat, elapsed, winningSide==='red', impactSide==='red' && valuesRef.current.beat==='impact', valuesRef.current.redAccent)
      const target=impactSide==='blue'?{x:width*.235,y:height*.385}:{x:width*.765,y:height*.385}
      const source=winningSide==='blue'?blueStart:redStart
      const winnerPower=winningSide==='blue'?bluePower:redPower
      const loserPower=winningSide==='blue'?redPower:bluePower
      const phaseProgress=(a:number,b:number)=>Math.max(0,Math.min(1,(elapsed-a)/(b-a)))
      const ease=(v:number)=>v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2
      const release=phaseProgress(.65,1.9)
      const collide=phaseProgress(1.9,2.3)
      const breakthrough=phaseProgress(2.3,3.2)
      const impact=phaseProgress(2.75,3.2)

      // Energy accumulates visibly at both hands before anything is fired.
      if(elapsed<.65){
        const charge=Math.min(1,elapsed/.65)
        const blueDefensive=['SHIELD','HEAL'].includes(bluePower.type)
        const redDefensive=['SHIELD','HEAL'].includes(redPower.type)
        if(!blueDefensive) {
          drawProceduralPower(blueStart.x,blueStart.y,1,bluePower,elapsed,.72+charge*.62,.72+charge*.28)
          drawOrb(blueStart.x,blueStart.y,9+charge*16,bluePower.color,bluePower,elapsed,.42+charge*.42)
        }
        if(!redDefensive) {
          drawProceduralPower(redStart.x,redStart.y,-1,redPower,elapsed,.72+charge*.62,.72+charge*.28)
          drawOrb(redStart.x,redStart.y,9+charge*16,redPower.color,redPower,elapsed,.42+charge*.42)
        }
        if(blueDefensive) drawProceduralPower(blueStart.x,blueStart.y-38,1,bluePower,elapsed,.9+charge*.45,.78+charge*.22)
        if(redDefensive) drawProceduralPower(redStart.x,redStart.y-38,-1,redPower,elapsed,.9+charge*.45,.78+charge*.22)
        for(let i=0;i<2;i++){
          const origin=i===0?blueStart:redStart
          const power=i===0?bluePower:redPower
          if(Math.random()<.65){const a=rand(0,Math.PI*2),r=rand(14,36);particles.push({x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r,vx:Math.cos(a)*rand(5,26),vy:Math.sin(a)*rand(5,26),life:.45,max:.45,size:rand(1,3),hue:power.type==='FIRE'?25:195,alpha:.9})}
        }
      }

      // The two real projectiles travel to a centre clash; no power-art images.
      if(elapsed>=.65 && elapsed<2.3){
        const p=release
        const e=ease(p)
        const bx=blueStart.x+(midX-blueStart.x)*e
        const rx=redStart.x+(midX-redStart.x)*e
        const separation=Math.sin(p*Math.PI*.5)*Math.min(22,height*.035)
        const by=blueStart.y+(midY-blueStart.y)*e+Math.sin(p*Math.PI)*-height*.035-separation
        const ry=redStart.y+(midY-redStart.y)*e+Math.sin(p*Math.PI)*-height*.035+separation
        drawPowerWake(blueStart.x,blueStart.y,bx,by,bluePower,elapsed)
        drawPowerWake(redStart.x,redStart.y,rx,ry,redPower,elapsed)
        drawProceduralPower(bx,by,1,bluePower,elapsed,2.12,1)
        drawProceduralPower(rx,ry,-1,redPower,elapsed,2.12,1)
        if(elapsed>1.9){
          const pulse=1+Math.sin(now*.018)*.14
          ctx.save();ctx.globalAlpha=1-collide*.35;ctx.shadowColor=winnerPower.color;ctx.shadowBlur=42
          for(let ring=0;ring<4;ring++){
            ctx.strokeStyle=ring%2?'rgba(255,255,255,.9)':rgba(ring%3===0?bluePower.color:redPower.color,.82)
            ctx.lineWidth=ring===0?5:2.5
            ctx.beginPath();ctx.arc(midX,midY,(18+ring*12)*pulse+collide*width*.09,0,Math.PI*2);ctx.stroke()
          }
          ctx.restore()
          if(Math.random()<.8) addBurst(midX+rand(-18,18),midY+rand(-18,18),winnerPower.color,7,155)
        }
      }

      // Losing energy collapses; the winning projectile surges through the clash.
      if(elapsed>=2.3 && elapsed<3.2){
        const p=ease(breakthrough)
        const x=midX+(target.x-midX)*p
        const y=midY+(target.y-midY)*p
        const loserFade=1-breakthrough
        drawPowerWake(midX,midY,x,y,winnerPower,elapsed)
        drawProceduralPower(x,y,Math.sign(target.x-midX),winnerPower,elapsed,2.08+breakthrough*.24,1)
        drawProceduralPower(midX,midY,winningSide==='blue'?-1:1,loserPower,elapsed,.46,loserFade*.45)
        drawOrb(midX,midY,Math.max(1,26*loserFade),loserPower.color,loserPower,elapsed,loserFade*.45)
      }

      if(elapsed>=2.75 && elapsed<3.3) {
        drawImpact(target.x,target.y,winnerPower,impact)
        if (elapsed < 6.65 && Math.random() < .95) addBurst(target.x,target.y,winnerPower.color,11,175)
      }

      // Procedural sparks and motes: each particle has its own velocity, drag and lifetime.
      for(let i=particles.length-1;i>=0;i--){
        const q=particles[i];q.life-=dt
        if(q.life<=0){particles.splice(i,1);continue}
        q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.12,dt);q.vy=q.vy*.985+18*dt
        const alpha=(q.life/q.max)*q.alpha
        ctx.fillStyle=`hsla(${q.hue},100%,${q.hue===25?65:78}%,${alpha})`
        ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=q.size*3
        ctx.beginPath();ctx.arc(q.x,q.y,q.size*(.35+.65*q.life/q.max),0,Math.PI*2);ctx.fill()
      }
      ctx.shadowBlur=0

      // Continuous sparks are emitted along the advancing winning bolt.
      if(elapsed>.65 && elapsed<3.2 && Math.random()<.9){
        const t=elapsed<2.3?release:breakthrough
        const x=elapsed<2.3?source.x+(midX-source.x)*ease(t):midX+(target.x-midX)*ease(t)
        const y=elapsed<2.3?source.y+(midY-source.y)*ease(t):midY+(target.y-midY)*ease(t)
        addBurst(x+rand(-8,8),y+rand(-8,8),winnerPower.color,2,70)
      }
      raf=requestAnimationFrame(frame)
    }
    raf=requestAnimationFrame(frame)
    return ()=>{cancelAnimationFrame(raf);observer.disconnect()}
  }, [bluePower.name, redPower.name, winningSide, impactSide, blueAccent, redAccent])

  return <canvas ref={canvasRef} className="gc-live-power-canvas" aria-hidden="true" />
}
