import { ORDER_STATUS_BADGE_CLASSES, orderStatusLabel } from "../utils/orderStatus";

export default function OrderStatusBadge({ status }) {
  const classes = ORDER_STATUS_BADGE_CLASSES[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${classes}`}>
      {orderStatusLabel(status)}
    </span>
  );
}
