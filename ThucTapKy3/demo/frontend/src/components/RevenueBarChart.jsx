const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

// Hand-rolled SVG bar chart instead of pulling in a charting library (recharts/chart.js): today is
// already a Docker-heavy day (new frontend Dockerfile + 3-service compose), so avoiding a new npm
// dependency removes one more thing that could break the container build. The dataset here (a
// handful of revenue periods) is far too small to need a real charting library's features.
export default function RevenueBarChart({ data }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Không có dữ liệu doanh thu trong khoảng thời gian này</p>;
  }

  const max = Math.max(...data.map((d) => Number(d.revenue)), 1);
  const width = 700;
  const height = 220;
  const barGap = 8;
  const barWidth = Math.max((width - barGap * (data.length - 1)) / data.length, 4);

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(width, data.length * (barWidth + barGap))} height={height + 40}>
        {data.map((d, i) => {
          const barHeight = (Number(d.revenue) / max) * height;
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          return (
            <g key={d.period}>
              <title>{`${d.period}: ${currency.format(d.revenue)}`}</title>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="#1e3a8a" rx={2} />
              <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
                {d.period}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
