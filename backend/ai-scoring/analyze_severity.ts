import { api } from "encore.dev/api";

export interface AnalyzeSeverityRequest {
  category: string;
  specificIssue: string;
  description: string;
  region: string;
  imageUrl?: string;
}

export interface AnalyzeSeverityResponse {
  severityScore: number;
  confidence: number;
  reasoning: string;
  factors: string[];
}

interface SeverityFactors {
  urgency: number;
  publicSafety: number;
  infrastructure: number;
  impact: number;
}

// AI-powered severity scoring system
export const analyzeSeverity = api<AnalyzeSeverityRequest, AnalyzeSeverityResponse>(
  { expose: true, method: "POST", path: "/ai-scoring/analyze" },
  async (req) => {
    const { category, specificIssue, description, region, imageUrl } = req;

    // Analyze severity based on multiple factors
    const factors = calculateSeverityFactors(category, specificIssue, description, region);
    
    // Calculate base score from factors
    let baseScore = Math.round(
      (factors.urgency * 0.3) +
      (factors.publicSafety * 0.35) +
      (factors.infrastructure * 0.2) +
      (factors.impact * 0.15)
    );

    // Adjust score based on keywords in description
    const keywordAdjustment = analyzeDescriptionKeywords(description.toLowerCase());
    baseScore = Math.max(1, Math.min(5, baseScore + keywordAdjustment));

    // If image is available, apply image analysis boost
    let imageBoost = 0;
    if (imageUrl) {
      imageBoost = analyzeImageSeverity(imageUrl);
    }

    const finalScore = Math.max(1, Math.min(5, baseScore + imageBoost));
    
    // Calculate confidence based on available data
    const confidence = calculateConfidence(description, imageUrl);
    
    // Generate reasoning
    const reasoning = generateReasoning(finalScore, factors, keywordAdjustment, imageBoost);
    
    // List key factors
    const keyFactors = getKeyFactors(factors, keywordAdjustment, imageBoost);

    return {
      severityScore: finalScore,
      confidence,
      reasoning,
      factors: keyFactors,
    };
  }
);

function calculateSeverityFactors(
  category: string,
  specificIssue: string,
  description: string,
  region: string
): SeverityFactors {
  let urgency = 2;
  let publicSafety = 2;
  let infrastructure = 2;
  let impact = 2;

  // Category-based scoring
  switch (category.toLowerCase()) {
    case 'roads & transport':
      publicSafety = 4;
      infrastructure = 4;
      if (specificIssue.toLowerCase().includes('pothole')) {
        urgency = 3;
        if (description.toLowerCase().includes('major') || 
            description.toLowerCase().includes('deep') ||
            description.toLowerCase().includes('large')) {
          urgency = 4;
          publicSafety = 5;
        }
      }
      if (specificIssue.toLowerCase().includes('traffic signal')) {
        urgency = 5;
        publicSafety = 5;
        impact = 4;
      }
      break;

    case 'water supply':
      infrastructure = 4;
      impact = 4;
      if (specificIssue.toLowerCase().includes('no water supply')) {
        urgency = 5;
        impact = 5;
      }
      if (specificIssue.toLowerCase().includes('contaminated')) {
        publicSafety = 5;
        urgency = 4;
      }
      break;

    case 'waste management':
      publicSafety = 3;
      if (specificIssue.toLowerCase().includes('overflowing')) {
        urgency = 4;
        publicSafety = 4;
      }
      break;

    case 'public facilities':
      if (specificIssue.toLowerCase().includes('electrical')) {
        publicSafety = 5;
        urgency = 4;
      }
      if (specificIssue.toLowerCase().includes('manhole')) {
        publicSafety = 5;
        urgency = 5;
      }
      break;
  }

  // Regional impact multiplier
  const majorCities = ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro'];
  if (majorCities.some(city => region.toLowerCase().includes(city))) {
    impact = Math.min(5, impact + 1);
  }

  return { urgency, publicSafety, infrastructure, impact };
}

