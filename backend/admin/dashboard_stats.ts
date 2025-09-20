import { api } from "encore.dev/api";
import db from "../db";

export interface DashboardStats {
  totalIssues: number;
  issuesByStatus: {
    submitted: number;
    inProgress: number;
    resolved: number;
    rejected: number;
  };
  issuesByCategory: Array<{
    category: string;
    count: number;
  }>;
  issuesByRegion: Array<{
    region: string;
    count: number;
  }>;
  recentIssues: Array<{
    id: number;
    title: string;
    status: string;
    category: string;
    region: string;
    createdAt: Date;
  }>;
  avgResolutionTime: number; // in hours
}

// Gets dashboard statistics for admin panel
export const getDashboardStats = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/dashboard/stats" },
  async () => {
    // Get total issues count
    const totalResult = await db.queryRow`
      SELECT COUNT(*) as total FROM issues
    `;

    // Get issues by status
    const statusResults = await db.queryAll`
      SELECT status, COUNT(*) as count
      FROM issues
      GROUP BY status
    `;

    const issuesByStatus = {
      submitted: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    };

    statusResults.forEach(row => {
      switch (row.status) {
        case 'submitted':
          issuesByStatus.submitted = row.count;
          break;
        case 'in_progress':
          issuesByStatus.inProgress = row.count;
          break;
        case 'resolved':
          issuesByStatus.resolved = row.count;
          break;
        case 'rejected':
          issuesByStatus.rejected = row.count;
          break;
      }
    });

    // Get issues by category
    const categoryResults = await db.queryAll`
      SELECT category, COUNT(*) as count
      FROM issues
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get issues by region
    const regionResults = await db.queryAll`
      SELECT region, COUNT(*) as count
      FROM issues
      GROUP BY region
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get recent issues
    const recentResults = await db.queryAll`
      SELECT id, title, status, category, region, created_at
      FROM issues
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Calculate average resolution time
    const resolutionResult = await db.queryRow`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
      FROM issues
      WHERE status = 'resolved'
    `;

    return {
      totalIssues: totalResult!.total,
      issuesByStatus,
      issuesByCategory: categoryResults.map(row => ({
        category: row.category,
        count: row.count,
      })),
      issuesByRegion: regionResults.map(row => ({
        region: row.region,
        count: row.count,
      })),
      recentIssues: recentResults.map(row => ({
        id: row.id,
        title: row.title,
        status: row.status,
        category: row.category,
        region: row.region,
        createdAt: row.created_at,
      })),
      avgResolutionTime: resolutionResult?.avg_hours || 0,
    };
  }
);
