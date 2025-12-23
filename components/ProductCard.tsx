import React from "react";
import { Product } from "../types";
import { ShoppingCart, Heart, Sparkles, Layers } from "lucide-react";
import { fmtCurrency, getDisplayImageUrl } from "../utils/format";
import {
  radius,
  shadows,
  typography,
  buttonStyles,
} from "../styles/design-system";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  hasModifiers?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdd,
  hasModifiers,
}) => {
  const isFlexible =
    product.category.toLowerCase() === "donasi" ||
    product.priceType === "FLEXIBLE";
  const isPhysical = product.stockType === "STOK_FISIK";

  // Jika stok fisik habis, atau available disetting OFF, maka produk tidak bisa diorder
  const isDisabled = (isPhysical && product.stock <= 0) || !product.available;

  return (
    <div
      className={`bg-white ${radius.lg} p-3 ${shadows.sm} hover:${
        shadows.xl
      } transition-all duration-300 flex flex-col group h-full border ${
        isFlexible ? "border-amber-200 bg-amber-50/30" : "border-gray-50"
      } ${isDisabled ? "opacity-75" : ""}`}
    >
      <div
        className={`relative mb-2 overflow-hidden ${radius.md} h-28 flex-shrink-0`}
      >
        <img
          src={getDisplayImageUrl(product.image)}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            isDisabled ? "grayscale" : ""
          }`}
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFlexible ? (
            <span
              className={`bg-amber-500 text-white ${typography.labelSmall} px-2 py-0.5 ${radius.full} ${shadows.lg} flex items-center gap-1`}
            >
              <Sparkles size={8} fill="currentColor" /> OPEN PRICE
            </span>
          ) : isPhysical ? (
            <span
              className={`text-white ${typography.labelSmall} px-2 py-0.5 ${
                radius.full
              } ${shadows.lg} border ${
                product.stock <= 0
                  ? "bg-rose-500 border-rose-400"
                  : "bg-emerald-500 border-emerald-400"
              }`}
            >
              SISA: {product.stock}
            </span>
          ) : (
            <span
              className={`text-white ${typography.labelSmall} px-2 py-0.5 ${
                radius.full
              } ${shadows.lg} border ${
                product.available
                  ? "bg-blue-500 border-blue-400"
                  : "bg-gray-400 border-gray-300"
              }`}
            >
              {product.available ? "● ON" : "○ OFF"}
            </span>
          )}
        </div>

        {/* Modifier Indicator */}
        {hasModifiers && !isDisabled && (
          <div className="absolute top-2 right-2">
            <span
              className={`bg-violet-500 text-white ${typography.labelSmall} px-2 py-0.5 ${radius.full} ${shadows.lg} flex items-center gap-1`}
            >
              <Layers size={8} /> VARIAN
            </span>
          </div>
        )}

        {isDisabled && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span
              className={`bg-gray-800/90 text-white ${typography.label} px-3 py-1 ${radius.full} border border-white/20`}
            >
              {product.stock <= 0 && isPhysical ? "Habis" : "Tutup"}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3
            className={`${typography.h4} text-gray-800 text-[11px] leading-tight line-clamp-2 pr-1`}
          >
            {product.name}
          </h3>
        </div>
        <p
          className={`${
            isFlexible ? "text-amber-600" : "text-emerald-600"
          } font-black text-xs mb-3`}
        >
          {isFlexible ? "Input Harga" : fmtCurrency(product.price)}
        </p>

        <button
          onClick={() => onAdd(product)}
          disabled={isDisabled}
          className={`mt-auto flex items-center justify-center gap-1.5 py-2.5 ${
            radius.md
          } ${typography.label} transition-all
            ${
              !isDisabled
                ? isFlexible
                  ? `${buttonStyles.variants.warning}`
                  : hasModifiers
                  ? "bg-violet-50 text-violet-700 hover:bg-violet-500 hover:text-white hover:shadow-lg shadow-violet-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:shadow-lg shadow-emerald-100"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          {isFlexible ? (
            <Heart size={12} fill="currentColor" />
          ) : hasModifiers ? (
            <Layers size={12} />
          ) : (
            <ShoppingCart size={12} />
          )}
          {isFlexible ? "Donasi" : hasModifiers ? "Pilih Varian" : "Tambah"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
