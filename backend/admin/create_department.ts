import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface CreateDepartmentResponse {
  departmentId: number;
  message: string;
}

// Creates a new department
export const createDepartment = api<CreateDepartmentRequest, CreateDepartmentResponse>(
  { expose: true, method: "POST", path: "/departments" },
  async (req) => {
    const { name, description } = req;

    if (!name.trim()) {
      throw APIError.invalidArgument("Department name is required");
    }

    // Check if department already exists
    const existing = await db.queryRow`
      SELECT id FROM departments WHERE LOWER(name) = LOWER(${name.trim()})
    `;

    if (existing) {
      throw APIError.alreadyExists("Department with this name already exists");
    }

    // Create department
    const department = await db.queryRow`
      INSERT INTO departments (name, description)
      VALUES (${name.trim()}, ${description || null})
      RETURNING id
    `;

    return {
      departmentId: department!.id,
      message: "Department created successfully",
    };
  }
);
