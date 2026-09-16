import { LABELS, type Vector } from "@/lib/taste";
export default function Radar({
  vector,
  comparison,
}: {
  vector: Vector;
  comparison?: Vector;
}) {
  const point = (k: number, r: number) => [
    150 + Math.sin((k * Math.PI) / 3) * r,
    145 - Math.cos((k * Math.PI) / 3) * r,
  ];
  const polygon = (v: Vector) =>
    v.map((n, k) => point(k, n * 92).join(",")).join(" ");
  return (
    <svg
      className="radar"
      viewBox="0 0 300 290"
      role="img"
      aria-label={`내 취향: ${LABELS.map((n, i) => `${n} ${Math.round(vector[i] * 100)}`).join(", ")}`}
    >
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={polygon(Array(6).fill(r))}
          fill={r === 1 ? "#faf9f6" : "none"}
          stroke="#e8e6df"
        />
      ))}
      {LABELS.map((label, k) => {
        const [x, y] = point(k, 118);
        return (
          <g key={label}>
            <line
              x1="150"
              y1="145"
              x2={point(k, 92)[0]}
              y2={point(k, 92)[1]}
              stroke="#e8e6df"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#77766d"
              fontSize="12"
            >
              {label}
            </text>
          </g>
        );
      })}
      {comparison && (
        <polygon
          points={polygon(comparison)}
          fill="#7d917120"
          stroke="#829975"
          strokeDasharray="4 4"
          strokeWidth="2"
        />
      )}
      <polygon
        points={polygon(vector)}
        fill="#ef724330"
        stroke="#ef7243"
        strokeWidth="2.5"
      />
      {vector.map((n, k) => (
        <circle
          key={k}
          cx={point(k, n * 92)[0]}
          cy={point(k, n * 92)[1]}
          r="3.5"
          fill="#ef7243"
          stroke="white"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
