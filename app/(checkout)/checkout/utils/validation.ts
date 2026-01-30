import { z } from "zod";

// --- 1. Helper: Luhn Algorithm for Credit Card Validation ---
const isValidLuhn = (val: string) => {
  if (!val) return false;
  let checksum = 0;
  let j = 1;
  for (let i = val.length - 1; i >= 0; i--) {
    let calc = 0;
    calc = Number(val.charAt(i)) * j;
    if (calc > 9) {
      checksum = checksum + 1;
      calc = calc - 10;
    }
    checksum = checksum + calc;
    if (j == 1) { j = 2; } else { j = 1; }
  }
  return (checksum % 10) == 0;
};

// --- 2. Main Schema ---
export const bookingSchema = z.object({
  contact: z.object({
    email: z.string().email("Please enter a valid email address"),
    phone: z.string()
      .min(10, "Phone number is too short")
      .max(15, "Phone number is too long")
      .regex(/^\+?[0-9]+$/, "Phone number contains invalid characters"),
  }),

  passengers: z.array(
    z.object({
      type: z.enum(["adult", "child", "infant"]),
      id: z.string().min(1),
      title: z.string().min(1, "Title is required"),
      firstName: z.string().min(2).regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
      middleName: z.string().optional(),
      lastName: z.string().min(2).regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
      dob: z.string().min(1).refine((d) => !isNaN(new Date(d).getTime()), "Invalid date"),
      gender: z.enum(["male", "female"]),
      passportNumber: z.string().toUpperCase().regex(/^[A-Z0-9]{6,9}$/, "Invalid Passport format"),
      passportExpiry: z.string().min(1),
    })
    .superRefine((data, ctx) => {
        const birthDate = new Date(data.dob);
        const today = new Date();
        if (isNaN(birthDate.getTime())) return;
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }

        if (data.type === "adult" && age < 12) ctx.addIssue({ code: "custom", message: "Adult must be 12+", path: ["dob"] });
        if (data.type === "child" && (age < 2 || age >= 12)) ctx.addIssue({ code: "custom", message: "Child must be 2-11", path: ["dob"] });
        if (data.type === "infant" && age >= 2) ctx.addIssue({ code: "custom", message: "Infant must be < 2", path: ["dob"] });
        
        if (data.passportExpiry) {
           const expiry = new Date(data.passportExpiry);
           const minDate = new Date();
           minDate.setMonth(minDate.getMonth() + 6);
           if (expiry < minDate) {
               ctx.addIssue({ code: "custom", message: "Passport must be valid for 6+ months", path: ["passportExpiry"] });
           }
        }
    })
  ),

payment: z.object({
    cardHolderName: z.string()
      .min(2, "Name required")
      .regex(/^[a-zA-Z\s.-]+$/, "Name must match card (letters only)"),
    
    cardNumber: z.string()
      // 🟢 Allow digits AND spaces
      .regex(/^[\d\s]{15,23}$/, "Invalid card length") 
      .refine(isValidLuhn, "Invalid card number (checksum failed)"), 
    
    expiryDate: z.string()
      .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Format must be MM/YY")
      .refine((val) => {
        const [month, yearStr] = val.split("/");
        const year = 2000 + parseInt(yearStr);
        const expiry = new Date(year, parseInt(month)); 
        const now = new Date();
        // Check if card is expired (end of month)
        return expiry > now; 
      }, "Card has expired"),

    cvv: z.string().regex(/^[0-9]{3,4}$/, "CVV must be 3 or 4 digits"),

    billingAddress: z.object({
      line1: z.string().min(5, "Address too short"),
      city: z.string().min(2, "City required"),
      state: z.string().min(2, "State/Province required"),
      zipCode: z.string().min(3, "Invalid Zip/Postal Code"),
      country: z.string().min(2, "Country required"),
    })
  })
});

export type BookingFormData = z.infer<typeof bookingSchema>;