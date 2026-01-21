export const MAX_RESULT_LIMIT=100

export const calculateMarkup = (amountStr: string | null | undefined, currency: string) => {
  const basePrice = parseFloat(amountStr || '0');
  
  // --- 3. MARKUP LOGIC ---
  const COMMISSION_PERCENTAGE = 0.00; // 0% Commission for now

  const markupAmount = basePrice * COMMISSION_PERCENTAGE;
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