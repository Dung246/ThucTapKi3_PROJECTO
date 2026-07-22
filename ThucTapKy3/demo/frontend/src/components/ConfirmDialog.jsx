// Shared confirmation modal, reused by every destructive/hard-to-undo action across the app
// (logout, delete category, hide product, lock customer, remove cart item) instead of each page
// building its own popup or falling back to the browser's native window.confirm() - matches the
// app's existing navy/Tailwind visual language rather than an unstyled native alert box.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded shadow-lg p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>}
        {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-1.5 rounded border hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 py-1.5 rounded text-white ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-900 hover:bg-blue-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
