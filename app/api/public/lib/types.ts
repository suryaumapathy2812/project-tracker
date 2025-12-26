import type { Status } from "@/lib/status-config";

/**
 * Type definitions for public API responses
 */

export interface PublicOrganization {
  name: string;
  logo: string | null;
}

export interface PublicFeature {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
}

export interface PublicFeatureWithStats extends PublicFeature {
  stats: FeatureStats;
}

export interface FeatureStats {
  totalAssignments: number;
  statusCounts: Record<Status, number>;
}

export interface ProjectStats {
  featureCount: number;
  assignmentCount: number;
}

export interface PublicProject {
  id: string;
  shareId: string;
  name: string;
  description: string | null;
  createdAt: string;
  org: PublicOrganization;
  features: PublicFeature[];
  stats: ProjectStats;
}

export interface PublicProjectStats {
  shareId: string;
  projectName: string;
  featureCount: number;
  assignmentStats: {
    totalStudents: number;
    totalAssignments: number;
    statusBreakdown: Record<Status, number>;
    completionPercentage: number;
  };
}

export interface FeaturesListResponse {
  shareId: string;
  projectName: string;
  features: (PublicFeature | PublicFeatureWithStats)[];
}

export interface FeatureDetailResponse {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  project: {
    shareId: string;
    name: string;
  };
  stats: FeatureStats;
}

/**
 * Helper to create empty status counts
 */
export function createEmptyStatusCounts(): Record<Status, number> {
  return {
    Backlog: 0,
    Todo: 0,
    InProgress: 0,
    Done: 0,
    Canceled: 0,
  };
}
