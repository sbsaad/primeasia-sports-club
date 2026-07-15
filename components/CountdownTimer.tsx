"use client";

import { useEffect, useState } from "react";

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

      setTimeLeft({ days, hours, minutes, seconds, status });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startDateStr, endDateStr]);

  if (!timeLeft || timeLeft.status === "ended") return null;

  const isBefore = timeLeft.status === "before";
  const label = isBefore ? "Recruitment Starts In" : "Application Deadline Closes In";
  const glowColor = isBefore ? "rgba(201,162,39,0.3)" : "rgba(239,68,68,0.3)";
  const borderColor = isBefore ? "rgba(201,162,39,0.2)" : "rgba(239,68,68,0.2)";
  const textColor = isBefore ? "var(--gold)" : "#f87171";

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ margin: "24px 0 32px" }} className="animate-fade-in">
      <div style={{
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        color: "var(--text-secondary)",
        marginBottom: "12px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px"
      }}>
        <span style={{ animation: "pulse 1.5s infinite" }}>{isBefore ? "⏳" : "🚨"}</span>
        <span>{label}</span>
      </div>
      
      <div style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" }
        ].map((unit, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center" }}>
            <div className="glass-card" style={{
              padding: "12px 14px",
              minWidth: "68px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderColor: borderColor,
              background: "rgba(255, 255, 255, 0.01)",
              boxShadow: `0 0 15px ${glowColor}`,
              borderRadius: "10px",
              transition: "transform 0.2s"
            }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
                fontWeight: 800,
                color: textColor,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums"
              }}>
                {pad(unit.value)}
              </span>
              <span style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginTop: "4px",
                fontWeight: 600,
                letterSpacing: "0.05em"
              }}>
                {unit.label}
              </span>
            </div>
            {idx < 3 && (
              <span style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.1)",
                marginLeft: "10px",
                userSelect: "none"
              }}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
