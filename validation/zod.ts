import z from "zod";

// 1. Zod Schema Definition

export const searchSchema = z.object({
  from: z
    .string()
    .length(3, { message: "Enter 3-letter Airport Code (e.g. DAC)" }) // ঠিক ৩ অক্ষর হতে হবে
    .regex(/^[a-zA-Z]+$/, { message: "Only letters allowed" }) // কোনো নাম্বার বা সিম্বল চলবে না
    .transform((val) => val.toUpperCase()), // অটোমেটিক 'dac' কে 'DAC' বানিয়ে দেবে

  to: z
    .string()
    .length(3, { message: "Enter 3-letter Airport Code (e.g. JED)" })
    .regex(/^[a-zA-Z]+$/, { message: "Only letters allowed" })
    .transform((val) => val.toUpperCase()),

  date: z.string().refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "Date cannot be in the past",
  }),
});

// Type inference from Zod schema
export type SearchInputs = z.infer<typeof searchSchema>;

//contact form
export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

//Account validation


// 1. Login Schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// 2. Register Schema
export const registerSchema = z.object({
  name: z.string().min(3, { message: "Name is too short" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Error message will show under confirmPassword field
});

// Types Export
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;