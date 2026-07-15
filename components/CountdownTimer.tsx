"use client";

import { useEffect, useState, useRef } from "react";

interface Props {
  startDateStr: string;
  endDateStr: string;
}

export default function CountdownTimer({ startDateStr, endDateStr }: Props) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    status: "before" | "active" | "ended";
  } | null>(null);

  const prevSecsRef = useRef<number>(-1);
  const [tickKey, setTickKey] = useState(0);

  useEffect(() => {
    if (!startDateStr || !endDateStr) return;

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const calculate = () => {
      const now = new Date();
      let diff = 0;
      let status: "before" | "active" | "ended" = "ended";

      if (now < start) {
        diff = start.getTime() - now.getTime();
        status = "before";
      } else if (now <= end) {
        diff = end.getTime() - now.getTime();
        status = "active";
      } else {
        diff = 0;
        status = "ended";
      }

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (seconds !== prevSecsRef.current) {
        prevSecsRef.current = seconds;
        setTickKey((k) => k + 1);
      }

      setTimeLeft({ days, hours, minutes, seconds, status });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startDateStr, endDateStr]);

  if (!timeLeft || timeLeft.status === "ended") return null;

  const isBefore = timeLeft.status === "before";
  const accentColor = isBefore ? "var(--gold)" : "#f87171";
  const accentGlow = isBefore ? "rgba(201,162,39,0.4)" : "rgba(239,68,68,0.4)";
  const accentBg = isBefore ? "rgba(201,162,39,0.08)" : "rgba(239,68,68,0.08)";
  const label = isBefore ? "Recruitment Opens In" : "Applications Close In";
  const emoji = isBefore ? "⏳" : "🚨";

  const pad = (n: number) => String(n).padStart(2, "0");

  const units = [
    { value: timeLeft.days,    label: "Days" },
    { value: timeLeft.hours,   label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <div style={{ margin: "24px 0 32px" }}>
      {/* Label */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "8px", marginBottom: "16px",
      }}>
        <span style={{ fontSize: "16px", animation: "spin 2s linear infinite", display: "inline-block" }}>
          {emoji}
        </span>
        <span style={{
          fontSize: "11px", fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.18em",
          color: accentColor,
        }}>
          {label}
        </span>
        <span style={{ fontSize: "16px", animation: "spin 2s linear infinite reverse", display: "inline-block" }}>
          {emoji}
        </span>
      </div>

      {/* Digit blocks */}
      <div style={{
        display: "flex", gap: "6px", justifyContent: "center", alignItems: "stretch",
      }}>
        {units.map((unit, idx) => {
          const isSeconds = unit.label === "Secs";
          return (
            <div key={unit.label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                background: accentBg,
                border: `1px solid ${accentColor}`,
                borderRadius: "12px",
                padding: "14px 16px",
                minWidth: "72px",
                boxShadow: `0 0 20px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                position: "relative", overflow: "hidden",
              }}>
                {/* Top shine line */}
                <div style={{
                  position: "absolute", top: 0, left: "10%", right: "10%",
                  height: "1px",
                  background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
                  opacity: 0.5,
                }} />

                <span
                  key={isSeconds ? tickKey : unit.value}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                    fontWeight: 900,
                    color: accentColor,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                    display: "block",
                    animation: isSeconds ? "fadeInUp 0.2s ease" : undefined,
                  }}
                >
                  {pad(unit.value)}
                </span>
                <span style={{
                  fontSize: "9px", color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase", marginTop: "6px",
                  fontWeight: 700, letterSpacing: "0.08em",
                }}>
                  {unit.label}
                </span>
              </div>

              {/* Separator colon */}
              {idx < 3 && (
                <span style={{
                  fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                  fontWeight: 900,
                  color: accentColor,
                  opacity: 0.5,
                  margin: "0 2px",
                  paddingBottom: "16px",
                  userSelect: "none",
                  animation: "pulse 1s step-end infinite",
                }}>:</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {isBefore && startDateStr && endDateStr && (
        <div style={{ marginTop: "14px", display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "220px", height: "3px",
            background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden",
          }}>
            <div style={{
              width: "30%", height: "100%",
              background: `linear-gradient(to right, transparent, ${accentColor})`,
              borderRadius: "2px",
              animation: "shimmer 2s ease-in-out infinite",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
