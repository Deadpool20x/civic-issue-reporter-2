import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface SendOTPRequest {
  mobileNumber: string;
}

export interface SendOTPResponse {
  message: string;
  expiresIn: number; // seconds
}

// Sends OTP to the provided mobile number
export const sendOTP = api<SendOTPRequest, SendOTPResponse>(
  { expose: true, method: "POST", path: "/auth/send-otp" },
  async (req) => {
    const { mobileNumber } = req;

    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      throw APIError.invalidArgument("Invalid mobile number format");
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing OTPs for this mobile number
    await db.exec`
      UPDATE otp_verifications 
      SET is_used = TRUE 
      WHERE mobile_number = ${mobileNumber} AND is_used = FALSE
    `;

    // Store new OTP
    await db.exec`
      INSERT INTO otp_verifications (mobile_number, otp_code, expires_at)
      VALUES (${mobileNumber}, ${otpCode}, ${expiresAt})
    `;

    // In production, integrate with SMS gateway
    // For demo purposes, log the OTP (remove in production)
    console.log(`OTP for ${mobileNumber}: ${otpCode}`);

    return {
      message: "OTP sent successfully",
      expiresIn: 600, // 10 minutes
    };
  }
);
