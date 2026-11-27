"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface BrainGeometryData {
  basePositions: Float32Array;
  lineIndices: Uint16Array;
  signalEdges: Array<[number, number, number, number]>;
  nodeCount: number;
}

function createCircleSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 1, half, half, half);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.28, "rgba(255,255,255,0.98)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.72)");
    grad.addColorStop(0.76, "rgba(255,255,255,0.14)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function buildNeuralBrainData(nodeCount: number): BrainGeometryData {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const basePositions = new Float32Array(nodeCount * 3);
  const cerebellumCount = Math.floor(nodeCount * 0.13);
  const cortexCount = nodeCount - cerebellumCount;

  for (let i = 0; i < cortexCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const u = rand() * Math.PI * 2;
    const cosPhi = rand() * 2 - 1;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
    const radialShell = 0.84 + rand() * 0.18;

    let lx = Math.abs(sinPhi * Math.cos(u)) * 0.86;
    let ly = cosPhi * 0.92;
    let lz = sinPhi * Math.sin(u) * 1.24;

    if (lz > 0) {
      lx *= 1 - lz * 0.14;
      ly *= 1 - lz * 0.08;
    } else {
      lx *= 1 + Math.abs(lz) * 0.06;
    }
    if (ly < -0.18) {
      ly = -0.18 + (ly + 0.18) * 0.45;
      if (lz > -0.45 && lz < 0.55) {
        lx += 0.14 * (1 - Math.abs(lz) * 0.8);
      }
    }

    const fold =
      0.065 * Math.sin(lz * 6.2 + ly * 5.1) +
      0.04 * Math.cos(lx * 7.5 - lz * 4.4);
    const r = radialShell + fold;

    const fissureGap = 0.085 + (1 - Math.abs(ly)) * 0.04;
    const x = side * (lx * r + fissureGap);
    const y = ly * r + 0.14;
    const z = lz * r;

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;
  }

  for (let j = 0; j < cerebellumCount; j++) {
    const i = cortexCount + j;
    const side = j % 2 === 0 ? 1 : -1;
    const u = rand() * Math.PI * 2;
    const v = rand() * 2 - 1;
    const s = Math.sqrt(Math.max(0, 1 - v * v));
    const r = 0.85 + rand() * 0.15;

    basePositions[i * 3] = side * (Math.abs(s * Math.cos(u)) * 0.48 * r + 0.04);
    basePositions[i * 3 + 1] = v * 0.34 * r - 0.52;
    basePositions[i * 3 + 2] = s * Math.sin(u) * 0.44 * r - 0.62;
  }

  const edges: number[] = [];
  const maxDistSq = 0.38 * 0.38;
  const maxEdgesPerNode = 3;

  for (let i = 0; i < nodeCount; i++) {
    const ax = basePositions[i * 3];
    const ay = basePositions[i * 3 + 1];
    const az = basePositions[i * 3 + 2];
    let links = 0;

    for (let j = i + 1; j < nodeCount && links < maxEdgesPerNode; j++) {
      const dx = ax - basePositions[j * 3];
      const dy = ay - basePositions[j * 3 + 1];
      const dz = az - basePositions[j * 3 + 2];
      const dSq = dx * dx + dy * dy + dz * dz;
      if (dSq < maxDistSq && dSq > 0.015) {
        edges.push(i, j);
        links++;
      }
    }
  }

  const totalEdges = Math.floor(edges.length / 2);
  const signalCount = Math.min(40, totalEdges);
  const signalEdges: Array<[number, number, number, number]> = [];
  for (let k = 0; k < signalCount; k++) {
    const edgeIdx = Math.floor((k / signalCount) * totalEdges) * 2;
    signalEdges.push([
      edges[edgeIdx],
      edges[edgeIdx + 1],
      0.42 + rand() * 0.65,
      rand(),
    ]);
  }

  return {
    basePositions,
    lineIndices: new Uint16Array(edges),
    signalEdges,
    nodeCount,
  };
}

interface InteractionRef {
  dragging: boolean;
  lastX: number;
  lastY: number;
  velX: number;
  velY: number;
  rotX: number;
  rotY: number;
  hoverX: number;
  hoverY: number;
  hovering: boolean;
}

