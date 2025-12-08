/**
 * Prompt system exports
 *
 * Usage:
 *   import { getPrompt, getCategoryConfig, getAvailableCategories } from '../prompts';
 */

export {
  getPrompt,
  getPromptBuilder,
  getCategoryConfig,
  getAvailableCategories,
  clearPromptCache,
} from './registry';

export type {
  PromptType,
  PromptBuilder,
  PromptContext,
  PromptModule,
  CategoryConfig,
} from './types';

export {
  DEFAULT_LABOR_CATEGORIES,
  DEFAULT_OVERHEAD_RANGE,
} from './types';
