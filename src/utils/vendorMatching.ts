/**
 * Vendor Matching Algorithm
 * Scores and ranks vendors based on project requirements
 */

interface Project {
  id: string;
  category: string;
  skills_required: string[];
  location?: string;
  budget_min?: number;
  budget_max?: number;
  priority: string;
}

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  specialties: string[];
  service_areas?: string[];
  rating: number;
  completed_jobs: number;
  availability_status: string;
  is_verified: boolean;
  subscription_status: string;
  response_time_hours?: number;
}

export interface VendorMatch {
  vendor: Vendor;
  score: number;
  matchReasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Calculate matching score between a project and vendor
 */
export function calculateVendorMatchScore(
  project: Project,
  vendor: Vendor
): VendorMatch | null {
  // Base filters - vendor must meet these
  if (!vendor.is_verified) return null;
  if (vendor.availability_status !== 'available') return null;
  if (vendor.subscription_status !== 'active') return null;

  let score = 0;
  const matchReasons: string[] = [];

  // 1. Specialty/Category Match (40 points max)
  const categoryMatch = vendor.specialties?.some(
    (specialty) => specialty.toLowerCase().includes(project.category.toLowerCase())
  );
  
  if (categoryMatch) {
    score += 40;
    matchReasons.push(`Specializes in ${project.category}`);
  }

  // 2. Skills Match (30 points max)
  if (project.skills_required && project.skills_required.length > 0) {
    const matchingSkills = project.skills_required.filter((skill) =>
      vendor.specialties?.some((specialty) =>
        specialty.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const skillsMatchPercentage =
      matchingSkills.length / project.skills_required.length;
    const skillsScore = Math.round(skillsMatchPercentage * 30);
    score += skillsScore;

    if (matchingSkills.length > 0) {
      matchReasons.push(
        `Matches ${matchingSkills.length} of ${project.skills_required.length} required skills`
      );
    }
  }

  // 3. Location Match (15 points max)
  if (project.location && vendor.service_areas && vendor.service_areas.length > 0) {
    const locationMatch = vendor.service_areas.some(
      (area) =>
        area.toLowerCase().includes(project.location!.toLowerCase()) ||
        project.location!.toLowerCase().includes(area.toLowerCase())
    );

    if (locationMatch) {
      score += 15;
      matchReasons.push('Serves project location');
    }
  } else if (!project.location || !vendor.service_areas) {
    // No location penalty if not specified
    score += 5;
  }

  // 4. Vendor Rating (10 points max)
  const ratingScore = Math.round((vendor.rating / 5) * 10);
  score += ratingScore;
  if (vendor.rating >= 4.5) {
    matchReasons.push(`Highly rated (${vendor.rating.toFixed(1)}★)`);
  }

  // 5. Experience (5 points max)
  if (vendor.completed_jobs >= 50) {
    score += 5;
    matchReasons.push(`Extensive experience (${vendor.completed_jobs} completed jobs)`);
  } else if (vendor.completed_jobs >= 20) {
    score += 3;
    matchReasons.push(`Experienced (${vendor.completed_jobs} completed jobs)`);
  } else if (vendor.completed_jobs >= 5) {
    score += 1;
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 70) {
    confidence = 'high';
  } else if (score >= 50) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Only return matches with at least 30% score
  if (score < 30) return null;

  return {
    vendor,
    score,
    matchReasons,
    confidence,
  };
}

/**
 * Get top vendor matches for a project
 */
export function getTopVendorMatches(
  project: Project,
  vendors: Vendor[],
  limit: number = 5
): VendorMatch[] {
  const matches: VendorMatch[] = [];

  for (const vendor of vendors) {
    const match = calculateVendorMatchScore(project, vendor);
    if (match) {
      matches.push(match);
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, limit);
}

/**
 * Get confidence badge color
 */
export function getConfidenceBadgeColor(
  confidence: 'high' | 'medium' | 'low'
): string {
  switch (confidence) {
    case 'high':
      return 'bg-success/10 text-success dark:bg-success/20';
    case 'medium':
      return 'bg-warning/10 text-warning dark:bg-warning/20';
    case 'low':
      return 'bg-warning/20 text-warning-foreground dark:bg-warning/30';
  }
}

/**
 * Format match score as percentage
 */
export function formatMatchScore(score: number): string {
  return `${score}%`;
}