function NeuralBrainMesh({
  isPhone,
  interactionRef,
}: {
  isPhone: boolean;
  interactionRef: React.MutableRefObject<InteractionRef>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeCount = isPhone ? 360 : 460;
  const baseLineOpacity = isPhone ? 0.34 : 0.28;
  const baseNodeSize = isPhone ? 0.092 : 0.098;

  const data = useMemo(() => buildNeuralBrainData(nodeCount), [nodeCount]);
  const spriteTex = useMemo(() => createCircleSpriteTexture(), []);

  const nodeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(data.basePositions), 3)
    );
    return geo;
  }, [data]);

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const linePos = new Float32Array(data.lineIndices.length * 3);
    for (let i = 0; i < data.lineIndices.length; i++) {
      const idx = data.lineIndices[i] * 3;
      linePos[i * 3] = data.basePositions[idx];
      linePos[i * 3 + 1] = data.basePositions[idx + 1];
      linePos[i * 3 + 2] = data.basePositions[idx + 2];
    }
    geo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    return geo;
  }, [data]);

  const signalGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(data.signalEdges.length * 3), 3)
    );
    return geo;
  }, [data]);

  const nodeMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: baseNodeSize,
        map: spriteTex,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        sizeAttenuation: true,
        color: new THREE.Color("#f2994a"),
      }),
    [baseNodeSize, spriteTex]
  );

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        opacity: baseLineOpacity,
        depthWrite: false,
        color: new THREE.Color("#2ea8d1"),
      }),
    [baseLineOpacity]
  );

  const signalMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: isPhone ? 0.145 : 0.16,
        map: spriteTex,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        sizeAttenuation: true,
        color: new THREE.Color("#ffd099"),
      }),
    [isPhone, spriteTex]
  );

  useEffect(() => {
    return () => {
      nodeGeo.dispose();
      lineGeo.dispose();
      signalGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      signalMat.dispose();
      spriteTex.dispose();
    };
  }, [nodeGeo, lineGeo, signalGeo, nodeMat, lineMat, signalMat, spriteTex]);

  const palette = useMemo(
    () => ({
      warn: new THREE.Color("#f2994a"),
      ocean: new THREE.Color("#2ea8d1"),
      sage: new THREE.Color("#82d96e"),
      spark: new THREE.Color("#ffd099"),
      targetNode: new THREE.Color(),
      targetLine: new THREE.Color(),
      targetSignal: new THREE.Color(),
    }),
    []
  );

  const animRef = useRef({
    clock: 0,
    prevActiveCount: 0,
    toggleKick: 0,
    spinKick: 0,
    smoothCalm: 0,
  });

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const store = useSpanrailStore.getState();
    const activeCount =
      (store.guardrails.semanticCache ? 1 : 0) +
      (store.guardrails.piiRedaction ? 1 : 0) +
      (store.guardrails.loopBreaker ? 1 : 0);

    const a = animRef.current;
    if (activeCount !== a.prevActiveCount) {
      const dir = activeCount > a.prevActiveCount ? 1 : -1;
      a.toggleKick = 1.0;
      a.spinKick += dir * 0.55;
      a.prevActiveCount = activeCount;
    }

    a.toggleKick = THREE.MathUtils.damp(a.toggleKick, 0, 4.2, dt);
    a.spinKick = THREE.MathUtils.damp(a.spinKick, 0, 3.4, dt);
    a.smoothCalm = THREE.MathUtils.damp(a.smoothCalm, activeCount / 3, 3.2, dt);

    const beatRate = THREE.MathUtils.lerp(2.6, 1.35, a.smoothCalm);
    a.clock += dt * beatRate;

    const breath =
      1 +
      Math.sin(a.clock) * (0.028 + (1 - a.smoothCalm) * 0.015) +
      a.toggleKick * 0.095;

    const inter = interactionRef.current;
    if (!inter.dragging) {
      inter.velX *= Math.exp(-dt * 4.5);
      inter.velY *= Math.exp(-dt * 4.5);
      inter.rotY += inter.velY + (0.22 + a.spinKick) * dt;
      inter.rotX = THREE.MathUtils.damp(inter.rotX + inter.velX, 0.14, 2.2, dt);
    }

    if (groupRef.current) {
      groupRef.current.position.x = isPhone ? 0 : 0.22;
      groupRef.current.rotation.y = inter.rotY;
      groupRef.current.rotation.x = inter.rotX;
      groupRef.current.rotation.z = Math.sin(a.clock * 0.45) * 0.05;
      groupRef.current.scale.setScalar(breath * 0.85);
    }

    if (a.smoothCalm < 0.5) {
      const t = a.smoothCalm * 2;
      palette.targetNode.copy(palette.warn).lerp(palette.ocean, t);
      palette.targetLine.copy(palette.warn).lerp(palette.ocean, t * 0.85);
    } else {
      const t = (a.smoothCalm - 0.5) * 2;
      palette.targetNode.copy(palette.ocean).lerp(palette.sage, t * 0.72);
      palette.targetLine.copy(palette.ocean).lerp(palette.sage, t * 0.5);
    }
    palette.targetSignal.copy(palette.spark).lerp(palette.sage, a.smoothCalm * 0.6);

    nodeMat.color.lerp(palette.targetNode, Math.min(1, dt * 6));
    lineMat.color.lerp(palette.targetLine, Math.min(1, dt * 6));
    signalMat.color.lerp(palette.targetSignal, Math.min(1, dt * 6));
    lineMat.opacity = baseLineOpacity + a.toggleKick * 0.18;
    nodeMat.size = baseNodeSize * (1 + a.toggleKick * 0.25);

    // 1. Deform cortex particle positions
    const posAttr = nodeGeo.getAttribute("position") as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const base = data.basePositions;
    const mx = inter.hovering ? inter.hoverX * 1.4 : 99;
    const my = inter.hovering ? inter.hoverY * 1.4 : 99;
    const rippleOn = inter.hovering && !isPhone;

    for (let i = 0; i < data.nodeCount; i++) {
      const i3 = i * 3;
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      const wave =
        Math.sin(a.clock * 1.15 + bx * 2.4 + bz * 2.1) *
        (0.014 + a.toggleKick * 0.04);

      let ox = bx * (1 + wave);
      let oy = by * (1 + wave);
      let oz = bz * (1 + wave);

      if (rippleOn) {
        const dx = ox - mx;
        const dy = oy - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < 0.75) {
          const push = (1 - distSq / 0.75) * 0.16;
          ox += dx * push;
          oy += dy * push;
          oz += push * 0.35;
        }
      }

      posArr[i3] = ox;
      posArr[i3 + 1] = oy;
      posArr[i3 + 2] = oz;
    }
    posAttr.needsUpdate = true;

    // 2. Weld every synaptic line endpoint directly to the live deformed vertices
    const lineAttr = lineGeo.getAttribute("position") as THREE.BufferAttribute;
    const lineArr = lineAttr.array as Float32Array;
    const indices = data.lineIndices;
    for (let i = 0; i < indices.length; i++) {
      const n3 = indices[i] * 3;
      const l3 = i * 3;
      lineArr[l3] = posArr[n3];
      lineArr[l3 + 1] = posArr[n3 + 1];
      lineArr[l3 + 2] = posArr[n3 + 2];
    }
    lineAttr.needsUpdate = true;

    // 3. Move traveling signals along those exact live synaptic segments
    const sigAttr = signalGeo.getAttribute("position") as THREE.BufferAttribute;
    const sigArr = sigAttr.array as Float32Array;
    const sigSpeedBoost = 1 + a.toggleKick * 1.8;

    for (let k = 0; k < data.signalEdges.length; k++) {
      const [idxA, idxB, speed, phase] = data.signalEdges[k];
      const t = (a.clock * 0.45 * speed * sigSpeedBoost + phase) % 1;
      const a3 = idxA * 3;
      const b3 = idxB * 3;
      sigArr[k * 3] = posArr[a3] + (posArr[b3] - posArr[a3]) * t;
      sigArr[k * 3 + 1] = posArr[a3 + 1] + (posArr[b3 + 1] - posArr[a3 + 1]) * t;
      sigArr[k * 3 + 2] = posArr[a3 + 2] + (posArr[b3 + 2] - posArr[a3 + 2]) * t;
    }
    sigAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[isPhone ? 0 : 0.22, 0, 0]} scale={0.85}>
      <points geometry={nodeGeo} material={nodeMat} />
      <lineSegments geometry={lineGeo} material={lineMat} />
      <points geometry={signalGeo} material={signalMat} />
    </group>
  );
}

