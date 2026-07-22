/** Shared by ProductDetailPage and OrderDetailPage's review UI so the rating display stays consistent everywhere. */
export default function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <span className="text-yellow-500" aria-label={`${value.toFixed(1)} / 5`}>
      {"★".repeat(rounded)}
      <span className="text-gray-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