function analyzeDescriptionKeywords(description: string): number {
  const highSeverityKeywords = [
    'emergency', 'urgent', 'dangerous', 'blocking', 'major', 'severe',
    'accident', 'injury', 'broken', 'flood', 'leak', 'overflow'
  ];
  
  const mediumSeverityKeywords = [
    'damaged', 'cracked', 'slow', 'dirty', 'clogged', 'minor'
  ];

  const lowSeverityKeywords = [
    'maintenance', 'cleaning', 'cosmetic', 'small'
  ];

  let adjustment = 0;
  
  for (const keyword of highSeverityKeywords) {
    if (description.includes(keyword)) {
      adjustment += 1;
      break; // Only count once
    }
  }

  for (const keyword of mediumSeverityKeywords) {
    if (description.includes(keyword)) {
      adjustment += 0.5;
      break;
    }
  }

  for (const keyword of lowSeverityKeywords) {
    if (description.includes(keyword)) {
      adjustment -= 0.5;
      break;
    }
  }

  return Math.max(-1, Math.min(1, adjustment));
}

function analyzeImageSeverity(imageUrl: string): number {
  // In a real implementation, this would use computer vision APIs
  // For now, we'll simulate image analysis based on URL patterns
  
  // This is a simplified simulation - in production, you'd use
  // services like Google Vision API, AWS Rekognition, or Azure Computer Vision
  
  // Random factor to simulate AI analysis (0.0 to 1.0)
  const simulatedAnalysis = Math.random();
  
  if (simulatedAnalysis > 0.7) {
    return 1; // High severity detected in image
  } else if (simulatedAnalysis > 0.4) {
    return 0.5; // Medium severity
  } else {
    return 0; // Low/no severity boost
  }
}

function calculateConfidence(description: string, imageUrl?: string): number {
  let confidence = 70; // Base confidence
  
  // More detailed descriptions increase confidence
  if (description.length > 100) confidence += 10;
  if (description.length > 200) confidence += 10;
  
  // Image presence increases confidence
  if (imageUrl) confidence += 15;
  
  // Specific keywords increase confidence
  const specificWords = ['meter', 'feet', 'inch', 'cm', 'deep', 'wide', 'long'];
  if (specificWords.some(word => description.toLowerCase().includes(word))) {
    confidence += 5;
  }

  return Math.min(95, confidence);
}

function generateReasoning(
  score: number,
  factors: SeverityFactors,
  keywordAdjustment: number,
  imageBoost: number
): string {
  let reasoning = `Severity score: ${score}/5. `;
  
  if (factors.publicSafety >= 4) {
    reasoning += "High public safety risk identified. ";
  }
  
  if (factors.urgency >= 4) {
    reasoning += "Urgent attention required. ";
  }
  
  if (factors.infrastructure >= 4) {
    reasoning += "Critical infrastructure impact. ";
  }
  
  if (keywordAdjustment > 0) {
    reasoning += "Description indicates high severity. ";
  }
  
  if (imageBoost > 0) {
    reasoning += "Visual analysis confirms elevated severity. ";
  }
  
  if (score <= 2) {
    reasoning += "Low priority maintenance issue.";
  } else if (score <= 3) {
    reasoning += "Standard priority for department review.";
  } else if (score <= 4) {
    reasoning += "High priority requiring prompt attention.";
  } else {
    reasoning += "Critical issue requiring immediate response.";
  }

  return reasoning;
}

function getKeyFactors(
  factors: SeverityFactors,
  keywordAdjustment: number,
  imageBoost: number
): string[] {
  const keyFactors: string[] = [];
  
  if (factors.publicSafety >= 4) {
    keyFactors.push("Public Safety Risk");
  }
  
  if (factors.urgency >= 4) {
    keyFactors.push("Urgent Response Needed");
  }
  
  if (factors.infrastructure >= 4) {
    keyFactors.push("Infrastructure Impact");
  }
  
  if (factors.impact >= 4) {
    keyFactors.push("High Community Impact");
  }
  
  if (keywordAdjustment > 0) {
    keyFactors.push("Critical Keywords Detected");
  }
  
  if (imageBoost > 0) {
    keyFactors.push("Visual Severity Confirmed");
  }
  
  if (keyFactors.length === 0) {
    keyFactors.push("Standard Maintenance Issue");
  }

  return keyFactors;
}