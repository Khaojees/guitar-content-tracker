"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Button, Typography, Slider, InputNumber } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function MetronomePage() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tapStateRef = useRef<{
    lastTapTime: number;
    averageInterval: number;
    intervalCount: number;
    totalTapCount: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
  }>({
    lastTapTime: 0,
    averageInterval: 0,
    intervalCount: 0,
    totalTapCount: 0,
    timeoutId: null,
  });
  const [tapStatus, setTapStatus] = useState<{
    isActive: boolean;
    taps: number;
    bpm: number | null;
  }>({
    isActive: false,
    taps: 0,
    bpm: null,
  });

  // Initialize AudioContext
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      const tapState = tapStateRef.current;
      if (tapState.timeoutId) {
        clearTimeout(tapState.timeoutId);
        tapState.timeoutId = null;
      }
    };
  }, []);

  // Play click sound
  const playClick = useCallback((isAccent = false) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Use moderate frequency for natural "tick" sound
    oscillator.frequency.value = isAccent ? 1200 : 800;
    oscillator.type = "sine";

    // Create sharp attack and quick decay envelope for "tick" sound
    const now = ctx.currentTime;
    const attackTime = 0.001; // Very fast attack (1ms)
    const decayTime = 0.02; // Quick decay (20ms)

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isAccent ? 0.5 : 0.3, now + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + attackTime + decayTime);

    oscillator.start(now);
    oscillator.stop(now + attackTime + decayTime);
  }, []);

  // Start/Stop metronome
  useEffect(() => {
    let isCancelled = false;

    if (isPlaying) {
      const startMetronome = async () => {
        let ctx = audioContextRef.current;

        if (!ctx && typeof window !== "undefined") {
          ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = ctx;
        }

        if (ctx && ctx.state === "suspended") {
          try {
            await ctx.resume();
          } catch (error) {
            console.warn("Failed to resume AudioContext", error);
          }
        }

        if (isCancelled) {
          return;
        }

        playClick(true);
        setBeat(0);

        const interval = 60000 / bpm; // Convert BPM to milliseconds
        let currentBeat = 1;

        intervalRef.current = setInterval(() => {
          playClick(currentBeat === 0);
          setBeat(currentBeat);
          currentBeat = (currentBeat + 1) % 4;
        }, interval);
      };

      startMetronome();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setBeat(0);
    }

    return () => {
      isCancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, playClick]);

  const handleBpmChange = (value: number | null) => {
    if (value && value >= 30 && value <= 300) {
      setBpm(value);
    }
  };

  const incrementBpm = () => {
    setBpm((prev) => Math.min(300, prev + 1));
  };

  const decrementBpm = () => {
    setBpm((prev) => Math.max(30, prev - 1));
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleTapTempo = () => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const tapState = tapStateRef.current;

    if (tapState.timeoutId) {
      clearTimeout(tapState.timeoutId);
      tapState.timeoutId = null;
    }

    const MIN_RESET_WINDOW = 400;
    const MAX_RESET_WINDOW = 4000;

    const dynamicResetWindow = (
      baseInterval: number | null,
      { useMaxFallback = false }: { useMaxFallback?: boolean } = {},
    ) => {
      if (useMaxFallback) {
        return MAX_RESET_WINDOW;
      }

      const fallbackInterval =
        baseInterval ??
        (tapState.averageInterval || 60000 / Math.max(bpm, 30));
      return Math.min(
        Math.max(fallbackInterval * 1.75, MIN_RESET_WINDOW),
        MAX_RESET_WINDOW,
      );
    };

    const scheduleReset = (windowMs: number) => {
      tapState.timeoutId = setTimeout(() => {
        const state = tapStateRef.current;
        state.lastTapTime = 0;
        state.averageInterval = 0;
        state.intervalCount = 0;
        state.totalTapCount = 0;
        state.timeoutId = null;
        setTapStatus({ isActive: false, taps: 0, bpm: null });
      }, windowMs);
    };

    const lastTapTime = tapState.lastTapTime;
    const interval = lastTapTime ? now - lastTapTime : null;

    if (!interval) {
      tapState.lastTapTime = now;
      tapState.averageInterval = 0;
      tapState.intervalCount = 0;
      tapState.totalTapCount = 1;
      setTapStatus({ isActive: true, taps: 1, bpm: null });
      scheduleReset(dynamicResetWindow(null, { useMaxFallback: true }));
      return;
    }

    const hasAverage = tapState.intervalCount > 0;
    const currentAverage = tapState.averageInterval || interval;
    const resetWindow = dynamicResetWindow(
      hasAverage ? currentAverage : interval,
    );
    const exceededResetWindow = interval > resetWindow;
    const intervalTolerance = hasAverage ? currentAverage * 0.45 : Infinity;
    const isOutOfTolerance =
      hasAverage &&
      Math.abs(interval - tapState.averageInterval) > intervalTolerance;

    if (!hasAverage || exceededResetWindow || isOutOfTolerance) {
      tapState.averageInterval = interval;
      tapState.intervalCount = 1;
      tapState.totalTapCount = 2;
    } else {
      tapState.intervalCount += 1;
      tapState.totalTapCount += 1;
      tapState.averageInterval +=
        (interval - tapState.averageInterval) / tapState.intervalCount;
    }

    tapState.lastTapTime = now;

    const calculatedBpm = Math.round(60000 / tapState.averageInterval);
    const isBpmValid =
      tapState.intervalCount >= 1 &&
      calculatedBpm >= 30 &&
      calculatedBpm <= 300;

    setTapStatus({
      isActive: true,
      taps: Math.max(tapState.totalTapCount, tapState.intervalCount + 1),
      bpm: isBpmValid ? calculatedBpm : null,
    });

    if (isBpmValid) {
      setBpm(calculatedBpm);
    }

    scheduleReset(dynamicResetWindow(tapState.averageInterval));
  };

  const stepButtonClass =
    "!flex !h-16 !w-16 !items-center !justify-center !rounded-full !border-2 !border-slate-200 !bg-slate-50 !p-0 !text-3xl !font-bold !text-slate-600 !transition-all hover:!border-indigo-300 hover:!bg-indigo-100 hover:!text-indigo-600 disabled:!cursor-not-allowed disabled:!border-slate-200 disabled:!bg-slate-100 disabled:!text-slate-300";

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Card className="glass-surface mx-auto w-full max-w-2xl border-none bg-white/95 shadow-2xl">
        <div className="flex flex-col items-center gap-8 p-6">
          {/* Title */}
          <div className="text-center">
            <Title level={2} className="!mb-2 !text-slate-900">
              Metronome
            </Title>
            <Text className="text-slate-500">
              Keep your rhythm in perfect time
            </Text>
          </div>

          {/* Visual Beat Indicator */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full transition-all duration-100 ${
                  isPlaying && beat === i
                    ? i === 0
                      ? "bg-indigo-500 shadow-lg shadow-indigo-500/50 scale-150"
                      : "bg-indigo-400 shadow-md shadow-indigo-400/50 scale-125"
                    : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* BPM Display and Controls */}
          <div className="flex w-full flex-col items-center gap-6">
            {/* Large BPM Display */}
            <div className="flex items-center gap-4">
              <Button
                type="text"
                size="large"
                onClick={decrementBpm}
                disabled={bpm <= 30}
                className={stepButtonClass}
                aria-label="Decrease BPM"
              >
                <span className="leading-none">-</span>
              </Button>

              <div className="flex flex-col items-center">
                <InputNumber
                  value={bpm}
                  onChange={handleBpmChange}
                  min={30}
                  max={300}
                  controls={false}
                  className="bpm-display"
                  style={{
                    width: "180px",
                    fontSize: "64px",
                    fontWeight: "bold",
                    textAlign: "center",
                    border: "none",
                  }}
                />
                <Text className="text-2xl font-semibold text-slate-600">
                  BPM
                </Text>
              </div>

              <Button
                type="text"
                size="large"
                onClick={incrementBpm}
                disabled={bpm >= 300}
                className={stepButtonClass}
                aria-label="Increase BPM"
              >
                <span className="leading-none">+</span>
              </Button>
            </div>

            {/* Slider */}
            <div className="w-full px-4">
              <Slider
                value={bpm}
                onChange={handleBpmChange}
                min={30}
                max={300}
                tooltip={{ formatter: (value) => `${value} BPM` }}
                className="bpm-slider"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>30</span>
                <span>300</span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex w-full flex-col gap-3">
            <Button
              type="primary"
              size="large"
              icon={
                isPlaying ? (
                  <PauseCircleOutlined className="!text-2xl" />
                ) : (
                  <PlayCircleOutlined className="!text-2xl" />
                )
              }
              onClick={togglePlayPause}
              className="!flex !h-16 !items-center !justify-center !gap-2 !rounded-full !text-lg !font-semibold !shadow-lg !shadow-indigo-500/25"
            >
              {isPlaying ? "STOP" : "START"}
            </Button>

            <Button
              type="default"
              size="large"
              icon={<ThunderboltOutlined className="!text-xl" />}
              onClick={handleTapTempo}
              className="!flex !h-14 !items-center !justify-center !gap-2 !rounded-full !border-2 !border-indigo-200 !text-base !font-semibold !text-indigo-600 hover:!border-indigo-300 hover:!text-indigo-700"
            >
              TAP TEMPO
            </Button>
          </div>

          {/* Info */}
          <div className="text-center space-y-1">
            <Text className="text-sm text-slate-400">
              Tap the tempo button multiple times to set BPM by rhythm
            </Text>
            <Text
              className={`text-xs ${
                tapStatus.isActive ? "text-indigo-500" : "text-slate-300"
              }`}
            >
              {tapStatus.isActive
                ? tapStatus.bpm
                  ? `Tap session active · ≈${tapStatus.bpm} BPM (${tapStatus.taps} tap${
                      tapStatus.taps === 1 ? "" : "s"
                    })`
                  : `Tap session active · waiting for next tap (${tapStatus.taps} tap${
                      tapStatus.taps === 1 ? "" : "s"
                    })`
                : "Tap session reset"}
            </Text>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        .bpm-display .ant-input-number-input {
          text-align: center;
          font-size: 64px;
          font-weight: bold;
          color: #1e293b;
          padding: 0;
          height: 80px;
        }

        .bpm-display .ant-input-number-input:focus {
          box-shadow: none;
        }

        .bpm-slider .ant-slider-rail {
          background: #e2e8f0;
          height: 8px;
        }

        .bpm-slider .ant-slider-track {
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          height: 8px;
        }

        .bpm-slider .ant-slider-handle {
          width: 24px;
          height: 24px;
          margin-top: -4px;
          border: 4px solid #6366f1;
          background: white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .bpm-slider .ant-slider-handle::after {
          display: none;
        }

        .bpm-slider .ant-slider-handle:hover,
        .bpm-slider .ant-slider-handle:focus {
          border-color: #4f46e5;
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
}
