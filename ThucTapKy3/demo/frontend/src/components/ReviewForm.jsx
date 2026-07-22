import { useState } from "react";
import { submitReview } from "../services/reviewService";

export default function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const review = await submitReview(productId, { rating, comment });
      onSubmitted(review);
    } catch (err) {
      // Belt-and-suspenders: the parent only renders this form when it believes the customer is
      // eligible and hasn't reviewed yet, but a 403/409 can still land here on a race (e.g. reviewed
      // from another tab). Surface the backend's message verbatim rather than failing silently.
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-3 mt-2 bg-gray-50">
      {error && <div className="mb-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</div>}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-xl leading-none ${n <= rating ? "text-yellow-500" : "text-gray-300"}`}
            aria-label={`${n} sao`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Nhận xét của bạn (không bắt buộc)..."
        className="w-full border rounded px-2 py-1.5 text-sm mb-2"
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-900 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}
