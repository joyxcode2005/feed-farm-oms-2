import { useMemo } from "react";

interface Item {
  quantityBags: number;
  pricePerBag: number;
}

export const useOrdercalculations = (
  items: Item[],
  discountType: string,
  discountValue: number
) => {
  return useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantityBags * item.pricePerBag,
      0
    );

    const discountAmount =
      discountType === "NONE"
        ? 0
        : discountType === "FLAT"
        ? discountValue
        : (subtotal * discountValue) / 100;

    const finalAmount = Math.max(0, subtotal - discountAmount);

    return { subtotal, discountAmount, finalAmount };
  }, [items, discountType, discountValue]);
};
