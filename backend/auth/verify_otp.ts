import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface VerifyOTPRequest {
  mobileNumber: string;
  otpCode: string;
  name?: string; // Required for new users
}

export interface VerifyOTPResponse {
  token: string;
  user: {
    id: number;
    mobileNumber: string;
    name: string | null;
    role: string;
    isNewUser: boolean;
  };
}

// Verifies OTP and returns authentication token
export const verifyOTP = api<VerifyOTPRequest, VerifyOTPResponse>(
  { expose: true, method: "POST", path: "/auth/verify-otp" },
  async (req) => {
    const { mobileNumber, otpCode, name } = req;

    // Find valid OTP
    const otpRecord = await db.queryRow`
      SELECT * FROM otp_verifications
      WHERE mobile_number = ${mobileNumber} 
        AND otp_code = ${otpCode}
        AND is_used = FALSE
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!otpRecord) {
      throw APIError.invalidArgument("Invalid or expired OTP");
    }

    // Mark OTP as used
    await db.exec`
      UPDATE otp_verifications 
      SET is_used = TRUE 
      WHERE id = ${otpRecord.id}
    `;

    // Check if user exists
    let user = await db.queryRow`
      SELECT * FROM users WHERE mobile_number = ${mobileNumber}
    `;

    let isNewUser = false;

    if (!user) {
      // Create new user
      if (!name || name.trim().length === 0) {
        throw APIError.invalidArgument("Name is required for new users");
      }

      user = await db.queryRow`
        INSERT INTO users (mobile_number, name, is_verified)
        VALUES (${mobileNumber}, ${name.trim()}, TRUE)
        RETURNING *
      `;
      isNewUser = true;
    } else {
      // Update existing user verification status
      await db.exec`
        UPDATE users 
        SET is_verified = TRUE
        WHERE id = ${user.id}
      `;
    }

    // Generate simple token (in production, use JWT)
    const token = `${user!.id}_${Date.now()}_${Math.random().toString(36)}`;

    return {
      token,
      user: {
        id: user!.id,
        mobileNumber: user!.mobile_number,
        name: user!.name,
        role: user!.role,
        isNewUser,
      },
    };
  }
);
