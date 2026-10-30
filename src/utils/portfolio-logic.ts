import { Project, Profile, Experience } from '../types/portfolio';

/**
 * Filter projects based on category and published status.
 * In public view, only published projects are returned.
 */
export function filterProjects(
  projects: Project[],
  categoryFilter: 'all' | 'business-analysis' | 'data-analytics',
  onlyPublished: boolean = true
): Project[] {
  return projects.filter((project) => {
    if (onlyPublished && !project.published) {
      return false;
    }
    if (categoryFilter === 'all') {
      return true;
    }
    return project.category === categoryFilter;
  });
}

/**
 * Search projects by query string matching title, tools, or problem statement.
 */
export function searchProjects(projects: Project[], query: string): Project[] {
  if (!query || query.trim() === '') return projects;
  const q = query.toLowerCase().trim();
  return projects.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.tools.some((t) => t.toLowerCase().includes(q)) ||
      p.methodology.toLowerCase().includes(q)
  );
}

/**
 * Validates project input for admin creation/update.
 */
export function validateProjectInput(input: Partial<Project>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input.title || input.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  if (
    !input.category ||
    !['business-analysis', 'data-analytics'].includes(input.category)
  ) {
    errors.push('Category must be Business Analysis or Data Analytics');
  }
  if (!input.tagline || input.tagline.trim().length < 5) {
    errors.push('Tagline must be at least 5 characters long');
  }
  if (!input.problemStatement || input.problemStatement.trim().length < 10) {
    errors.push('Problem statement must be at least 10 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks whether Gabriella has an active uploaded CV.
 */
export function isCvAvailable(profile: Partial<Profile> | null | undefined): boolean {
  if (!profile) return false;
  return typeof profile.cvUrl === 'string' && profile.cvUrl.trim().length > 0;
}

/**
 * Calculates experience duration summary string.
 */
export function formatExperienceDuration(experiences: Experience[]): string {
  if (!experiences || experiences.length === 0) return '0 years';
  return `${experiences.length} positions held`;
}

/**
 * Truncates text cleanly for teasers without breaking words.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  const sub = text.slice(0, maxLength);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.slice(0, lastSpace) : sub) + '...';
}
