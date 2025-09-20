import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface GetProfileRequest {
  userId: number;
}

export interface UserProfile {
  id: number;
  mobileNumber: string;
  name: string | null;
  role: string;
  department: {
    id: number;
    name: string;
  } | null;
  region: {
    id: number;
    name: string;
  } | null;
  createdAt: Date;
}

// Gets user profile information
export const getProfile = api<GetProfileRequest, UserProfile>(
  { expose: true, method: "GET", path: "/users/:userId/profile" },
  async (req) => {
    const { userId } = req;

    const user = await db.queryRow`
      SELECT 
        u.*,
        d.id as dept_id, d.name as dept_name,
        r.id as region_id, r.name as region_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN regions r ON u.region_id = r.id
      WHERE u.id = ${userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    return {
      id: user.id,
      mobileNumber: user.mobile_number,
      name: user.name,
      role: user.role,
      department: user.dept_id ? {
        id: user.dept_id,
        name: user.dept_name,
      } : null,
      region: user.region_id ? {
        id: user.region_id,
        name: user.region_name,
      } : null,
      createdAt: user.created_at,
    };
  }
);
