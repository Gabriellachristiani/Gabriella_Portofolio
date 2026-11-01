export interface ProjectAspectMetric {
  aspect: string;
  sentimentDistribution?: string;
  scoreOrAccuracy?: string;
  note?: string;
}

export interface SupportingFile {
  id: string;
  name: string;
  url: string;
  size?: string;
}

export interface Project {
  id: string;
  title: string;
  category: 'business-analysis' | 'data-analytics';
  projectType?: string;
  organization?: string;
  period?: string;
  role?: string;
  tagline: string;
  problemStatement: string;
  methodology: string;
  deliverables: string[];
  tools: string[];
  results: string[];
  score?: string;
  aspectMetrics?: ProjectAspectMetric[];
  liveUrl?: string;
  coverImage?: string;
  images: string[];
  supportingFiles?: SupportingFile[];
  published: boolean;
  featured?: boolean;
  date: string;
  createdAt: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  division?: string;
  location: string;
  period: string;
  current: boolean;
  description: string;
  bulletPoints: string[];
  technologies: string[];
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  period?: string;
  credentialUrl?: string;
  credentialFileUrl?: string;
  skills: string[];
  imageUrl?: string;
  image?: string;
  description?: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
  gpa?: string;
  notes?: string;
}

export interface Profile {
  fullName: string;
  title: string;
  heroPhotoUrl?: string;
  aboutPhotoUrl?: string;
  avatarUrl?: string;
  greeting?: string;
  headline?: string;
  email: string;
  phone?: string;
  location: string;
  linkedInUrl: string;
  githubUrl?: string;
  bioSummary: string;
  bioParagraphs: string[];
  educationTimeline: EducationEntry[];
  areasOfInterest: string[];
  professionalStrengths: string[];
  coreCompetencies: {
    category: string;
    skills: string[];
  }[];
  cvUrl?: string;
  cvFileName?: string;
  cvUpdatedAt?: string;
}

export interface PortfolioData {
  profile: Profile;
  projects: Project[];
  experiences: Experience[];
  certifications: Certification[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}
