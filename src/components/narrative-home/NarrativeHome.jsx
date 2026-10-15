'use client';

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Check,
  Menu,
  MonitorPlay,
  Pause,
  Play,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import agenticDesktop from "@/assets/narrative-home/concept-01-agentic-ai.webp";
import agenticMedium from "@/assets/narrative-home/concept-01-agentic-ai-1440.webp";
import agenticMobile from "@/assets/narrative-home/concept-01-agentic-ai-828.webp";
import physicalDesktop from "@/assets/narrative-home/concept-02-physical-ai.webp";
import physicalMedium from "@/assets/narrative-home/concept-02-physical-ai-1440.webp";
import physicalMobile from "@/assets/narrative-home/concept-02-physical-ai-828.webp";
import entertainmentDesktop from "@/assets/narrative-home/concept-03-entertainment-ai.webp";
import entertainmentMedium from "@/assets/narrative-home/concept-03-entertainment-ai-1440.webp";
import entertainmentMobile from "@/assets/narrative-home/concept-03-entertainment-ai-828.webp";
import { Logo } from "@/components/Logo";
import { MotionField } from "./MotionField.jsx";
import {
  getNextNarrativeStep,
  STAGE_COMPLETE_HOLD_MS,
  STAGE_DURATION_MS,
} from "./narrativeCycle.mjs";
import {
  FOCUSABLE_SELECTOR,
  HOME_NAV_ITEMS,
  PRODUCT_LINKS,
  SITE_LINKS,
} from "./linkMap.mjs";

const concepts = [
  {
    id: "concept-01",
    number: "01",
    shortName: "Agentic AI",
    theme: "dark",
    eyebrow: "AGENTIC AI / AUTONOMOUS SYSTEMS",
    headline: ["让智能", "成为行动者"],
    body: "追踪自主智能体从感知、推理到协作与执行的演进，识别正在形成的产品与产业机会。",
    primary: "查看 Agentic AI 100",
    primaryTarget: "agentic-ai-100",
    secondary: "查看四阶段叙事",
    image: { desktop: agenticDesktop, medium: agenticMedium, mobile: agenticMobile },
    stages: [
      ["PERCEIVE", "感知意图"],
      ["REASON", "推演路径"],
      ["COORDINATE", "协同资源"],
      ["ACT", "完成任务"],
    ],
    mission: "追踪 Agentic AI 的产品与产业信号",
    scrollKicker: "AUTONOMY, REFRAMED",
    scrollHeadline: "一次意图，\n如何变成现实中的结果",
    beats: [
      ["01 / PERCEIVE", "先理解世界，而不是立即回答", "持续读取目标、环境与约束，把模糊意图转译成可执行的问题。"],
      ["02 / COORDINATE", "让不同智能体形成临时组织", "研究、判断、资本与生态能力围绕任务协作，而不是堆叠更多工具。"],
      ["03 / ACT", "把判断交付成可验证的行动", "每一步都有结果、反馈与下一轮学习，价值在真实流程中发生。"],
    ],
  },
  {
    id: "concept-02",
    number: "02",
    shortName: "Physical AI",
    theme: "light",
    eyebrow: "PHYSICAL AI / EMBODIED INTELLIGENCE",
    headline: ["让智能", "进入真实世界"],
    body: "追踪世界模型、机器人与产业场景的融合，观察智能如何进入真实世界。",
    primary: "查看 Physical AI 100",
    primaryTarget: "physical-ai-100",
    secondary: "查看四阶段叙事",
    image: { desktop: physicalDesktop, medium: physicalMedium, mobile: physicalMobile },
    stages: [
      ["SENSE", "感知"],
      ["MODEL", "建模"],
      ["SIMULATE", "推演"],
      ["EXECUTE", "执行"],
    ],
    mission: "追踪 Physical AI 的技术与产业信号",
    scrollKicker: "FROM MODEL TO MOTION",
    scrollHeadline: "世界模型，\n正在获得身体",
    beats: [
      ["01 / SENSE", "感知不是输入，而是持续校准", "机器在空间、触觉与时间中理解变化，让现实成为模型的一部分。"],
      ["02 / SIMULATE", "在行动前，先理解每一种后果", "世界模型把不确定性放进推演，让安全、效率与泛化能力同时被检验。"],
      ["03 / EXECUTE", "让规划进入可验证的物理执行", "智能连接机器人、设备与产业场景，在真实反馈中继续进化。"],
    ],
  },
  {
    id: "concept-03",
    number: "03",
    shortName: "Entertainment AI",
    theme: "dark",
    eyebrow: "ENTERTAINMENT AI / LIVING WORLDS",
    headline: ["让想象", "持续生长"],
    body: "追踪生成式内容、互动叙事与 AI 原生 IP，观察内容生产与用户体验如何重构。",
    primary: "查看 Entertainment AI 100",
    primaryTarget: "entertainment-ai-100",
    secondary: "查看四阶段叙事",
    image: { desktop: entertainmentDesktop, medium: entertainmentMedium, mobile: entertainmentMobile },
    stages: [
      ["IMAGINE", "想象"],
      ["GENERATE", "生成"],
      ["PLAY", "互动"],
      ["EVOLVE", "生长"],
    ],
    mission: "追踪 Entertainment AI 的内容与体验信号",
    scrollKicker: "FROM CONTENT TO LIVING WORLD",
    scrollHeadline: "观众不再观看，\n开始进入故事",
    beats: [
      ["01 / IMAGINE", "一个灵感，生成可持续扩展的世界", "角色、空间、声音与规则从同一叙事核心生长，而不是批量生产内容。"],
      ["02 / PLAY", "角色记住观众，故事回应每次选择", "体验从单向播放变成持续互动，让每个人拥有自己的进入方式。"],
      ["03 / EVOLVE", "IP 在创作、互动与传播中共同生长", "创作者与社区形成新的协作关系，让内容价值越使用、越丰富。"],
    ],
  },
];