export default function NeuralBrain() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isPhone, prefersReducedMotion, mounted } = useBreakpoint();
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [deferredReady, setDeferredReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  const interactionRef = useRef<InteractionRef>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rotX: 0.14,
    rotY: -0.45,
    hoverX: 0,
    hoverY: 0,
    hovering: false,
  });

  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const isConstrained =
      (typeof nav.hardwareConcurrency === "number" &&
        nav.hardwareConcurrency <= 2) ||
      Boolean(nav.connection?.saveData);
    setLowPower(isConstrained);

    let timer: number | undefined;
    let idleId: number | undefined;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(() => setDeferredReady(true), {
        timeout: 220,
      });
    } else {
      timer = window.setTimeout(() => setDeferredReady(true), 180);
    }
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const inter = interactionRef.current;
    inter.dragging = true;
    inter.lastX = e.clientX;
    inter.lastY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const inter = interactionRef.current;
    inter.hoverX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    inter.hoverY = -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    inter.hovering = true;

    if (inter.dragging) {
      const dx = e.clientX - inter.lastX;
      const dy = e.clientY - inter.lastY;
      inter.rotY += dx * 0.009;
      inter.rotX = Math.max(-0.9, Math.min(0.9, inter.rotX + dy * 0.008));
      inter.velY = dx * 0.0025;
      inter.velX = dy * 0.002;
      inter.lastX = e.clientX;
      inter.lastY = e.clientY;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    interactionRef.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onPointerLeave = () => {
    interactionRef.current.hovering = false;
    interactionRef.current.dragging = false;
  };

  if (!mounted || !deferredReady || contextLost) {
    return <div className="h-full w-full" aria-hidden="true" />;
  }

  const maxDpr = lowPower ? 1 : isPhone ? 1.25 : 1.5;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Interactive 3D neural network brain reacting to Spanrail guardrails. Drag to rotate."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerLeave}
      onPointerLeave={onPointerLeave}
      className="h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      <Canvas
        dpr={[1, maxDpr]}
        frameloop={inView && !tabHidden && !prefersReducedMotion ? "always" : "demand"}
        camera={{ position: [0, 0.1, 4.15], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (ev) => {
              ev.preventDefault();
              setContextLost(true);
            },
            false
          );
          gl.domElement.addEventListener(
            "webglcontextrestored",
            () => setContextLost(false),
            false
          );
        }}
      >
        <NeuralBrainMesh isPhone={isPhone} interactionRef={interactionRef} />
      </Canvas>
    </div>
  );
}