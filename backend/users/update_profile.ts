import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface UpdateProfileRequest {
  userId: number;
  name?: string;
  departmentId?: number;
  regionId?: number;
}

export interface UpdateProfileResponse {
  message: string;
}

// Updates user profile information
export const updateProfile = api<UpdateProfileRequest, UpdateProfileResponse>(
  { expose: true, method: "PUT", path: "/users/:userId/profile" },
  async (req) => {
    const { userId, name, departmentId, regionId } = req;

    // Check if user exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE id = ${userId}
    `;

    if (!existingUser) {
      throw APIError.notFound("User not found");
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name.trim());
    }

    if (departmentId !== undefined) {
      updates.push(`department_id = $${values.length + 1}`);
      values.push(departmentId);
    }

    if (regionId !== undefined) {
      updates.push(`region_id = $${values.length + 1}`);
      values.push(regionId);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}`;

    await db.rawExec(query, ...values);

    return {
      message: "Profile updated successfully",
    };
  }
);