const researchDirections = [
  {
    id: "agentic-ai-100",
    code: "01 / AGENTIC AI",
    title: "Agentic AI 100",
    description: "关注自主智能体、协作系统与可验证执行，识别产品与产业中的真实进展。",
    action: "申报榜单",
    href: SITE_LINKS.rankingApplication,
  },
  {
    id: "physical-ai-100",
    code: "02 / PHYSICAL AI",
    title: "Physical AI 100",
    description: "关注世界模型、机器人、具身智能与产业场景的融合进程。",
    action: "申报榜单",
    href: SITE_LINKS.rankingApplication,
  },
  {
    id: "entertainment-ai-100",
    code: "03 / ENTERTAINMENT AI",
    title: "Entertainment AI 100",
    description: "关注生成式内容、互动叙事与 AI 原生 IP，持续更新研究进展。",
    action: "查看持续研究",
    href: SITE_LINKS.report,
  },
];

function Brand() {
  return (
    <div className="narrative-brand" aria-label="非凡资本首页">
      <Logo size={40} />
    </div>
  );
}

function NarrativeImage({ image, className, eager = false }) {
  return (
    <img
      className={className}
      src={image.desktop.src}
      srcSet={`${image.mobile.src} 828w, ${image.medium.src} 1440w, ${image.desktop.src} 1920w`}
      sizes="100vw"
      width="1920"
      height="1200"
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function StudyToolbar({ activeIndex, onSelect, paused, onTogglePause, reduced, systemReduced, onToggleReduced }) {
  return (
    <aside className="study-toolbar" aria-label="AI 研究方向循环">
      <div className="study-title"><MonitorPlay size={17} /> 三大研究方向</div>
      <div className="concept-tabs" role="group" aria-label="选择研究方向">
        {concepts.map((concept, index) => (
          <button
            key={concept.id}
            type="button"
            aria-pressed={activeIndex === index}
            className={activeIndex === index ? "active" : ""}
            onClick={() => onSelect(index)}
            data-testid={`select-${concept.id}`}
          >
            <span>{concept.number}</span>
            <b>{concept.shortName}</b>
          </button>
        ))}
      </div>
      <div className="motion-controls">
        <button
          type="button"
          onClick={onTogglePause}
          aria-pressed={paused}
          aria-label={paused ? "继续自动切换" : "暂停自动切换"}
          title={paused ? "继续自动切换" : "暂停自动切换"}
          data-testid="pause-motion"
        >
          {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
          <span>{paused ? "继续切换" : "暂停切换"}</span>
        </button>
        <button
          type="button"
          onClick={onToggleReduced}
          aria-pressed={reduced}
          aria-label={systemReduced ? "系统已启用静态模式" : reduced ? "启用完整动效" : "启用静态模式"}
          title={systemReduced ? "系统已启用静态模式" : reduced ? "启用完整动效" : "启用静态模式"}
          disabled={systemReduced}
          data-testid="reduce-motion"
        >
          <SlidersHorizontal size={16} />
          <span>{systemReduced ? "系统静态" : reduced ? "静态" : "完整"}</span>
        </button>
      </div>
    </aside>
  );
}

function IntentPanel({ open, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement;
      window.requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  const keepFocusInside = (event) => {
    if (event.key !== "Tab") return;
    const controls = [...(panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])]
      .filter((control) => control.getAttribute("aria-hidden") !== "true" && control.tabIndex !== -1);
    if (!controls.length) return;
    const currentIndex = controls.indexOf(document.activeElement);
    const nextIndex = event.shiftKey
      ? (currentIndex <= 0 ? controls.length - 1 : currentIndex - 1)
      : (currentIndex < 0 || currentIndex === controls.length - 1 ? 0 : currentIndex + 1);
    event.preventDefault();
    controls[nextIndex].focus();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="panel-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section
            ref={panelRef}
            className="intent-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="intent-title"
            onKeyDown={keepFocusInside}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
          >
            <button ref={closeRef} className="panel-close" type="button" onClick={onClose} aria-label="关闭">
              <X size={22} />
            </button>
            <span className="micro-label">INTENT ROUTER</span>
            <h2 id="intent-title">你希望从哪里开始？</h2>
            <p>选择你的目标，进入对应的产品或申报入口。</p>
            <div className="intent-options">
              <a href={SITE_LINKS.uniqueClub} target="_blank" rel="noopener noreferrer" onClick={onClose}><strong>我是 AI 创业者</strong><span>使用 UniqueClub 创建并分享项目主页</span><ArrowRight size={18} /></a>
              <a href={SITE_LINKS.goodProjects} target="_blank" rel="noopener noreferrer" onClick={onClose}><strong>我是认证投资人</strong><span>进入有好项目，浏览项目与 BP</span><ArrowRight size={18} /></a>
              <a href={SITE_LINKS.rankingApplication} target="_blank" rel="noopener noreferrer" onClick={onClose}><strong>我要申报 AI 榜单</strong><span>申报 Agentic AI 100 或 Physical AI 100</span><ArrowRight size={18} /></a>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MobileMenu({ open, onClose, onIntent }) {
  const menuRef = useRef(null);
  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement;
      window.requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  const keepFocusInside = (event) => {
    if (event.key !== "Tab") return;
    const controls = [...(menuRef.current?.querySelectorAll("button, a") ?? [])];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div ref={menuRef} className="mobile-menu" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="移动端导航" onKeyDown={keepFocusInside} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭菜单"><X size={24} /></button>
          <nav aria-label="移动端导航">
            {HOME_NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} onClick={onClose} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {item.label}
              </a>
            ))}
          </nav>
          <button className="mobile-investor" type="button" onClick={onIntent}>选择入口 <ArrowRight size={17} /></button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StoryBeat({ beat, index, progress, reduced }) {
  const ranges = [
    [0.04, 0.1, 0.31, 0.38],
    [0.31, 0.38, 0.62, 0.69],
    [0.62, 0.69, 0.9, 0.97],
  ];
  const [start, enter, hold, end] = ranges[index];
  const isLastBeat = index === 2;
  const opacity = useTransform(progress, [start, enter, hold, end], [0, 1, 1, isLastBeat ? 1 : 0]);
  const y = useTransform(progress, [start, enter, hold, end], [44, 0, 0, isLastBeat ? 0 : -28]);
  const blur = useTransform(progress, [start, enter, hold, end], ["blur(8px)", "blur(0px)", "blur(0px)", isLastBeat ? "blur(0px)" : "blur(6px)"]);

  return (
    <motion.article className="story-beat" style={reduced ? { opacity: 1, y: 0, filter: "none" } : { opacity, y, filter: blur }}>
      <span>{beat[0]}</span>
      <h3>{beat[1]}</h3>
      <p>{beat[2]}</p>
    </motion.article>
  );
}

function ScrollStory({ concept, reduced }) {
  const storyRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ["start start", "end end"] });
  const visualScale = useTransform(scrollYProgress, [0, 0.48, 1], [1.02, 1.065, 1.1]);
  const visualY = useTransform(scrollYProgress, [0, 1], ["0%", "-2.5%"]);
  const visualBlur = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], ["blur(7px)", "blur(0px)", "blur(0px)", "blur(3px)"]);
  const frameOpacity = useTransform(scrollYProgress, [0, 0.12, 0.86, 1], [0.28, 0.72, 0.72, 0.42]);

  return (
    <section ref={storyRef} id="story" className={`scroll-story ${concept.id}`} aria-label={`${concept.shortName} 叙事分镜`}>
      <div className="scroll-story-sticky">
        <motion.div className="scroll-story-visual" style={reduced ? {} : { scale: visualScale, y: visualY, filter: visualBlur }}>
          <NarrativeImage image={concept.image} />
        </motion.div>
        <motion.div className="scroll-story-frame" style={reduced ? { opacity: 0.62 } : { opacity: frameOpacity }} />
        <header className="scroll-story-heading">
          <span>{concept.scrollKicker}</span>
          <h2>{concept.scrollHeadline}</h2>
        </header>
        <div className="scroll-story-beats">
          {concept.beats.map((beat, index) => (
            <StoryBeat key={beat[0]} beat={beat} index={index} progress={scrollYProgress} reduced={reduced} />
          ))}
        </div>
        <div className="scroll-progress" aria-hidden="true"><motion.i style={reduced ? { scaleX: 1 } : { scaleX: scrollYProgress }} /></div>
      </div>
    </section>
  );
}

