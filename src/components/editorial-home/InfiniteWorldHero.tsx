'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import poster from '@/assets/editorial/hero.webp'
import type { WorldAPI } from './world/createWorld'

const worlds = [
  { name: 'Agentic AI', zh: '从思考，到行动。', en: 'From thinking to doing.' },
  { name: 'Physical AI', zh: '让智能，拥有身体。', en: 'Intelligence takes shape.' },
  { name: 'Entertainment AI', zh: '创造，还未发生的体验。', en: 'Imagine experiences yet to exist.' },
]

export function InfiniteWorldHero() {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const host = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const entryButton = useRef<HTMLButtonElement>(null)
  const engine = useRef<WorldAPI | null>(null)
  const active = useRef(true)
  const pausedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [staticMode, setStaticMode] = useState(false)
  const [paused, setPaused] = useState(false)
  const [exploring, setExploring] = useState(false)
  const [progress, setProgress] = useState({ distance: 0, discoveries: 0, topic: 0 })

  const synchronizePause = useCallback(() => {
    if (document.hidden || !active.current) engine.current?.setDirection(0)
    engine.current?.setPaused(pausedRef.current || !active.current || document.hidden)
  }, [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (reduced.matches || connection?.saveData) setStaticMode(true)
    const update = (event: MediaQueryListEvent) => { if (event.matches) { setStaticMode(true); setExploring(false) } }
    reduced.addEventListener('change', update)
    return () => reduced.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (staticMode) { setReady(false); return }
    let disposed = false
    let world: WorldAPI | undefined
    // Defer the 3D engine: the navigation, copy and poster render immediately.
    const boot = window.requestAnimationFrame(() => {
      import('./world/createWorld').then(({ createWorld }) => {
        if (disposed || !canvas.current) return
        try {
          world = createWorld(canvas.current, {
            onReady: () => { if (!disposed) setReady(true) },
            onError: () => { if (!disposed) { setUnavailable(true); setReady(false); setExploring(false) } },
            onProgress: state => { if (!disposed) setProgress(state) },
          })
          engine.current = world
          synchronizePause()
        } catch { setUnavailable(true); setReady(false) }
      }).catch(() => { if (!disposed) setUnavailable(true) })
    })
    return () => { disposed = true; window.cancelAnimationFrame(boot); world?.dispose(); engine.current = null }
  }, [staticMode, synchronizePause])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { active.current = entry.isIntersecting; synchronizePause() }, { threshold: 0.03 })
    if (host.current) observer.observe(host.current)
    document.addEventListener('visibilitychange', synchronizePause)
    const clearDirection = () => engine.current?.setDirection(0)
    window.addEventListener('blur', clearDirection)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', synchronizePause); window.removeEventListener('blur', clearDirection) }
  }, [synchronizePause])

  useEffect(() => {
    pausedRef.current = paused
    synchronizePause()
  }, [paused, synchronizePause])

  useEffect(() => {
    engine.current?.setExploring(exploring)
    if (!exploring) engine.current?.setDirection(0)
  }, [exploring, ready])

  function chooseWorld(index: number) {
    if (index !== 0 && index !== 1 && index !== 2) return
    engine.current?.setTopic(index)
    setProgress(previous => ({ ...previous, topic: index }))
    if (exploring) host.current?.focus({ preventScroll: true })
  }

  function exitWorld() {
    engine.current?.setDirection(0)
    setExploring(false)
    window.requestAnimationFrame(() => entryButton.current?.focus({ preventScroll: true }))
  }

  function enterWorld() {
    setPaused(false)
    setExploring(true)
    host.current?.focus({ preventScroll: true })
  }

  return <section ref={host} id="top" className={`ed-world-hero ${ready && !staticMode ? 'ed-world-ready' : ''} ${exploring ? 'ed-world-exploring' : ''}`} aria-label={zh ? '非凡资本 · 无限 AI 世界' : 'UniqueCapital · Infinite AI world'} tabIndex={-1}
    onPointerMove={e => {
      if (e.pointerType !== 'mouse') return
      const rect = e.currentTarget.getBoundingClientRect()
      engine.current?.setPointer((e.clientX - rect.left) / rect.width * 2 - 1, (e.clientY - rect.top) / rect.height * 2 - 1)
    }} onPointerLeave={() => { engine.current?.setPointer(0,0); engine.current?.setDirection(0) }}
    onKeyDown={e => {
      if (exploring && e.key === 'Escape') { exitWorld(); return }
      if (!exploring || e.target !== e.currentTarget) return
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); engine.current?.setDirection(-1) }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); engine.current?.setDirection(1) }
      if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) setPaused(p => !p) }
    }} onKeyUp={e => { if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) engine.current?.setDirection(0) }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) engine.current?.setDirection(0) }}>
    <Image className="ed-world-poster" src={poster} alt="" fill priority sizes="100vw"/>
    <canvas ref={canvas} className="ed-world-canvas" aria-hidden="true"/>
    <div className="ed-world-shade"/>
    <div className="ed-world-topline"><span>UNIQUE WORLDS / 0{progress.topic + 1}</span><span>{worlds[progress.topic].name}</span></div>

    {!exploring ? <div className="ed-world-statement"><p className="ed-eyebrow">THE FUTURE IS NOT A SPECTATOR SPORT.</p><h1>{zh ? <>未来不是旁观席。<br/>一起，参与构建。</> : <>THE FUTURE<br/>IS OURS TO BUILD.</>}</h1><div className="ed-world-entry"><p>{zh ? '研究下一步，连接创造下一步的人。' : 'Research what comes next. Connect the people building it.'}</p>{ready && !staticMode && !unavailable && <button ref={entryButton} onClick={enterWorld}>{zh ? '探索这个世界' : 'Explore this world'}<ArrowUpRight size={21}/></button>}</div></div> : <div className="ed-world-playhead"><div><p className="ed-eyebrow">EXPLORATION MODE</p><h2>{worlds[progress.topic][lang]}</h2><p>{zh ? `已发现 ${progress.discoveries} 个地标 · 行进 ${Math.floor(progress.distance)} m` : `${progress.discoveries} landmarks · ${Math.floor(progress.distance)} m travelled`}</p></div><button className="ed-world-icon" onClick={exitWorld} aria-label={zh ? '退出探索模式' : 'Exit exploration mode'}><X size={24}/></button></div>}

    {exploring && <div className="ed-world-game-controls"><p>{zh ? '方向键 / A D 或按住下方按钮移动 · 穿越地标，探索下一段世界' : 'Arrow keys / A D, or hold the buttons to move. Pass landmarks and keep exploring.'}</p><div>{([-1,1] as const).map(direction => <button key={direction} className="ed-world-steer" aria-label={direction < 0 ? (zh ? '向左移动' : 'Move left') : (zh ? '向右移动' : 'Move right')} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); engine.current?.setDirection(direction) }} onPointerUp={() => engine.current?.setDirection(0)} onPointerCancel={() => engine.current?.setDirection(0)} onLostPointerCapture={() => engine.current?.setDirection(0)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); engine.current?.setDirection(direction) } }} onKeyUp={() => engine.current?.setDirection(0)} onBlur={() => engine.current?.setDirection(0)}>{direction < 0 ? <ArrowLeft size={23}/> : <ArrowRight size={23}/>}</button>)}</div></div>}

    <div className="ed-world-bottom">
      <div className="ed-world-topics" role="group" aria-label={zh ? '选择 3D 世界' : 'Choose a 3D world'}>{worlds.map((world,index) => <button key={world.name} aria-pressed={index === progress.topic} onClick={() => chooseWorld(index)}><span>0{index + 1}</span>{world.name}</button>)}</div>
      <div className="ed-world-utilities">
        {ready && !staticMode && <button className="ed-world-icon" onClick={() => setPaused(p => !p)} aria-label={paused ? (zh ? '继续场景' : 'Resume scene') : (zh ? '暂停场景' : 'Pause scene')}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>}
        {!unavailable && <button className="ed-world-static" onClick={() => { setStaticMode(mode => !mode); setExploring(false); setPaused(false) }}>{staticMode ? (zh ? '启用 3D' : 'Enable 3D') : (zh ? '静态模式' : 'Still mode')}</button>}
        <a href="#research" className="ed-world-scroll">{zh ? '向下探索' : 'Explore more'}<ArrowDown size={19}/></a>
      </div>
    </div>
    {(unavailable || staticMode) && <p className="ed-world-fallback-note">{zh ? '静态浏览 · 所有内容与入口均可使用' : 'Still mode · All content and links remain available'}</p>}
  </section>
}
