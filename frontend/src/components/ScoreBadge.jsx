import React from "react";

export default function ScoreBadge({ score }) {
  let className = "score-badge score-low";
  if (score >= 70) className = "score-badge score-high";
  else if (score >= 40) className = "score-badge score-mid";

  return <span className={className}>{score}</span>;
}
