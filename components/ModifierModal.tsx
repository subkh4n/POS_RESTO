import React, { useState, useMemo } from "react";
import { X, Check, Plus, Minus } from "lucide-react";
import { Product, ModifierGroup, SelectedModifier } from "../types";

interface ModifierModalProps {
  product: Product;
  modifierGroups: ModifierGroup[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    product: Product,
    selectedModifiers: SelectedModifier[],
    modifierTotal: number
  ) => void;
}

const ModifierModal: React.FC<ModifierModalProps> = ({
  product,
  modifierGroups,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedModifiers, setSelectedModifiers] = useState<
    SelectedModifier[]
  >([]);

  // Filter groups that belong to this product
  const productGroups = useMemo(() => {
    if (!product.modifierGroupIds || product.modifierGroupIds.length === 0) {
      return [];
    }
    return modifierGroups.filter((g) =>
      product.modifierGroupIds?.includes(g.id)
    );
  }, [product, modifierGroups]);

  // Calculate total modifier price
  const modifierTotal = useMemo(() => {
    return selectedModifiers.reduce((sum, m) => sum + m.priceAdjust, 0);
  }, [selectedModifiers]);

  const finalPrice = product.price + modifierTotal;

  const handleSelectModifier = (
    group: ModifierGroup,
    itemId: string,
    itemName: string,
    priceAdjust: number
  ) => {
    setSelectedModifiers((prev) => {
      const newModifier: SelectedModifier = {
        id: itemId,
        name: itemName,
        priceAdjust,
        groupId: group.id,
        groupName: group.name,
      };

      if (group.type === "SINGLE") {
        // Remove any existing selection from this group and add new one
        const filtered = prev.filter((m) => m.groupId !== group.id);
        return [...filtered, newModifier];
      } else {
        // MULTIPLE: toggle selection
        const exists = prev.find((m) => m.id === itemId);
        if (exists) {
          return prev.filter((m) => m.id !== itemId);
        } else {
          // Check max limit
          const groupCount = prev.filter((m) => m.groupId === group.id).length;
          if (groupCount >= group.maxSelect) {
            return prev;
          }
          return [...prev, newModifier];
        }
      }
    });
  };

  const isSelected = (itemId: string) => {
    return selectedModifiers.some((m) => m.id === itemId);
  };

  const handleConfirm = () => {
    onConfirm(product, selectedModifiers, modifierTotal);
    setSelectedModifiers([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedModifiers([]);
    onClose();
  };

  // Validate if all required groups are satisfied
  const isValid = useMemo(() => {
    for (const group of productGroups) {
      if (group.required) {
        const count = selectedModifiers.filter(
          (m) => m.groupId === group.id
        ).length;
        if (count < group.minSelect) return false;
      }
    }
    return true;
  }, [productGroups, selectedModifiers]);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
          >
            <X size={18} className="text-gray-500" />
          </button>
          <h2 className="text-xl font-black text-slate-900 pr-10">
            {product.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Pilih variasi & topping</p>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto max-h-[50vh] p-6 space-y-6">
          {productGroups.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              Tidak ada pilihan tambahan
            </p>
          ) : (
            productGroups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {group.name}
                  </h3>
                  <span className="text-[9px] font-bold text-gray-400">
                    {group.required ? "Wajib" : "Opsional"} •{" "}
                    {group.type === "SINGLE"
                      ? "Pilih 1"
                      : `Max ${group.maxSelect}`}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const selected = isSelected(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          handleSelectModifier(
                            group,
                            item.id,
                            item.name,
                            item.priceAdjust
                          )
                        }
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          selected
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selected && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              selected ? "text-emerald-700" : "text-slate-700"
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-black ${
                            item.priceAdjust > 0
                              ? "text-amber-600"
                              : item.priceAdjust < 0
                              ? "text-emerald-600"
                              : "text-gray-400"
                          }`}
                        >
                          {item.priceAdjust > 0 && "+"}
                          {item.priceAdjust !== 0
                            ? formatPrice(item.priceAdjust)
                            : "Gratis"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">
                Total Harga
              </p>
              <p className="text-2xl font-black text-slate-900">
                {formatPrice(finalPrice)}
              </p>
            </div>
            {modifierTotal !== 0 && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400">
                  Dasar: {formatPrice(product.price)}
                </p>
                <p
                  className={`text-xs font-black ${
                    modifierTotal > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {modifierTotal > 0 ? "+" : ""}
                  {formatPrice(modifierTotal)}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isValid
                ? "bg-slate-900 text-white shadow-xl hover:bg-slate-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus size={18} />
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifierModal;
