import { z } from "zod";


export const bookingSchema = z.object({
  contact: z.object({
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(11, "Phone number must be at least 11 digits").regex(/^\+?[0-9]+$/, "Phone number contains invalid characters"),
  }),
  passengers: z.array(
    z.object({
      type: z.enum(["adult", "child", "infant"]),
      
      title: z.string().min(1, "Title is required"),
      
      firstName: z.string()
        .min(2, "First name must be at least 2 characters")
        .regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
      middleName: z.string().optional(),
      lastName: z.string()
        .min(2, "Last name must be at least 2 characters"),
      
      dob: z.string()
        .min(1, "Date of birth is required")
        .refine((date) => new Date(date) <= new Date(), {
          message: "Date of birth cannot be in the future",
        }),

      gender: z.enum(["male", "female"], { message: "Select gender" }),
      
      passportNumber: z.string()
        .toUpperCase()
        .min(6, "Passport number must be at least 6 characters")
        .max(9, "Invalid passport length")
        .regex(/^[A-Z0-9]+$/, "Passport must contain uppercase letters and numbers only"),
      passportExpiry: z.string()
        .min(1, "Passport expiry date is required")
        .refine((date) => {
          const expiryDate = new Date(date);
          const today = new Date();
          
          const minValidDate = new Date();
          minValidDate.setMonth(today.getMonth() + 6);
          return expiryDate >= minValidDate;
        }, {
          message: "Passport must be valid for at least 6 months from today.",
        }),
    })
    .superRefine((data, ctx) => {
        const birthDate = new Date(data.dob);
        const today = new Date();

        if (isNaN(birthDate.getTime())) return;
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // 1. Adult Validation (Must be 12+)
        if (data.type === "adult" && age < 12) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Adult passenger must be at least 12 years old.",
                path: ["dob"],
            });
        }

        // 2. Child Validation (Must be 2 to 11)
        if (data.type === "child") {
            if (age < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Child must be at least 2 years old (otherwise select Infant).",
                    path: ["dob"],
                });
            }
            if (age >= 12) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Child must be under 12 years old (otherwise select Adult).",
                    path: ["dob"],
                });
            }
        }

        // 3. Infant Validation (Must be < 2)
        if (data.type === "infant" && age >= 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Infant must be under 2 years old.",
                path: ["dob"],
            });
        }
    })
  ),
});

export type BookingFormData = z.infer<typeof bookingSchema>;