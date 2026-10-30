import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterProjects,
  searchProjects,
  validateProjectInput,
  isCvAvailable,
  truncateText,
} from './portfolio-logic';
import { Project, Profile } from '../types/portfolio';

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Customer Onboarding Workflow Optimization',
    category: 'business-analysis',
    tagline: 'Streamlined client intake across 4 departments.',
    problemStatement: 'High onboarding latency leading to 18% client drop-off.',
    methodology: 'BPMN 2.0 mapping and gap analysis with cross-functional workshops.',
    deliverables: ['As-Is and To-Be Process Maps', 'Business Requirements Document (BRD)'],
    tools: ['Jira', 'Lucidchart', 'Confluence'],
    results: ['Reduced onboarding cycle time by 34%'],
    images: [],
    published: true,
    date: '2025',
    createdAt: '2025-01-01',
  },
  {
    id: 'proj-2',
    title: 'Executive Sales & Retention Dashboard',
    category: 'data-analytics',
    tagline: 'Interactive Power BI reporting suite.',
    problemStatement: 'Fragmented sales metrics across legacy CSV spreadsheets.',
    methodology: 'Data modeling with Star Schema and DAX measure calculations.',
    deliverables: ['Automated ETL Pipeline', 'Interactive KPI Dashboard'],
    tools: ['Power BI', 'SQL', 'PostgreSQL'],
    results: ['Eliminated 12 hours/week of manual spreadsheet compilation'],
    images: [],
    published: true,
    date: '2025',
    createdAt: '2025-02-01',
  },
  {
    id: 'proj-3',
    title: 'Internal Inventory Variance Study',
    category: 'data-analytics',
    tagline: 'Root cause analysis on stock reconciliation.',
    problemStatement: 'Unexplained inventory discrepancies.',
    methodology: 'Statistical hypothesis testing and correlation modeling.',
    deliverables: ['Executive Whitepaper'],
    tools: ['Python', 'Pandas'],
    results: ['Identified 92% of discrepancy causes'],
    images: [],
    published: false, // Draft!
    date: '2026',
    createdAt: '2026-01-01',
  },
];

test('filterProjects excludes unpublished drafts by default', () => {
  const published = filterProjects(mockProjects, 'all', true);
  assert.equal(published.length, 2);
  assert.ok(published.every((p) => p.published));
});

test('filterProjects includes drafts when onlyPublished is false (admin mode)', () => {
  const all = filterProjects(mockProjects, 'all', false);
  assert.equal(all.length, 3);
});

test('filterProjects filters correctly by category', () => {
  const ba = filterProjects(mockProjects, 'business-analysis', true);
  assert.equal(ba.length, 1);
  assert.equal(ba[0].id, 'proj-1');

  const da = filterProjects(mockProjects, 'data-analytics', true);
  assert.equal(da.length, 1);
  assert.equal(da[0].id, 'proj-2');
});

test('searchProjects matches title and tools correctly', () => {
  const byTool = searchProjects(mockProjects, 'Power BI');
  assert.equal(byTool.length, 1);
  assert.equal(byTool[0].id, 'proj-2');

  const byTitle = searchProjects(mockProjects, 'Workflow');
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].id, 'proj-1');
});

test('validateProjectInput verifies required fields', () => {
  const invalid = validateProjectInput({ title: 'Hi' });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.length >= 2);

  const valid = validateProjectInput({
    title: 'Enterprise Analytics Redesign',
    category: 'business-analysis',
    tagline: 'Comprehensive overhaul of KPIs',
    problemStatement: 'Inconsistent data definitions across departments causing billing errors.',
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.errors.length, 0);
});

test('isCvAvailable correctly validates presence of uploaded CV', () => {
  const noProfile: Profile = {
    fullName: 'Gabriella Christiani',
    title: 'Junior Business Analyst | Junior Data Analyst',
    email: 'gabriellachristiani77@gmail.com',
    location: 'Jakarta, Indonesia',
    linkedInUrl: 'https://linkedin.com',
    bioSummary: 'Bio',
    bioParagraphs: ['Bio'],
    educationTimeline: [],
    areasOfInterest: [],
    professionalStrengths: [],
    coreCompetencies: [],
    cvUrl: '',
  };
  assert.equal(isCvAvailable(noProfile), false);

  const withCv: Profile = {
    ...noProfile,
    cvUrl: '/uploads/cv/gabriella-christiani-cv.pdf',
  };
  assert.equal(isCvAvailable(withCv), true);
});

test('truncateText truncates cleanly at word boundary', () => {
  const text = 'Business requirements and stakeholder management are vital';
  const truncated = truncateText(text, 25);
  assert.ok(truncated.length <= 28);
  assert.ok(truncated.endsWith('...'));
});
