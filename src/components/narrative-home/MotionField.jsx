import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

function capDpr() {
  return Math.min(window.devicePixelRatio || 1, window.innerWidth < 680 ? 1.25 : 1.6);
}

function drawGlowPoint(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawAgency(ctx, time, width, height, pointer, activeStage) {
  const mobile = width < 680;
  const count = mobile ? 34 : 76;
  const centerX = mobile ? width * 0.62 : width * 0.73;
  const centerY = mobile ? height * 0.58 : height * 0.48;
  const scaleX = mobile ? width * 0.28 : width * 0.19;
  const scaleY = mobile ? height * 0.11 : height * 0.18;
  const points = [];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let index = 0; index < count; index += 1) {
    const phase = (index / count) * TAU + time * (0.16 + (index % 7) * 0.003);
    const orbit = 1 + 0.08 * Math.sin(time * 0.7 + index * 1.7);
    let x = centerX + scaleX * orbit * Math.cos(phase);
    let y = centerY + scaleY * Math.sin(phase * 2) * 0.9;
    const px = pointer.x * width;
    const py = pointer.y * height;
    const dx = x - px;
    const dy = y - py;
    const distance = Math.max(40, Math.hypot(dx, dy));
    const influence = Math.max(0, 1 - distance / (mobile ? 160 : 250));
    x += (dx / distance) * influence * 24;
    y += (dy / distance) * influence * 24;
    points.push({ x, y });

    const isHot = index % 17 === activeStage * 3 + 2;
    const color = isHot ? "#ff7a2f" : index % 3 === 0 ? "#e91e8c" : "#9a63ff";
    drawGlowPoint(ctx, x, y, isHot ? 2.7 : 1.2 + (index % 4) * 0.3, color, 0.42 + (index % 5) * 0.08);
  }

  ctx.lineWidth = 0.7;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    const point = points[index];
    ctx.strokeStyle = index % 2 ? "rgba(154,99,255,.18)" : "rgba(233,30,140,.2)";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldModel(ctx, time, width, height, pointer, activeStage) {
  const mobile = width < 680;
  const startX = mobile ? width * 0.14 : width * 0.3;
  const endX = width * 0.99;
  const count = mobile ? 72 : 170;
  const focusX = pointer.x * width;
  const focusY = pointer.y * height;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let index = 0; index < count; index += 1) {
    const seedX = ((index * 71) % 997) / 997;
    const seedY = ((index * 191) % 991) / 991;
    const depth = 0.28 + (((index * 47) % 101) / 101) * 0.72;
    let x = startX + seedX * (endX - startX);
    let y = height * (0.2 + seedY * 0.62);
    x += (pointer.x - 0.5) * depth * (mobile ? 11 : 22);
    y += (pointer.y - 0.5) * depth * (mobile ? 7 : 14);
    y += Math.sin(seedX * 16 + time * 0.36 + index) * depth * (mobile ? 2.5 : 4.5);
    const dx = x - focusX;
    const dy = y - focusY;
    const distance = Math.max(34, Math.hypot(dx, dy));
    const influence = Math.max(0, 1 - distance / (mobile ? 120 : 230));
    x += (dx / distance) * influence * 9;
    y += (dy / distance) * influence * 9;
    const pointColor = index % 17 === activeStage * 3 + 1 ? "#74ff75" : index % 3 === 0 ? "#d935a4" : "#8066df";
    drawGlowPoint(ctx, x, y, 0.55 + depth * 0.8, pointColor, 0.13 + depth * 0.24 + influence * 0.16);
  }

  const lens = ctx.createRadialGradient(focusX, focusY, 0, focusX, focusY, mobile ? 76 : 128);
  lens.addColorStop(0, activeStage === 3 ? "rgba(116,255,117,.055)" : "rgba(139,92,246,.06)");
  lens.addColorStop(1, "rgba(139,92,246,0)");
  ctx.fillStyle = lens;
  ctx.beginPath();
  ctx.arc(focusX, focusY, mobile ? 76 : 128, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawEntertainment(ctx, time, width, height, pointer, activeStage) {
  const mobile = width < 680;
  const count = mobile ? 42 : 86;
  const startX = mobile ? width * 0.34 : width * 0.46;
  const palette = ["#d83e9e", "#8467d9", "#e17c67", "#59a9a8", "#d9bb86"];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let index = 0; index < count; index += 1) {
    const seedX = ((index * 83) % 997) / 997;
    const seedY = ((index * 149) % 991) / 991;
    const depth = 0.24 + (((index * 41) % 97) / 97) * 0.76;
    const drift = Math.sin(time * (0.16 + depth * 0.12) + index * 1.7);
    const x = startX + seedX * (width - startX) + (pointer.x - 0.5) * depth * (mobile ? 14 : 32);
    const y = height * (0.14 + seedY * 0.7) + drift * depth * (mobile ? 5 : 10) + (pointer.y - 0.5) * depth * (mobile ? 9 : 18);
    const hot = index % 19 === activeStage * 4 + 2;
    const color = palette[(index + activeStage) % palette.length];
    const fragmentW = (hot ? 7 : 2.5) + depth * (mobile ? 3 : 6);
    const fragmentH = (hot ? 2.8 : 1.2) + depth * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((seedX - 0.5) * 0.8 + drift * 0.06);
    ctx.fillStyle = color;
    ctx.globalAlpha = hot ? 0.48 : 0.08 + depth * 0.18;
    ctx.shadowColor = color;
    ctx.shadowBlur = hot ? 10 : 3;
    ctx.fillRect(-fragmentW / 2, -fragmentH / 2, fragmentW, fragmentH);
    ctx.restore();
  }
  ctx.restore();
}

export function MotionField({ conceptIndex, paused, reducedMotion, activeStage }) {
  const canvasRef = useRef(null);
  const elapsedRef = useRef(0);
  const pointerRef = useRef({ x: 0.78, y: 0.48 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    let frame = 0;
    let width = 0;
    let height = 0;
    const pointer = pointerRef.current;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = capDpr();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event) => {
      pointer.x = event.clientX / Math.max(1, window.innerWidth);
      pointer.y = event.clientY / Math.max(1, window.innerHeight);
    };

    let previousStamp = performance.now();

    const render = (stamp) => {
      const delta = Math.min(100, Math.max(0, stamp - previousStamp));
      previousStamp = stamp;
      if (!paused && !reducedMotion) elapsedRef.current += delta;
      const time = reducedMotion ? 1.8 : elapsedRef.current / 1000;
      ctx.clearRect(0, 0, width, height);
      if (conceptIndex === 0) drawAgency(ctx, time, width, height, pointer, activeStage);
      if (conceptIndex === 1) drawWorldModel(ctx, time, width, height, pointer, activeStage);
      if (conceptIndex === 2) drawEntertainment(ctx, time, width, height, pointer, activeStage);
      if (!paused && !reducedMotion) frame = window.requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    render(performance.now());

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, [activeStage, conceptIndex, paused, reducedMotion]);

  return <canvas ref={canvasRef} className="motion-field" aria-hidden="true" />;
}
