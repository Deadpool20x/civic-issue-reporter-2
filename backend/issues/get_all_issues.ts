import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";

export interface GetAllIssuesRequest {
  limit?: Query<number>;
  offset?: Query<number>;
  status?: Query<string>;
  category?: Query<string>;
  region?: Query<string>;
  departmentId?: Query<number>;
}

export interface IssueWithReporter {
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
  reporter: {
    id: number;
    name: string | null;
    mobileNumber: string;
  };
  imageUrls: string[];
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAllIssuesResponse {
  issues: IssueWithReporter[];
  total: number;
}

// Gets all issues with filtering options (admin endpoint)
export const getAllIssues = api<GetAllIssuesRequest, GetAllIssuesResponse>(
  { expose: true, method: "GET", path: "/issues/all" },
  async (req) => {
    const { 
      limit = 20, 
      offset = 0, 
      status, 
      category, 
      region, 
      departmentId 
    } = req;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push(`i.status = $${params.length + 1}`);
      params.push(status);
    }

    if (category) {
      conditions.push(`i.category = $${params.length + 1}`);
      params.push(category);
    }

    if (region) {
      conditions.push(`i.region = $${params.length + 1}`);
      params.push(region);
    }

    if (departmentId) {
      conditions.push(`i.assigned_department_id = $${params.length + 1}`);
      params.push(departmentId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM issues i 
      ${whereClause}
    `;
    const countResult = await db.rawQueryRow(countQuery, ...params);

    // Get issues with pagination
    const dataQuery = `
      SELECT 
        i.*,
        ST_X(i.location) as longitude,
        ST_Y(i.location) as latitude,
        u.id as reporter_id, u.name as reporter_name, u.mobile_number as reporter_mobile,
        d.id as dept_id, d.name as dept_name,
        r.id as region_id, r.name as region_name
      FROM issues i
      JOIN users u ON i.reporter_id = u.id
      LEFT JOIN departments d ON i.assigned_department_id = d.id
      LEFT JOIN regions r ON i.assigned_region_id = r.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const issuesData = await db.rawQueryAll(dataQuery, ...params);

    const issues: IssueWithReporter[] = issuesData.map(issue => ({
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
      reporter: {
        id: issue.reporter_id,
        name: issue.reporter_name,
        mobileNumber: issue.reporter_mobile,
      },
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