export function NarrativeHome() {
  const systemReduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manualReduced, setManualReduced] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [intentOpen, setIntentOpen] = useState(false);
  const [keyboardFocusWithin, setKeyboardFocusWithin] = useState(false);
  const appRef = useRef(null);
  const heroRef = useRef(null);
  const stageRailRef = useRef(null);
  const pointerStart = useRef(null);
  const lastSwipeAt = useRef(0);
  const reportRef = useRef(null);
  const activeIndexRef = useRef(0);
  const activeStageRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const heroVisibleRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const transitioningRef = useRef(false);
  const lastInputWasKeyboardRef = useRef(false);
  const stageElapsedRef = useRef(0);
  const stageHoldElapsedRef = useRef(0);
  const reduced = Boolean(systemReduced || manualReduced);
  const cyclePaused = paused || menuOpen || intentOpen || keyboardFocusWithin;
  const concept = concepts[activeIndex];

  const syncKeyboardFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      const focused = document.activeElement;
      const dynamicScene = appRef.current?.querySelector(".concept-scene");
      setKeyboardFocusWithin(Boolean(
        focused
        && lastInputWasKeyboardRef.current
        && dynamicScene?.contains(focused)
        && focused.matches?.(":focus-visible"),
      ));
    });
  }, []);

  const writeStageProgress = useCallback((progress) => {
    const rail = stageRailRef.current;
    if (!rail) return;
    const safeProgress = Math.max(0, Math.min(1, progress));
    rail.style.setProperty("--stage-progress", safeProgress.toFixed(4));
    rail.dataset.progress = safeProgress.toFixed(3);
  }, []);

  const resetCycle = useCallback((conceptIndex, stageIndex = 0) => {
    transitioningRef.current = conceptIndex !== activeIndexRef.current && !reducedRef.current;
    activeIndexRef.current = conceptIndex;
    activeStageRef.current = stageIndex;
    stageElapsedRef.current = 0;
    stageHoldElapsedRef.current = 0;
    setActiveIndex(conceptIndex);
    setActiveStage(stageIndex);
    writeStageProgress(reducedRef.current ? 1 : 0);
  }, [writeStageProgress]);

  const advanceCycle = useCallback(() => {
    const next = getNextNarrativeStep(
      activeIndexRef.current,
      activeStageRef.current,
      concepts.length,
    );
    transitioningRef.current = next.conceptChanged;
    activeIndexRef.current = next.conceptIndex;
    activeStageRef.current = next.stageIndex;
    stageElapsedRef.current = 0;
    stageHoldElapsedRef.current = 0;
    setActiveIndex(next.conceptIndex);
    setActiveStage(next.stageIndex);
    writeStageProgress(0);
  }, [writeStageProgress]);

  useEffect(() => {
    pausedRef.current = cyclePaused;
  }, [cyclePaused]);

  useEffect(() => {
    reducedRef.current = reduced;
    writeStageProgress(reduced ? 1 : stageElapsedRef.current / STAGE_DURATION_MS);
  }, [reduced, writeStageProgress]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      heroVisibleRef.current = true;
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      heroVisibleRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.2;
    }, { threshold: [0, 0.2, 0.5] });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frameId;
    let previousTime = performance.now();
    let wasRunnable = false;

    const tick = (currentTime) => {
      const delta = Math.min(100, Math.max(0, currentTime - previousTime));
      previousTime = currentTime;
      const canAdvance = !pausedRef.current
        && !reducedRef.current
        && heroVisibleRef.current
        && !pointerActiveRef.current
        && !transitioningRef.current
        && document.visibilityState === "visible";

      if (canAdvance) {
        if (wasRunnable) {
          if (stageElapsedRef.current < STAGE_DURATION_MS) {
            stageElapsedRef.current = Math.min(
              STAGE_DURATION_MS,
              stageElapsedRef.current + delta,
            );
            writeStageProgress(stageElapsedRef.current / STAGE_DURATION_MS);
          } else {
            stageHoldElapsedRef.current += delta;
            if (stageHoldElapsedRef.current >= STAGE_COMPLETE_HOLD_MS) advanceCycle();
          }
        }
        wasRunnable = true;
      } else {
        wasRunnable = false;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [advanceCycle, writeStageProgress]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Tab") lastInputWasKeyboardRef.current = true;
      if (["1", "2", "3"].includes(event.key)) resetCycle(Number(event.key) - 1);
      if (event.key.toLowerCase() === "p") setPaused((value) => !value);
      if (event.key === "Escape") {
        setMenuOpen(false);
        setIntentOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetCycle]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return undefined;
    const reset = () => {
      app.style.setProperty("--pointer-x", "0px");
      app.style.setProperty("--pointer-y", "0px");
    };
    if (cyclePaused || reduced) {
      reset();
      return undefined;
    }
    const onMove = (event) => {
      const x = ((event.clientX / Math.max(1, window.innerWidth)) - 0.5) * 2;
      const y = ((event.clientY / Math.max(1, window.innerHeight)) - 0.5) * 2;
      app.style.setProperty("--pointer-x", `${(-x * 12).toFixed(2)}px`);
      app.style.setProperty("--pointer-y", `${(-y * 8).toFixed(2)}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      reset();
    };
  }, [cyclePaused, reduced]);

  const nextConcept = (delta) => resetCycle(
    (activeIndexRef.current + delta + concepts.length) % concepts.length,
  );

  const onPointerDown = (event) => {
    const target = event.target;
    const isInteractive = target instanceof Element
      && target.closest("button, a, input, textarea, select, [role='button']");
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || isInteractive) {
      pointerStart.current = null;
      return;
    }
    pointerActiveRef.current = true;
    pointerStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  };

  const onPointerUp = (event) => {
    if (!pointerStart.current || pointerStart.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    const now = Date.now();
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4 && now - lastSwipeAt.current > 700) {
      lastSwipeAt.current = now;
      nextConcept(dx < 0 ? 1 : -1);
    }
    pointerActiveRef.current = false;
    pointerStart.current = null;
  };

  const onPointerCancel = (event) => {
    if (!pointerStart.current || pointerStart.current.pointerId === event.pointerId) {
      pointerActiveRef.current = false;
      pointerStart.current = null;
    }
  };

  return (
    <div className="narrative-home">
    <main
      ref={appRef}
      className={`app theme-${concept.theme} ${concept.id}${cyclePaused ? " motion-paused" : ""}${reduced ? " motion-reduced" : ""}`}
      id="top"
      data-active-concept={concept.id}
      data-active-stage={activeStage}
      onFocusCapture={syncKeyboardFocus}
      onBlurCapture={syncKeyboardFocus}
      onPointerDownCapture={() => {
        lastInputWasKeyboardRef.current = false;
        setKeyboardFocusWithin(false);
      }}
    >
      <div className="narrative-media-preload" aria-hidden="true">
        {concepts.map((item) => (
          <NarrativeImage key={item.id} image={item.image} eager />
        ))}
      </div>

      <StudyToolbar
        activeIndex={activeIndex}
        onSelect={resetCycle}
        paused={paused}
        onTogglePause={() => setPaused((value) => !value)}
        reduced={reduced}
        systemReduced={Boolean(systemReduced)}
        onToggleReduced={() => setManualReduced((value) => !value)}
      />

      <section ref={heroRef} className="hero" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} data-testid="hero">
        <header className="site-header">
          <Brand />
          <nav className="desktop-nav" aria-label="主导航">
            {HOME_NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {item.label}
              </a>
            ))}
          </nav>
          <button className="investor-button" type="button" onClick={() => setIntentOpen(true)}>
            选择入口 <ArrowRight size={16} />
          </button>
          <button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="打开菜单" aria-expanded={menuOpen} aria-controls="mobile-navigation">
            <Menu size={24} />
          </button>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className={`concept-scene theme-${concept.theme} ${concept.id}`}
            key={concept.id}
            initial={{ opacity: 0, scale: reduced ? 1 : 1.012 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.994 }}
            transition={{ duration: reduced ? 0 : 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            onAnimationComplete={() => {
              if (concept.id === concepts[activeIndexRef.current].id) transitioningRef.current = false;
            }}
          >
            <div className="visual-layer">
              <NarrativeImage className="hero-media" image={concept.image} eager />
            </div>
            <MotionField conceptIndex={activeIndex} paused={cyclePaused} reducedMotion={reduced} activeStage={activeStage} />

            <motion.div
              className="hero-content"
              initial={{ opacity: 0, y: reduced ? 0 : 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
            >
              <span className="eyebrow"><i />{concept.eyebrow}</span>
              <h1>
                <span>{concept.headline[0]}</span>
                <span className="headline-accent">{concept.headline[1]}</span>
              </h1>
              <p>{concept.body}</p>
              <div className="hero-actions">
                <a className="primary-action" href={`#${concept.primaryTarget}`}>
                  {concept.primary} <ArrowRight size={18} strokeWidth={2.25} />
                </a>
                <button className="secondary-action" type="button" onClick={() => document.querySelector("#story")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })}>
                  {concept.secondary} <ArrowRight size={18} />
                </button>
              </div>
              <div className="gesture-note"><span className="gesture-track"><i /></span>移动指针影响视觉 · 四阶段结束后自动切换研究方向</div>
            </motion.div>

            <div ref={stageRailRef} className="stage-rail" aria-label={`${concept.shortName} 四阶段循环`} data-progress="0.000">
              {concept.stages.map(([name, label], index) => (
                <button key={name} type="button" className={activeStage === index ? "active" : ""} aria-current={activeStage === index ? "step" : undefined} onClick={() => resetCycle(activeIndex, index)}>
                  <span>{name}</span>
                  <small>{label}</small>
                  <i><b /></i>
                </button>
              ))}
            </div>

            <div className="mission-chip">
              <span className="status-dot" />
              <div><small>RESEARCH FOCUS</small><strong>{concept.mission}</strong></div>
              <span>{activeStage + 1} / 4</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <ScrollStory concept={concept} reduced={reduced} />

      <section className="research-section" id="research" ref={reportRef}>
        <div className="section-kicker"><span />RESEARCH &amp; RANKINGS</div>
        <div className="research-grid">
          <div>
            <h2>非凡产研<br />AI 研究与榜单</h2>
            <p>围绕 Agentic AI、Physical AI 与 Entertainment AI，持续发布趋势研究、产业观察与榜单。</p>
            <a href={SITE_LINKS.report} target="_blank" rel="noopener noreferrer">查看研究与榜单 <ArrowRight size={17} /></a>
          </div>
          <div className="signal-sequence" aria-label="从研究到行动">
            {["识别技术与产品信号", "形成研究与榜单", "连接产业与资本"].map((item, index) => (
              <div key={item}><span>0{index + 1}</span><strong>{item}</strong><Check size={17} strokeWidth={2.4} /></div>
            ))}
          </div>
        </div>
        <div className="research-directions" aria-label="三大研究方向">
          {researchDirections.map((direction) => (
            <article id={direction.id} key={direction.id}>
              <span>{direction.code}</span>
              <h3>{direction.title}</h3>
              <p>{direction.description}</p>
              <a href={direction.href} target="_blank" rel="noopener noreferrer">{direction.action} <ArrowRight size={16} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="product-matrix" id="products" aria-labelledby="products-title">
        <header className="product-matrix-heading">
          <div className="section-kicker"><span />PRODUCT MATRIX</div>
          <h2 id="products-title">围绕创业者、活动与投资人的三款产品</h2>
        </header>
        <div className="product-grid">
          {PRODUCT_LINKS.map((product) => (
            <a href={product.href} target="_blank" rel="noopener noreferrer" key={product.name}>
              <span>{product.code}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>{product.action} <ArrowRight size={16} /></strong>
            </a>
          ))}
        </div>
      </section>

      <section className="ecosystem-section" id="ecosystem" aria-labelledby="ecosystem-title">
        <header className="ecosystem-heading">
          <div className="section-kicker"><span />ACTIVITIES &amp; ECOSYSTEM</div>
          <h2 id="ecosystem-title">从持续研究，到真实连接</h2>
          <p>以研究识别方向，以产品承接协作，以活动与长期社群连接创业者、投资人和产业伙伴。</p>
        </header>
        <div className="capabilities">
          <a href={SITE_LINKS.report} target="_blank" rel="noopener noreferrer"><span>01 / RESEARCH</span><h3>研究服务</h3><p>持续识别 AI 技术演进、商业化进程与结构性机会。</p></a>
          <a href="#products"><span>02 / PRODUCTS</span><h3>产品协作</h3><p>通过三款产品承接创业者表达、现场互动与认证投资人对接。</p></a>
          <a href="/about#ecosystem"><span>03 / COMMUNITY</span><h3>活动与社群</h3><p>围绕前沿议题组织交流、研学与长期关系网络。</p></a>
        </div>
      </section>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onIntent={() => { setMenuOpen(false); setIntentOpen(true); }} />
      <IntentPanel open={intentOpen} onClose={() => setIntentOpen(false)} />
    </main>
    </div>
  );
}
