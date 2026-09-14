import React, { useEffect, useState } from "react";

function bandClass(score) {
  if (score >= 70) return "score-high";
  if (score >= 40) return "score-mid";
  return "score-low";
}

export default function ScoreBadge({ score }) {
  return <span className={`score-badge ${bandClass(score)}`}>{score}</span>;
}

// Animated circular progress ring used in list rows and the lead detail hero card.
export function ScoreRing({ score, size = "sm" }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = size === "lg" ? 38 : 18;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // animate count-up on mount / score change
    let raf;
    const start = performance.now();
    const duration = 700;
    const from = 0;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(from + (score - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const offset = circumference - (displayScore / 100) * circumference;
  const box = size === "lg" ? 88 : 44;

  return (
    <div className={`score-ring ${bandClass(score)} ${size === "lg" ? "lg" : ""}`}>
      <svg viewBox={`0 0 ${box} ${box}`}>
        <circle className="ring-bg" cx={box / 2} cy={box / 2} r={radius} />
        <circle
          className="ring-fg"
          cx={box / 2}
          cy={box / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-value">{displayScore}</div>
    </div>
  );
}
