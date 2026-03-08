import { z } from "zod";

// =============================================
// 🟢 1. Helper: Luhn Algorithm (Credit Card)
// =============================================
const isValidLuhn = (val: string): boolean => {
  if (!val) return false;
  let checksum = 0;
  let j = 1;

  for (let i = val.length - 1; i >= 0; i--) {
    let calc = Number(val.charAt(i)) * j;
    if (calc > 9) {
      checksum = checksum + 1;
      calc = calc - 10;
    }
    checksum = checksum + calc;
    j = j === 1 ? 2 : 1;
  }

  return checksum % 10 === 0;
};

// =============================================
// 🟢 2. Helper: Safe 6-Month Calculator
// =============================================
const getSixMonthsFromNow = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(
    today.getFullYear(),
    today.getMonth() + 6,
    today.getDate()
  );

  if (target.getDate() !== today.getDate()) {
    target.setDate(0);
  }

  return target;
};

// =============================================
// 🟢 3. Helper: Age Calculator
// =============================================
const calculateAge = (dobString: string): number => {
  const birthDate = new Date(dobString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// =============================================
// 🟢 4. Single Passenger Schema
// =============================================
const passengerSchema = z
  .object({
    // --- Passenger Type ---
    // ✅ FIX: errorMap → message
    type: z.enum(
      ["adult", "child", "infant", "infant_without_seat"],
      {
        message:
          "Passenger type must be adult, child, infant, or infant_without_seat",
      }
    ),

    // --- Unique ID ---
    id: z.string().min(1, "Passenger ID is required"),

    // --- First Name ---
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .regex(/^[a-zA-Z\s]+$/, "Only English letters and spaces allowed"),

    // --- Middle Name (Optional) ---
    middleName: z
      .string()
      .trim()
      .regex(/^[a-zA-Z\s]*$/, "Only English letters and spaces allowed")
      .optional()
      .or(z.literal("")),

    // --- Last Name ---
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .regex(/^[a-zA-Z\s]+$/, "Only English letters and spaces allowed"),

    // --- Date of Birth ---
    dob: z
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (d) => !isNaN(new Date(d).getTime()),
        "Invalid date format"
      )
      .refine((d) => {
        const date = new Date(d + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date <= today;
      }, "Date of birth cannot be in the future"),

    // --- Gender ---
    // ✅ FIX: errorMap → message
    gender: z.enum(["male", "female"], {
      message: "Gender must be male or female",
    }),

    // --- Passport Number ---
    passportNumber: z
      .string()
      .trim()
      .min(1, "Passport number is required")
      .toUpperCase()
      .regex(
        /^[A-Z0-9]{6,9}$/,
        "Invalid passport format (6-9 alphanumeric characters)"
      ),

    // --- Passport Expiry Date ---
    passportExpiry: z
      .string()
      .min(1, "Passport expiry date is required")
      .refine(
        (d) => !isNaN(new Date(d).getTime()),
        "Invalid date format"
      )
      .refine((d) => {
        const expiry = new Date(d + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return expiry > today;
      }, "Passport has already expired")
      .refine((d) => {
        const expiry = new Date(d + "T00:00:00");
        const sixMonths = getSixMonthsFromNow();
        return expiry > sixMonths;
      }, "Passport must be valid for at least 6 months from today"),

    // --- Passport Issuing Country ---
    passportCountry: z
      .string()
      .trim()
      .min(1, "Country code is required")
      .length(2, "Must be a 2-letter country code (e.g., BD, US, GB)")
      .toUpperCase(),
  })

  // =============================================
  // 🔴 SuperRefine: Age vs Type Cross-Validation
  // =============================================
  .superRefine((data, ctx) => {
    const birthDate = new Date(data.dob + "T00:00:00");
    if (isNaN(birthDate.getTime())) return;

    const age = calculateAge(data.dob);

    switch (data.type) {
      case "adult":
        if (age < 12) {
          ctx.addIssue({
            code: "custom",
            message: `Adult passenger must be at least 12 years old. Current age: ${age}`,
            path: ["dob"],
          });
        }
        break;

      case "child":
        if (age < 2) {
          ctx.addIssue({
            code: "custom",
            message: `Child passenger must be at least 2 years old. Current age: ${age}`,
            path: ["dob"],
          });
        }
        if (age >= 12) {
          ctx.addIssue({
            code: "custom",
            message: `Child passenger must be under 12. Current age: ${age}`,
            path: ["dob"],
          });
        }
        break;

      case "infant":
      case "infant_without_seat":
        if (age >= 2) {
          ctx.addIssue({
            code: "custom",
            message: `Infant passenger must be under 2. Current age: ${age}`,
            path: ["dob"],
          });
        }
        break;
    }
  });

// =============================================
// 🟢 5. Main Booking Schema
// =============================================
export const bookingSchema = z.object({
  // 📧 Contact
  contact: z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .toLowerCase(),

    phone: z
      .string()
      .trim()
      .min(10, "Phone number is too short (minimum 10 digits)")
      .max(15, "Phone number is too long (maximum 15 digits)")
      .regex(
        /^\+?[0-9]+$/,
        "Phone number can only contain digits and optional leading +"
      ),
  }),

  // 👤 Passengers
  passengers: z
    .array(passengerSchema)
    .min(1, "At least one passenger is required"),

  // 💳 Payment
  payment: z.object({
    cardName: z
      .string()
      .trim()
      .min(2, "Cardholder name is required")
      .regex(
        /^[a-zA-Z\s.\-]+$/,
        "Only letters, spaces, dots, and hyphens allowed"
      ),

    cardNumber: z
      .string()
      .transform((val) => val.replace(/\D/g, ""))
      .refine(
        (val) => /^\d{13,19}$/.test(val),
        "Card number must be 13-19 digits"
      )
      .refine(isValidLuhn, "Invalid card number (checksum failed)"),

    expiryDate: z
      .string()
      .trim()
      .regex(
        /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
        "Format must be MM/YY (e.g., 03/27)"
      )
      .refine((val) => {
        const [month, year] = val.split("/");
        const expMonth = parseInt(month, 10);
        const expYear = parseInt(year, 10);

        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;

        if (expYear < currentYear) return false;
        if (expYear === currentYear && expMonth < currentMonth)
          return false;

        return true;
      }, "Card has expired"),

    billingAddress: z.object({
      street: z
        .string()
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(100, "Address cannot exceed 100 characters"),

      city: z
        .string()
        .trim()
        .min(2, "City name must be at least 2 characters")
        .max(50, "City name is too long"),

      state: z
        .string()
        .trim()
        .min(2, "State must be at least 2 characters")
        .max(50, "State name is too long"),

      zipCode: z
        .string()
        .trim()
        .min(3, "Zip code is too short")
        .max(12, "Zip code cannot exceed 12 characters")
        .regex(/^[a-zA-Z0-9\s\-]+$/, "Invalid zip code format"),

      country: z
        .string()
        .trim()
        .min(2, "Please select a valid country")
        .max(60, "Invalid country name"),
    }),
  }),
});

// =============================================
// 🟢 6. TypeScript Type Export
// =============================================
export type BookingFormData = z.infer<typeof bookingSchema>;