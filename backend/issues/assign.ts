import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface AssignIssueRequest {
  issueId: number;
  departmentId?: number;
  regionId?: number;
  assignedBy: number;
}

export interface AssignIssueResponse {
  message: string;
}

// Assigns an issue to a department and/or region
export const assign = api<AssignIssueRequest, AssignIssueResponse>(
  { expose: true, method: "PUT", path: "/issues/:issueId/assign" },
  async (req) => {
    const { issueId, departmentId, regionId, assignedBy } = req;

    // Check if issue exists
    const issue = await db.queryRow`
      SELECT id FROM issues WHERE id = ${issueId}
    `;

    if (!issue) {
      throw APIError.notFound("Issue not found");
    }

    // Validate department if provided
    if (departmentId) {
      const department = await db.queryRow`
        SELECT id FROM departments WHERE id = ${departmentId}
      `;
      if (!department) {
        throw APIError.notFound("Department not found");
      }
    }

    // Validate region if provided
    if (regionId) {
      const region = await db.queryRow`
        SELECT id FROM regions WHERE id = ${regionId}
      `;
      if (!region) {
        throw APIError.notFound("Region not found");
      }
    }

    // Update assignment
    await db.exec`
      UPDATE issues 
      SET assigned_department_id = ${departmentId || null},
          assigned_region_id = ${regionId || null},
          updated_at = NOW()
      WHERE id = ${issueId}
    `;

    // Add assignment comment
    const assignmentDetails = [];
    if (departmentId) assignmentDetails.push("department");
    if (regionId) assignmentDetails.push("region");

    const comment = `Issue assigned to ${assignmentDetails.join(" and ")}`;
    await db.exec`
      INSERT INTO comments (issue_id, user_id, content)
      VALUES (${issueId}, ${assignedBy}, ${comment})
    `;

    return {
      message: "Issue assigned successfully",
    };
  }
);
