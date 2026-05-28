import twilio from "twilio";
import { ApiError } from "../utils/ApiError";
import logger from "../utils/logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

if (!accountSid || !authToken || !serviceSid) {
  logger.error("Twilio credentials missing in .env file!");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

/**
 * Sends a 6-digit OTP to the specified phone number using Twilio Verify
 * @param phone E.164 formatted phone number (e.g., +919876543210)
 */
export const sendVerificationSMS = async (phone: string) => {
  try {
    const verification = await client.verify.v2
      .services(serviceSid as string)
      .verifications.create({ to: phone, channel: "sms" });

    logger.info(`OTP sent successfully to ${phone}. SID: ${verification.sid}`);
    return verification;
  } catch (error: any) {
    logger.error(`Twilio Error sending OTP to ${phone}: ${error.message}`);
    throw new ApiError(500, "Failed to send OTP. Please try again later.", [
      error.message,
    ]);
  }
};

/**
 * Verifies the OTP entered by the user
 * @param phone E.164 formatted phone number
 * @param code 6-digit OTP code entered by user
 */
export const checkVerificationSMS = async (phone: string, code: string) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(serviceSid as string)
      .verificationChecks.create({ to: phone, code });

    return verificationCheck.status === "approved";
  } catch (error: any) {
    logger.error(`Twilio Error verifying OTP for ${phone}: ${error.message}`);
    throw new ApiError(400, "Invalid or expired OTP");
  }
};
