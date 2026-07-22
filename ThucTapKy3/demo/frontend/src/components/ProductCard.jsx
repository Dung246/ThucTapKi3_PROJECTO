import { Link } from "react-router-dom";
import { resolveImageUrl } from "../services/api";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ProductCard({ product, canAddToCart, onAddToCart, adding }) {
  return (
    <div className="bg-white border rounded shadow-sm flex flex-col overflow-hidden">
      <Link to={`/products/${product.id}`} className="block bg-gray-100 h-40 flex items-center justify-center">
        {product.imageUrl ? (
          <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">[Ảnh]</span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/products/${product.id}`} className="font-medium text-sm hover:text-blue-800 line-clamp-2">
          {product.name}
        </Link>
        <p className="text-xs text-gray-500 mt-1">{product.categoryName}</p>
        <p className="text-blue-900 font-semibold mt-2">{currency.format(product.price)}</p>
        <p className="text-xs text-gray-400">Còn lại: {product.quantity}</p>

        {canAddToCart && (
          <button
            onClick={() => onAddToCart(product)}
            disabled={adding || product.quantity <= 0}
            className="mt-auto pt-3 text-sm bg-blue-900 text-white rounded py-1.5 hover:bg-blue-800 disabled:opacity-50"
          >
            {product.quantity <= 0 ? "Hết hàng" : adding ? "Đang thêm..." : "Thêm vào giỏ"}
          </button>
        )}
      </div>
    </div>
  );
}
