import { api } from "encore.dev/api";
import db from "../db";

export interface GetMyIssuesRequest {
  userId: number;
  limit?: number;
  offset?: number;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  specificIssue: string;
  region: string;
  latitude: number;
  longitude: number;
  locationAddress: string | null;
  severityScore: number;
  status: string;
  assignedDepartment: {
    id: number;
    name: string;
  } | null;
  assignedRegion: {
    id: number;
    name: string;
  } | null;
  imageUrls: string[];
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMyIssuesResponse {
  issues: Issue[];
  total: number;
}

// Gets issues reported by the current user
export const getMyIssues = api<GetMyIssuesRequest, GetMyIssuesResponse>(
  { expose: true, method: "GET", path: "/issues/my-issues/:userId" },
  async (req) => {
    const { userId, limit = 20, offset = 0 } = req;

    // Get total count
    const countResult = await db.queryRow`
      SELECT COUNT(*) as total FROM issues WHERE reporter_id = ${userId}
    `;

    // Get issues with pagination
    const issuesData = await db.queryAll`
      SELECT 
        i.*,
        ST_X(i.location) as longitude,
        ST_Y(i.location) as latitude,
        d.id as dept_id, d.name as dept_name,
        r.id as region_id, r.name as region_name
      FROM issues i
      LEFT JOIN departments d ON i.assigned_department_id = d.id
      LEFT JOIN regions r ON i.assigned_region_id = r.id
      WHERE i.reporter_id = ${userId}
      ORDER BY i.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const issues: Issue[] = issuesData.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      specificIssue: issue.specific_issue,
      region: issue.region,
      latitude: issue.latitude,
      longitude: issue.longitude,
      locationAddress: issue.location_address,
      severityScore: issue.severity_score,
      status: issue.status,
      assignedDepartment: issue.dept_id ? {
        id: issue.dept_id,
        name: issue.dept_name,
      } : null,
      assignedRegion: issue.region_id ? {
        id: issue.region_id,
        name: issue.region_name,
      } : null,
      imageUrls: issue.image_urls || [],
      reportCount: issue.report_count,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    }));

    return {
      issues,
      total: countResult!.total,
    };
  }
);
