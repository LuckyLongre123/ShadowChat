import { z } from "zod";

const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;

export const phoneSchema = z.object({
  phone: z
    .string({
      message: "Phone number is required and must be a string", // Updated this line
    })
    .min(1, "Phone number cannot be empty")
    .trim()
    .transform((val) => val.replace(/[\s-]/g, ""))
    .refine((val) => indianPhoneRegex.test(val), {
      message: "Invalid Indian phone number format",
    })
    .transform((val) => {
      if (val.length === 10) return `+91${val}`;
      if (val.length === 11 && val.startsWith("0")) return `+91${val.slice(1)}`;
      if (val.length === 12 && val.startsWith("91")) return `+${val}`;
      return val;
    }),
});

export const verifyOtpSchema = phoneSchema.extend({
  code: z
    .string({
      message: "OTP code is required",
    })
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  name: z
    .string({
      message: " Name is required",
    })
    .max(40, "Name does not have more than 40 chars"),
});

export const firebaseAuthTokenSchema = z.object({
  idToken: z
    .string({
      message: "Firebase ID Token is required",
    })
    .min(1, "Token cannot be empty"),
});

export type FirebaseAuthTokenType = z.infer<typeof firebaseAuthTokenSchema>;

export type VerifyOtpType = z.infer<typeof verifyOtpSchema>;

export type PhoneType = z.infer<typeof phoneSchema>;
