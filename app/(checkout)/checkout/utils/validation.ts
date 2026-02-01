import { z } from "zod";

// 🟢 1. Helper: Luhn Algorithm for Credit Card Validation
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

// 🟢 2. Main Schema
export const bookingSchema = z.object({
  
  // --- Contact Info ---
  contact: z.object({
    email: z.string().email("Please enter a valid email address"),
    // ❌ REMOVED: passportCountry এখান থেকে সরানো হয়েছে
    phone: z.string()
      .min(10, "Phone number is too short")
      .max(15, "Phone number is too long")
      .regex(/^\+?[0-9]+$/, "Phone number contains invalid characters"),
  }),

  // --- Passenger Info ---
  passengers: z.array(
    z.object({
      type: z.enum(["adult", "child", "infant", "infant_without_seat"]),
      id: z.string().min(1),
      title: z.string().min(1, "Title is required"),
      firstName: z.string().min(2).regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
      middleName: z.string().optional(),
      lastName: z.string().min(2).regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
      dob: z.string().min(1).refine((d) => !isNaN(new Date(d).getTime()), "Invalid date"),
      gender: z.enum(["male", "female"]),
      
      // Passport Info
      passportNumber: z.string().toUpperCase().regex(/^[A-Z0-9]{6,9}$/, "Invalid Passport format").optional().or(z.literal('')), 
      passportExpiry: z.string().optional().or(z.literal('')),
      
      // 🟢 FIXED: Added here correctly
      passportCountry: z.string().length(2, "Invalid Country Code").optional().or(z.literal('')), 
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
        if ((data.type === "infant" || data.type === "infant_without_seat") && age >= 2) ctx.addIssue({ code: "custom", message: "Infant must be < 2", path: ["dob"] });
    })
  ),

  // --- Payment Info ---
  payment: z.object({
    cardName: z.string()
      .min(2, "Name required")
      .regex(/^[a-zA-Z\s.-]+$/, "Name must match card (letters only)"),
    
    cardNumber: z.string()
      .transform(val => val.replace(/\D/g, "")) 
      .refine(val => /^\d{13,19}$/.test(val), "Card number must be 13–19 digits")
      .refine(isValidLuhn, "Invalid card number (Checksum Failed)"),
    
    expiryDate: z.string()
      .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Format must be MM/YY")
      .refine((val) => {
        if(!val.includes('/')) return false;
        const [month, year] = val.split('/');
        
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        const expMonth = parseInt(month, 10);
        const expYear = parseInt(year, 10);

        if (expYear < currentYear) return false;
        if (expYear === currentYear && expMonth < currentMonth) return false;
        
        return true;
      }, "Card has expired"),

    cvv: z.string().regex(/^[0-9]{3,4}$/, "CVV must be 3 or 4 digits"),

    billingAddress: z.object({
      street: z.string().min(5, "Address too short"),
      city: z.string().min(2, "City required"),
      state: z.string().min(2, "State required"),
      zipCode: z.string().min(3, "Invalid Zip Code"),
      country: z.string().min(2, "Country required"),
    })
  })
});

export type BookingFormData = z.infer<typeof bookingSchema>;