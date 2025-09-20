import { api, APIError } from "encore.dev/api";
import db from "../db";
import * as aiScoring from "../ai-scoring/analyze_severity";

export interface ReportIssueRequest {
  category: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  region: string;
  imageUrl?: string;
}

export interface ReportIssueResponse {
  id: string;
  message: string;
  severityAnalysis: {
    score: number;
    confidence: number;
    reasoning: string;
    factors: string[];
  };
}

// Reports a new civic issue with AI-powered severity scoring
export const report = api<ReportIssueRequest, ReportIssueResponse>(
  { expose: true, method: "POST", path: "/issues/report" },
  async (req) => {
    // For demo purposes, using a default user ID
    const userId = 1;
    const { category, description, location, region, imageUrl } = req;

    // Validate inputs
    if (!category.trim() || !description.trim()) {
      throw APIError.invalidArgument("Category and description are required");
    }

    if (location.latitude < -90 || location.latitude > 90 || 
        location.longitude < -180 || location.longitude > 180) {
      throw APIError.invalidArgument("Invalid coordinates");
    }

    // Get AI severity analysis
    const severityAnalysis = await aiScoring.analyzeSeverity({
      category,
      specificIssue: category, // Using category as specific issue for now
      description,
      region,
      imageUrl,
    });

    // Check for duplicate issues within 20 meters (as per requirements)
    const nearbyIssues = await db.queryAll`
      SELECT id, title, report_count
      FROM issues
      WHERE category = ${category}
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography,
          20
        )
        AND status != 'resolved'
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326))
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
        id: existingIssue.id.toString(),
        message: `Similar issue found nearby. Your report has been linked to existing issue #${existingIssue.id}. Total reports: ${existingIssue.report_count + 1}`,
        severityAnalysis: {
          score: severityAnalysis.severityScore,
          confidence: severityAnalysis.confidence,
          reasoning: severityAnalysis.reasoning,
          factors: severityAnalysis.factors,
        },
      };
    }

    // Create new issue with AI-determined severity score
    const issue = await db.queryRow`
      INSERT INTO issues (
        reporter_id, title, description, category, specific_issue, region,
        location, severity_score, image_urls, status
      )
      VALUES (
        ${userId}, ${category}, ${description.trim()}, ${category},
        ${category}, ${region},
        ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326),
        ${severityAnalysis.severityScore}, ${imageUrl ? [imageUrl] : []}, 'submitted'
      )
      RETURNING id
    `;

    return {
      id: issue!.id.toString(),
      message: "Issue reported successfully with AI severity analysis",
      severityAnalysis: {
        score: severityAnalysis.severityScore,
        confidence: severityAnalysis.confidence,
        reasoning: severityAnalysis.reasoning,
        factors: severityAnalysis.factors,
      },
    };
  }
);