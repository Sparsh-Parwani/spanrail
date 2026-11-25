"use client";

import { useSpanrailStore } from "@/store/useSpanrailStore";

let audioCtx: AudioContext | null = null;
let lastSliderTickMs = 0;

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  return window.AudioContext ?? win.webkitAudioContext ?? null;
}

export function initSoundEngine(): boolean {
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return false;

  if (!audioCtx) {
    audioCtx = new Ctor();
  }

  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }

  return true;
}

function getReadyContext(): AudioContext | null {
  if (!useSpanrailStore.getState().isSoundEnabled) return null;
  if (!audioCtx) {
    initSoundEngine();
  }
  if (!audioCtx) return null;
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function playSwitchClick(isOn: boolean): void {
  const ctx = getReadyContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.024;

  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(isOn ? 1120 : 840, now);
  osc.frequency.exponentialRampToValueAtTime(isOn ? 520 : 380, now + duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(isOn ? 1850 : 1350, now);
  filter.Q.setValueAtTime(1.6, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.004);
}

export function playSliderTick(): void {
  const nowPerf =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  if (nowPerf - lastSliderTickMs < 45) return;

  const ctx = getReadyContext();
  if (!ctx) return;

  lastSliderTickMs = nowPerf;
  const now = ctx.currentTime;
  const duration = 0.007;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(2200, now);
  osc.frequency.exponentialRampToValueAtTime(1650, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.025, now + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.002);
}

export function playCoreStabilized(): void {
  const ctx = getReadyContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.34;
  const notes = [523.25, 783.99];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = now + idx * 0.028;
    const peak = idx === 0 ? 0.045 : 0.032;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.024);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  });
}

export function playSuccessConfirm(): void {
  const ctx = getReadyContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const tones = [
    { freq: 659.25, offset: 0, dur: 0.11, peak: 0.032 },
    { freq: 880.0, offset: 0.055, dur: 0.16, peak: 0.036 },
  ];

  tones.forEach(({ freq, offset, dur, peak }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = now + offset;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + dur + 0.015);
  });
}