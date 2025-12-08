// Prompt types and interfaces for the category-aware prompt system

import { CostingState } from "../state";

/**
 * Prompt types that can be customized per category
 */
export type PromptType = 'analyze' | 'materials' | 'labor' | 'overhead' | 'report';

/**
 * Context passed to prompt builders
 */
export interface PromptContext {
  state: CostingState;
  category?: string;
  subcategory?: string;
}

/**
 * A prompt builder function that generates the prompt string from context
 */
export type PromptBuilder = (context: PromptContext) => string;

/**
 * Category configuration - defines category-specific settings
 */
export interface CategoryConfig {
  name: string;
  description: string;

  // Labor categories specific to this industry
  laborCategories?: {
    id: string;
    name: string;
    description: string;
    defaultSkillLevel: 'entry' | 'intermediate' | 'expert';
  }[];

  // Typical overhead range for this category
  overheadRange?: {
    min: number;  // e.g., 0.15
    max: number;  // e.g., 0.40
    typical: number;
  };

  // Common units for components in this category
  commonUnits?: string[];

  // Any other category-specific metadata
  metadata?: Record<string, unknown>;
}

/**
 * A prompt module exports prompt builders and optional config
 */
export interface PromptModule {
  // Prompt builders (all optional - only override what you need)
  analyze?: PromptBuilder;
  materials?: PromptBuilder;
  labor?: PromptBuilder;
  overhead?: PromptBuilder;
  report?: PromptBuilder;

  // Category configuration (optional)
  config?: CategoryConfig;
}

/**
 * Default labor categories (manufacturing-focused)
 */
export const DEFAULT_LABOR_CATEGORIES = [
  { id: 'manufacturing', name: 'Manufacturing', description: 'Cutting, shaping, forming materials', defaultSkillLevel: 'intermediate' as const },
  { id: 'assembly', name: 'Assembly', description: 'Putting components together', defaultSkillLevel: 'entry' as const },
  { id: 'finishing', name: 'Finishing', description: 'Painting, staining, polishing', defaultSkillLevel: 'intermediate' as const },
  { id: 'qualityControl', name: 'Quality Control', description: 'Inspection, testing', defaultSkillLevel: 'entry' as const },
];

/**
 * Default overhead range
 */
export const DEFAULT_OVERHEAD_RANGE = {
  min: 0.15,
  max: 0.40,
  typical: 0.25,
};
