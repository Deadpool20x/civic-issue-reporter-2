import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface ReportIssueRequest {
  reporterId: number;
  title: string;
  description: string;
  category: string;
  specificIssue: string;
  region: string;
  latitude: number;
  longitude: number;
  locationAddress?: string;
  severityScore: number;
  imageUrls?: string[];
}

export interface ReportIssueResponse {
  issueId: number;
  message: string;
}

// Reports a new civic issue
export const report = api<ReportIssueRequest, ReportIssueResponse>(
  { expose: true, method: "POST", path: "/issues/report" },
  async (req) => {
    const {
      reporterId,
      title,
      description,
      category,
      specificIssue,
      region,
      latitude,
      longitude,
      locationAddress,
      severityScore,
      imageUrls = [],
    } = req;

    // Validate inputs
    if (!title.trim() || !description.trim()) {
      throw APIError.invalidArgument("Title and description are required");
    }

    if (severityScore < 1 || severityScore > 5) {
      throw APIError.invalidArgument("Severity score must be between 1 and 5");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw APIError.invalidArgument("Invalid coordinates");
    }

    // Check if reporter exists
    const reporter = await db.queryRow`
      SELECT id FROM users WHERE id = ${reporterId}
    `;

    if (!reporter) {
      throw APIError.notFound("Reporter not found");
    }

    // Check for duplicate issues within 100 meters
    const nearbyIssues = await db.queryAll`
      SELECT id, title, report_count
      FROM issues
      WHERE category = ${category}
        AND specific_issue = ${specificIssue}
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          100
        )
        AND status != 'resolved'
      ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      LIMIT 1
    `;

    if (nearbyIssues.length > 0) {
      // Update existing issue report count
      const existingIssue = nearbyIssues[0];
      await db.exec`
        UPDATE issues 
        SET report_count = report_count + 1,
            updated_at = NOW()
        WHERE id = ${existingIssue.id}
      `;

      return {
        issueId: existingIssue.id,
        message: `Similar issue found nearby. Report count updated to ${existingIssue.report_count + 1}.`,
      };
    }

    // Create new issue
    const issue = await db.queryRow`
      INSERT INTO issues (
        reporter_id, title, description, category, specific_issue, region,
        location, location_address, severity_score, image_urls
      )
      VALUES (
        ${reporterId}, ${title.trim()}, ${description.trim()}, ${category},
        ${specificIssue}, ${region},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        ${locationAddress || null}, ${severityScore}, ${imageUrls}
      )
      RETURNING id
    `;

    return {
      issueId: issue!.id,
      message: "Issue reported successfully",
    };
  }
);
