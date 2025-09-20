import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface UpdateStatusRequest {
  issueId: number;
  status: string;
  comment?: string;
  updatedBy: number;
}

export interface UpdateStatusResponse {
  message: string;
}

// Updates the status of an issue
export const updateStatus = api<UpdateStatusRequest, UpdateStatusResponse>(
  { expose: true, method: "PUT", path: "/issues/:issueId/status" },
  async (req) => {
    const { issueId, status, comment, updatedBy } = req;

    const validStatuses = ['submitted', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw APIError.invalidArgument("Invalid status");
    }

    // Check if issue exists
    const issue = await db.queryRow`
      SELECT id FROM issues WHERE id = ${issueId}
    `;

    if (!issue) {
      throw APIError.notFound("Issue not found");
    }

    // Update issue status
    await db.exec`
      UPDATE issues 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${issueId}
    `;

    // Add comment if provided
    if (comment && comment.trim()) {
      await db.exec`
        INSERT INTO comments (issue_id, user_id, content)
        VALUES (${issueId}, ${updatedBy}, ${comment.trim()})
      `;
    }

    return {
      message: "Issue status updated successfully",
    };
  }
);
