import { COMMISION_RATE } from "@/constant/control";

export const MAX_RESULT_LIMIT=500

export const calculateMarkup = (
  amountStr: string | null | undefined,
  currency: string,
) => {
  const basePrice = Number.parseFloat(amountStr ?? '0');
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  // convert percent to decimal (5% -> 0.05)
  const commissionRate = COMMISION_RATE / 100;
  const rawMarkup = safeBasePrice * commissionRate;
  // business rule: always round UP
  const markup = Math.ceil(rawMarkup);
  const finalPrice = Math.ceil(safeBasePrice + rawMarkup);

  return {
    currency,
    basePrice: safeBasePrice,
    markup,
    finalPrice,
  };
};




// --- 4. HELPER: Time Duration Parser ---
export const formatDuration = (isoDuration: string | null | undefined) => {
  if (!isoDuration) return "";
  
  return isoDuration
    .replace("PT", "")
    .replace("H", "h ")
    .replace("M", "m")
    .toLowerCase()
    .trim();
};