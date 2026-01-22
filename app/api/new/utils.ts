import {  TICKET_PRICE_COMMISION_AMOUNT_PERCENT } from "@/constant/flight";

export const MAX_RESULT_LIMIT=500

export const calculateMarkup = (
  amountStr: string | null | undefined,
  currency: string,
) => {
  const basePrice = parseFloat(amountStr || '0');

  // convert percent to decimal (5% -> 0.05)
  const commissionRate = TICKET_PRICE_COMMISION_AMOUNT_PERCENT / 100;

  const markupAmount = basePrice * commissionRate;
  const finalPrice = Math.ceil(basePrice + markupAmount);

  return {
    currency,
    basePrice,
    markup: Math.ceil(markupAmount),
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