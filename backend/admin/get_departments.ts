import { api } from "encore.dev/api";
import db from "../db";

export interface Department {
  id: number;
  name: string;
  description: string | null;
  issueCount: number;
  createdAt: Date;
}

export interface GetDepartmentsResponse {
  departments: Department[];
}

// Gets all departments with issue counts
export const getDepartments = api<void, GetDepartmentsResponse>(
  { expose: true, method: "GET", path: "/departments" },
  async () => {
    const departments = await db.queryAll`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.created_at,
        COUNT(i.id) as issue_count
      FROM departments d
      LEFT JOIN issues i ON d.id = i.assigned_department_id
      GROUP BY d.id, d.name, d.description, d.created_at
      ORDER BY d.name
    `;

    return {
      departments: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        issueCount: dept.issue_count,
        createdAt: dept.created_at,
      })),
    };
  }
);
