import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  FileText,
  User,
  Briefcase,
  Award,
  MessageSquare,
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Calendar,
  X,
  RefreshCw,
  Image as ImageIcon,
  Compass,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  Smartphone,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import { PortfolioData, Project, Experience, Certification, Profile, EducationEntry } from '../../types/portfolio';

interface AdminDashboardProps {
  onLogout: () => void;
  onReturnToPublic: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onReturnToPublic }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'projects' | 'profile' | 'about' | 'experience' | 'skills' | 'certifications' | 'cv' | 'media' | 'messages' | 'security'
  >('overview');

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Project editing state
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    title: '',
    category: 'business-analysis',
    organization: '',
    role: '',
    projectType: '',
    tagline: '',
    problemStatement: '',
    methodology: '',
    deliverables: [],
    tools: [],
    results: [],
    images: [],
    published: true,
    featured: false,
    date: new Date().getFullYear().toString(),
  });
  const [rawDeliverables, setRawDeliverables] = useState('');
  const [rawTools, setRawTools] = useState('');
  const [rawResults, setRawResults] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Profile & Avatar state
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // About Me form state
  const [bioParagraphsText, setBioParagraphsText] = useState('');
  const [rawInterests, setRawInterests] = useState('');
  const [rawStrengths, setRawStrengths] = useState('');

  // CV Upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // MFA Status & Regeneration state
  const [mfaStatus, setMfaStatus] = useState<{
    mfaEnabled: boolean;
    enrolledAt: string | null;
    totalRecoveryCodes: number;
    remainingRecoveryCodes: number;
  } | null>(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [regenTotp, setRegenTotp] = useState('');
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);
  const [copiedNewCodes, setCopiedNewCodes] = useState(false);

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('admin_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchMfaStatus = async () => {
    try {
      const res = await fetch('/api/admin/mfa/status', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setMfaStatus(data);
      }
    } catch {
      // ignore
    }
  };

  const handleRegenerateRecoveryCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegeneratingCodes(true);
    try {
      const res = await fetch('/api/admin/mfa/regenerate-recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          currentPassword: regenPassword,
          totpCode: regenTotp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate recovery codes');
      }

      setNewRecoveryCodes(data.recoveryCodes);
      showNotice('success', 'New emergency recovery codes generated successfully!');
      fetchMfaStatus();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Error regenerating codes');
    } finally {
      setRegeneratingCodes(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portfolio', {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        throw new Error('Failed to fetch portfolio data');
      }
      const data = await res.json();
      setPortfolio(data);
      if (data.messages) setMessages(data.messages);
      if (data.profile) {
        setProfileForm(data.profile);
        setBioParagraphsText((data.profile.bioParagraphs || []).join('\n\n'));
        setRawInterests((data.profile.areasOfInterest || []).join('\n'));
        setRawStrengths((data.profile.professionalStrengths || []).join('\n'));
      }
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Error fetching administration data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data.media || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchMfaStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'media') {
      fetchMedia();
    } else if (activeTab === 'security') {
      fetchMfaStatus();
    }
  }, [activeTab]);

  // --- AVATAR UPLOAD ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/admin/profile/avatar', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');
      showNotice('success', 'Profile picture updated successfully!');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- PROJECT ACTIONS ---
  const handleOpenNewProject = () => {
    setProjectForm({
      title: '',
      category: 'business-analysis',
      organization: '',
      role: '',
      projectType: '',
      tagline: '',
      problemStatement: '',
      methodology: '',
      deliverables: [],
      tools: [],
      results: [],
      images: [],
      published: true,
      featured: false,
      date: new Date().getFullYear().toString(),
    });
    setRawDeliverables('');
    setRawTools('');
    setRawResults('');
    setIsEditingProject(true);
  };

  const handleEditProject = (p: Project) => {
    setProjectForm(p);
    setRawDeliverables((p.deliverables || []).join('\n'));
    setRawTools((p.tools || []).join(', '));
    setRawResults((p.results || []).join('\n'));
    setIsEditingProject(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.tagline) {
      showNotice('error', 'Title and tagline are required.');
      return;
    }

    const payload = {
      ...projectForm,
      deliverables: rawDeliverables
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      tools: rawTools
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      results: rawResults
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const isUpdate = Boolean(projectForm.id);
    const url = isUpdate ? `/api/admin/projects/${projectForm.id}` : '/api/admin/projects';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save project');
      showNotice('success', isUpdate ? 'Project updated' : 'Project created');
      setIsEditingProject(false);
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to delete project');
      showNotice('success', 'Project removed');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleTogglePublish = async (p: Project) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(`/api/admin/projects/${p.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ published: !p.published }),
      });
      if (!res.ok) throw new Error('Status update failed');
      showNotice('success', `Project ${!p.published ? 'published' : 'moved to drafts'}`);
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const newUrls = (data.files || []).map((f: any) => f.url);
      setProjectForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newUrls],
      }));
      showNotice('success', `${newUrls.length} image(s) uploaded successfully`);
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // --- CV MANAGEMENT ---
  const handleCvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      showNotice('error', 'Please choose a PDF or Word document file first.');
      return;
    }

    setUploadingCv(true);
    const formData = new FormData();
    formData.append('cv', cvFile);

    try {
      const res = await fetch('/api/admin/cv', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload CV');

      showNotice('success', data.message || 'CV uploaded and stored persistently.');
      setCvFile(null);
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'CV upload failed');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleDeleteCv = async () => {
    if (!confirm('Are you sure you want to remove your CV? The public CV download button will immediately disappear.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/cv', {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove CV');
      showNotice('success', 'CV deleted. Public download button is now hidden.');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to delete CV');
    }
  };

  // --- SAVE PROFILE & ABOUT ME ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...profileForm,
        bioParagraphs: bioParagraphsText
          .split('\n\n')
          .map((p) => p.trim())
          .filter(Boolean),
        areasOfInterest: rawInterests
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        professionalStrengths: rawStrengths
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Profile update failed');
      showNotice('success', 'Profile and about information saved successfully');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Error updating profile');
    }
  };

  // --- PASSWORD UPDATE ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice('error', 'New passwords do not match');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      showNotice('success', 'Administrator password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#3E2C22]">
      {/* Top Admin Header */}
      <header className="bg-[#FFFCF7] border-b border-[#DCC9B3] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-xl font-bold text-[#3E2C22]">
              Gabriella Christiani
            </span>
            <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-[#F1E8DC] text-[#694B36]">
              Private Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onReturnToPublic}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#694B36] hover:text-[#3E2C22] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C2E24] hover:text-red-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Notice */}
      {notification && (
        <div
          className={`px-4 py-3 text-xs font-semibold text-center ${
            notification.type === 'success'
              ? 'bg-[#EAF5EC] text-[#206935] border-b border-[#C2E4C9]'
              : 'bg-[#FDF2F0] text-[#8C2E24] border-b border-[#F2C4BE]'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <nav className="lg:col-span-3 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>1. Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>2. Manage Profile & Photo</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'about'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>3. Manage About Me</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('projects');
                setIsEditingProject(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="w-4 h-4" />
                <span>4. Manage Projects</span>
              </div>
              <span className="text-[11px] font-semibold">{portfolio?.projects?.length || 0}</span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'experience'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                <span>5. Manage Experience</span>
              </div>
              <span className="text-[11px] font-semibold">{portfolio?.experiences?.length || 0}</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'skills'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>6. Manage Skills</span>
            </button>

            <button
              onClick={() => setActiveTab('certifications')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'certifications'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4" />
                <span>7. Certifications</span>
              </div>
              <span className="text-[11px] font-semibold">{portfolio?.certifications?.length || 0}</span>
            </button>

            <button
              onClick={() => setActiveTab('cv')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'cv'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>8. Manage CV</span>
              </div>
              {portfolio?.profile?.cvUrl ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active on Public Site" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Hidden" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'media'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>9. Media Library</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'messages'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>10. Inquiries</span>
              </div>
              {messages.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#694B36] text-white">
                  {messages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'security'
                  ? 'bg-[#3E2C22] text-[#F8F5EF]'
                  : 'bg-[#FFFCF7] text-[#694B36] hover:bg-[#F1E8DC] border border-[#DCC9B3]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>11. Security</span>
            </button>
          </nav>

          {/* Main Content Area */}
          <main className="lg:col-span-9 bg-[#FFFCF7] border border-[#DCC9B3] rounded-[32px] p-6 sm:p-8 shadow-sm min-h-[550px]">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-sm text-[#806047] gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#694B36]" />
                <span>Loading administration records...</span>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Portfolio Overview
                      </h2>
                      <p className="text-xs text-[#806047] mt-1">
                        Welcome to your private management portal, Gabriella. Review high-level metrics and public status.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#806047]">
                          Total Projects
                        </div>
                        <div className="font-editorial text-3xl font-bold text-[#3E2C22]">
                          {portfolio?.projects?.length || 0}
                        </div>
                        <div className="text-[11px] text-[#694B36]">
                          {portfolio?.projects?.filter((p) => p.published).length || 0} published on site
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#806047]">
                          CV Download Status
                        </div>
                        <div className="font-editorial text-2xl font-bold text-[#3E2C22] flex items-center gap-2">
                          {portfolio?.profile?.cvUrl ? (
                            <span className="text-emerald-700 text-lg">Active</span>
                          ) : (
                            <span className="text-amber-700 text-lg">Hidden (No CV)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#806047]">
                          {portfolio?.profile?.cvFileName || 'Upload in CV section'}
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#806047]">
                          Visitor Inquiries
                        </div>
                        <div className="font-editorial text-3xl font-bold text-[#3E2C22]">
                          {messages.length}
                        </div>
                        <div className="text-[11px] text-[#694B36]">Direct messages from contact form</div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#F1E8DC]/60 border border-[#DCC9B3] space-y-3">
                      <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                        Quick Shortcuts
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setActiveTab('projects');
                            handleOpenNewProject();
                          }}
                          className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                        >
                          + Add New Project
                        </button>
                        <button
                          onClick={() => setActiveTab('cv')}
                          className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#3E2C22] text-[#3E2C22] hover:bg-[#F8F5EF] transition-colors"
                        >
                          Upload / Replace CV
                        </button>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#3E2C22] text-[#3E2C22] hover:bg-[#F8F5EF] transition-colors"
                        >
                          Update Profile Picture
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MANAGE PROFILE & PHOTO */}
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Profile & Portrait Management
                      </h2>
                      <p className="text-xs text-[#806047] mt-1">
                        Upload your real photograph, edit your professional title, and update contact links.
                      </p>
                    </div>

                    {/* Profile Picture Upload Box */}
                    <div className="p-6 rounded-3xl bg-[#F8F5EF] border border-[#DCC9B3] flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#DCC9B3] bg-[#E8DDD0] shrink-0 flex items-center justify-center">
                        {portfolio?.profile?.avatarUrl ? (
                          <img
                            src={portfolio.profile.avatarUrl}
                            alt="Current profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-[#806047]" />
                        )}
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <h4 className="text-sm font-bold text-[#3E2C22]">
                          Upload Your Profile Photo
                        </h4>
                        <p className="text-xs text-[#806047]">
                          Upload a professional portrait (JPG, PNG, WebP). The image is stored persistently and immediately appears on your homepage.
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="text-xs text-[#694B36] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36]"
                        />
                        {uploadingAvatar && (
                          <p className="text-xs text-[#694B36]">Uploading portrait...</p>
                        )}
                      </div>
                    </div>

                    {/* Profile Info Form */}
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            Full Professional Name
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.fullName || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            Professional Title
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.title || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={profileForm.email || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            Location & Availability
                          </label>
                          <input
                            type="text"
                            value={profileForm.location || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            LinkedIn Profile URL
                          </label>
                          <input
                            type="url"
                            value={profileForm.linkedInUrl || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, linkedInUrl: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                      >
                        Save Profile Information
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. MANAGE ABOUT ME */}
                {activeTab === 'about' && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Manage About Me & Narrative
                      </h2>
                      <p className="text-xs text-[#806047] mt-1">
                        Edit your biographical narrative, education timeline notes, and strengths without modifying code.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                        Bio Summary
                      </label>
                      <textarea
                        rows={2}
                        value={profileForm.bioSummary || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bioSummary: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                        Detailed Biography Paragraphs (Separate paragraphs with a blank line)
                      </label>
                      <textarea
                        rows={6}
                        value={bioParagraphsText}
                        onChange={(e) => setBioParagraphsText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                          Areas of Interest (One per line)
                        </label>
                        <textarea
                          rows={4}
                          value={rawInterests}
                          onChange={(e) => setRawInterests(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                          Professional Strengths (One per line)
                        </label>
                        <textarea
                          rows={4}
                          value={rawStrengths}
                          onChange={(e) => setRawStrengths(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                    >
                      Save About Information
                    </button>
                  </form>
                )}

                {/* 4. MANAGE PROJECTS */}
                {activeTab === 'projects' && (
                  <div>
                    {!isEditingProject ? (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCC9B3]">
                          <div>
                            <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                              Manage Projects
                            </h2>
                            <p className="text-xs text-[#806047]">
                              Add, edit, reorder, and upload screenshots for your Business Analysis and Data Analytics projects.
                            </p>
                          </div>
                          <button
                            onClick={handleOpenNewProject}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors self-start sm:self-auto"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Project</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {portfolio?.projects?.map((proj) => (
                            <div
                              key={proj.id}
                              className="p-5 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-[#806047] uppercase tracking-wider">
                                    {proj.category === 'business-analysis' ? 'Business Analysis' : 'Data Analytics'}
                                  </span>
                                  <span className="text-[#DCC9B3]">·</span>
                                  <span className="text-[#806047]">{proj.period || proj.date}</span>
                                  <span className="text-[#DCC9B3]">·</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      proj.published
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {proj.published ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                                <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                                  {proj.title}
                                </h3>
                                <p className="text-xs text-[#694B36] line-clamp-1">{proj.tagline}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleTogglePublish(proj)}
                                  className="p-2.5 rounded-xl border border-[#DCC9B3] hover:bg-[#FFFCF7] text-[#3E2C22] transition-colors"
                                  title={proj.published ? 'Unpublish' : 'Publish'}
                                >
                                  {proj.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                                </button>
                                <button
                                  onClick={() => handleEditProject(proj)}
                                  className="p-2.5 rounded-xl border border-[#DCC9B3] hover:bg-[#FFFCF7] text-[#3E2C22] transition-colors"
                                  title="Edit project"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(proj.id, proj.title)}
                                  className="p-2.5 rounded-xl border border-[#F2C4BE] text-[#8C2E24] hover:bg-red-50 transition-colors"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Project Create / Edit Form */
                      <form onSubmit={handleSaveProject} className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-[#DCC9B3]">
                          <h2 className="font-editorial text-2xl font-bold text-[#3E2C22]">
                            {projectForm.id ? 'Edit Project' : 'Create New Project'}
                          </h2>
                          <button
                            type="button"
                            onClick={() => setIsEditingProject(false)}
                            className="p-2 rounded-lg text-[#806047] hover:bg-[#F1E8DC]"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Project Title *
                            </label>
                            <input
                              type="text"
                              required
                              value={projectForm.title || ''}
                              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Discipline Category *
                            </label>
                            <select
                              value={projectForm.category}
                              onChange={(e) =>
                                setProjectForm({
                                  ...projectForm,
                                  category: e.target.value as 'business-analysis' | 'data-analytics',
                                })
                              }
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            >
                              <option value="business-analysis">Business Analysis & Information Systems</option>
                              <option value="data-analytics">Data Analytics & Data Science</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Organization / Program
                            </label>
                            <input
                              type="text"
                              value={projectForm.organization || ''}
                              onChange={(e) => setProjectForm({ ...projectForm, organization: e.target.value })}
                              placeholder="e.g. BPKP, BitLabs Academy, Telkom University"
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              One-Line Summary / Tagline *
                            </label>
                            <input
                              type="text"
                              required
                              value={projectForm.tagline || ''}
                              onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Business Problem Statement *
                            </label>
                            <textarea
                              rows={3}
                              required
                              value={projectForm.problemStatement || ''}
                              onChange={(e) =>
                                setProjectForm({ ...projectForm, problemStatement: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Analytical Methodology & Process *
                            </label>
                            <textarea
                              rows={3}
                              required
                              value={projectForm.methodology || ''}
                              onChange={(e) => setProjectForm({ ...projectForm, methodology: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Key Deliverables (One per line)
                            </label>
                            <textarea
                              rows={3}
                              value={rawDeliverables}
                              onChange={(e) => setRawDeliverables(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Measurable Results (One per line)
                            </label>
                            <textarea
                              rows={3}
                              value={rawResults}
                              onChange={(e) => setRawResults(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Tools & Software (Comma separated)
                            </label>
                            <input
                              type="text"
                              value={rawTools}
                              onChange={(e) => setRawTools(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          {/* Image uploads */}
                          <div className="sm:col-span-2 p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36]">
                              Upload Screenshots, Diagrams, or Wireframes
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleProjectImageUpload}
                              disabled={uploadingImage}
                              className="text-xs text-[#694B36] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36]"
                            />
                            {uploadingImage && (
                              <p className="text-xs text-[#694B36]">Uploading images...</p>
                            )}
                            {projectForm.images && projectForm.images.length > 0 && (
                              <div className="flex flex-wrap gap-3 pt-2">
                                {projectForm.images.map((img, iIdx) => (
                                  <div key={iIdx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#DCC9B3]">
                                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setProjectForm({
                                          ...projectForm,
                                          images: projectForm.images?.filter((_, idx) => idx !== iIdx),
                                        })
                                      }
                                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3E2C22]">
                              <input
                                type="checkbox"
                                checked={projectForm.published}
                                onChange={(e) => setProjectForm({ ...projectForm, published: e.target.checked })}
                                className="rounded text-[#694B36] focus:ring-[#694B36]"
                              />
                              <span>Publish immediately on public website</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-[#DCC9B3]">
                          <button
                            type="submit"
                            className="px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                          >
                            Save Project
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingProject(false)}
                            className="px-6 py-3.5 rounded-full text-xs font-bold text-[#806047] hover:bg-[#F1E8DC] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 5. MANAGE EXPERIENCE */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-[#DCC9B3]">
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Professional Experience
                      </h2>
                      <p className="text-xs text-[#806047]">
                        Manage official positions at BPKP, Telkom University, and logistics enterprises.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {portfolio?.experiences?.map((exp) => (
                        <div key={exp.id} className="p-5 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] space-y-2">
                          <div className="flex items-baseline justify-between">
                            <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">{exp.role}</h3>
                            <span className="text-xs font-bold text-[#806047]">{exp.period}</span>
                          </div>
                          <div className="text-xs text-[#806047] font-semibold">
                            {exp.company} {exp.division ? `· ${exp.division}` : ''}
                          </div>
                          <p className="text-xs text-[#694B36] leading-relaxed">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. MANAGE SKILLS */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-[#DCC9B3]">
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Competencies & Skill Sets
                      </h2>
                      <p className="text-xs text-[#806047]">
                        Structured skill domains across Business Analysis, Data Analytics, and Design.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {portfolio?.profile?.coreCompetencies?.map((group) => (
                        <div key={group.category} className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-3">
                          <h4 className="font-editorial text-lg font-bold text-[#3E2C22]">{group.category}</h4>
                          <ul className="space-y-1.5">
                            {group.skills.map((skill) => (
                              <li key={skill} className="text-xs text-[#694B36] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#806047]" />
                                <span>{skill}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. MANAGE CERTIFICATIONS */}
                {activeTab === 'certifications' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-[#DCC9B3]">
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Accredited Certifications
                      </h2>
                      <p className="text-xs text-[#806047]">
                        BNSP Associate Data Scientist, BitLabs Academy, and TOEFL EPrT credentials.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {portfolio?.certifications?.map((cert) => (
                        <div key={cert.id} className="p-5 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-[#806047] uppercase tracking-wider">
                              {cert.issuer} · {cert.period || cert.issueDate}
                            </span>
                            <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">{cert.title}</h3>
                            <p className="text-xs text-[#694B36]">Verified: {cert.skills.join(', ')}</p>
                          </div>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold uppercase tracking-wider text-[#694B36] hover:underline"
                            >
                              Verify
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. MANAGE CV */}
                {activeTab === 'cv' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Curriculum Vitae Management
                      </h2>
                      <p className="text-xs text-[#806047] mt-1">
                        Upload your authentic CV. The public Download CV button will only appear after a real CV is uploaded.
                      </p>
                    </div>

                    {/* Status Card */}
                    <div className="p-6 rounded-3xl bg-[#F8F5EF] border border-[#DCC9B3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                          {portfolio?.profile?.cvUrl ? (
                            <span className="flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle className="w-4 h-4" />
                              Public Download Button is ACTIVE
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-800">
                              <AlertCircle className="w-4 h-4" />
                              Public Download Button is HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#3E2C22]">
                          {portfolio?.profile?.cvUrl ? (
                            <>
                              Current CV: <strong>{portfolio.profile.cvFileName}</strong>
                            </>
                          ) : (
                            'No CV document is currently active.'
                          )}
                        </p>
                      </div>

                      {portfolio?.profile?.cvUrl && (
                        <div className="flex items-center gap-2">
                          <a
                            href={portfolio.profile.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full text-xs font-bold border border-[#DCC9B3] hover:bg-[#FFFCF7]"
                          >
                            Preview
                          </a>
                          <button
                            onClick={handleDeleteCv}
                            className="px-4 py-2 rounded-full text-xs font-bold border border-[#F2C4BE] text-[#8C2E24] hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Upload Box */}
                    <form onSubmit={handleCvUpload} className="p-6 rounded-3xl bg-[#FFFCF7] border border-[#DCC9B3] space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#694B36]">
                        {portfolio?.profile?.cvUrl ? 'Replace Current CV' : 'Upload Your Curriculum Vitae'}
                      </h3>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)}
                        className="text-xs text-[#694B36] file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36]"
                      />
                      <button
                        type="submit"
                        disabled={!cvFile || uploadingCv}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-50 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingCv ? 'Uploading...' : 'Save & Enable Public Download'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 9. MEDIA LIBRARY */}
                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-[#DCC9B3]">
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Persistent Media Library
                      </h2>
                      <p className="text-xs text-[#806047]">
                        All project images, screenshots, and diagrams stored persistently in server filesystem.
                      </p>
                    </div>

                    {mediaFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#806047] bg-[#F8F5EF] rounded-2xl">
                        No uploaded files yet. Upload images through the Project or Profile tabs.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {mediaFiles.map((file) => (
                          <div
                            key={file.filename}
                            className="rounded-2xl border border-[#DCC9B3] overflow-hidden bg-[#F8F5EF] flex flex-col"
                          >
                            <div className="aspect-video bg-[#E8DDD0] overflow-hidden">
                              <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                              <span className="font-semibold text-[#3E2C22] truncate block">
                                {file.filename}
                              </span>
                              <span className="text-[10px] text-[#806047]">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 10. INQUIRIES & MESSAGES */}
                {activeTab === 'messages' && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-[#DCC9B3]">
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Visitor Inquiries ({messages.length})
                      </h2>
                      <p className="text-xs text-[#806047]">
                        Direct inquiries received from recruiters and potential employers.
                      </p>
                    </div>

                    {messages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#806047] bg-[#F8F5EF] rounded-2xl">
                        No contact inquiries received yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className="p-5 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-[#3E2C22]">{msg.name}</span>
                              <span className="text-[11px] text-[#806047]">
                                {new Date(msg.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#694B36]">{msg.email}</div>
                            <div className="text-xs font-bold text-[#3E2C22]">Topic: {msg.subject}</div>
                            <p className="text-xs sm:text-sm text-[#3E2C22] bg-[#FFFCF7] p-3.5 rounded-xl border border-[#DCC9B3] leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 11. SECURITY */}
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div className="pb-4 border-b border-[#DCC9B3]">
                      <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                        Administrator Security & Access
                      </h2>
                      <p className="text-xs text-[#806047]">
                        Authorized Account: <strong>gabriellachristiani77@gmail.com</strong>
                      </p>
                    </div>

                    {/* Microsoft Authenticator TOTP Status Card */}
                    <div className="p-6 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] shadow-xs">
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                                Microsoft Authenticator MFA
                              </h3>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0F7F2] text-[#2D5A3A] border border-[#C5DEC9]">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{mfaStatus?.mfaEnabled ? 'Enforced' : 'Active'}</span>
                              </span>
                            </div>
                            <p className="text-xs text-[#806047]">
                              Standard RFC 6238 Time-based One-Time Password (TOTP)
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowRegenModal(true);
                            setNewRecoveryCodes([]);
                            setRegenPassword('');
                            setRegenTotp('');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#3E2C22] text-[#3E2C22] hover:bg-[#3E2C22] hover:text-[#F8F5EF] transition-colors shrink-0"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Regenerate Recovery Codes</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3] space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#806047]">
                            Enrolled Application
                          </span>
                          <div className="text-xs font-bold text-[#3E2C22]">
                            Microsoft Authenticator
                          </div>
                          <span className="text-[11px] text-[#A58A73]">
                            Mobile App (iOS / Android)
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3] space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#806047]">
                            Specification
                          </span>
                          <div className="text-xs font-bold text-[#3E2C22]">
                            RFC 6238 · 6 Digits
                          </div>
                          <span className="text-[11px] text-[#A58A73]">
                            30-second rotating window
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3] space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#806047]">
                            Emergency Recovery Codes
                          </span>
                          <div className="text-xs font-bold text-[#3E2C22]">
                            {mfaStatus?.remainingRecoveryCodes ?? 8} of {mfaStatus?.totalRecoveryCodes ?? 8} Unused
                          </div>
                          <span className="text-[11px] text-[#A58A73]">
                            Single-use emergency codes
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#806047] bg-[#F1E8DC]/60 p-3 rounded-xl border border-[#DCC9B3] flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#806047] shrink-0" />
                        <span>
                          Your TOTP secret key is encrypted at rest using AES-256-GCM. Session tokens are issued only after valid TOTP confirmation.
                        </span>
                      </div>
                    </div>

                    {/* Password Change Form */}
                    <div className="p-6 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-[#DCC9B3]">
                        <Lock className="w-4 h-4 text-[#694B36]" />
                        <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                          Change Administrator Password
                        </h3>
                      </div>

                      <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            Current Password
                          </label>
                          <input
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#FFFCF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            New Password (Min 8 characters)
                          </label>
                          <input
                            type="password"
                            required
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#FFFCF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            required
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#FFFCF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                        >
                          Update Password
                        </button>
                      </form>
                    </div>

                    {/* Modal: Regenerate Recovery Codes */}
                    {showRegenModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <div className="bg-[#FFFCF7] rounded-[28px] border border-[#DCC9B3] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
                          <div className="flex items-center justify-between pb-3 border-b border-[#DCC9B3]">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-5 h-5 text-[#694B36]" />
                              <h3 className="font-editorial text-2xl font-bold text-[#3E2C22]">
                                Regenerate Recovery Codes
                              </h3>
                            </div>
                            <button
                              onClick={() => setShowRegenModal(false)}
                              className="text-[#806047] hover:text-[#3E2C22] p-1"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {newRecoveryCodes.length === 0 ? (
                            <form onSubmit={handleRegenerateRecoveryCodes} className="space-y-4">
                              <p className="text-xs text-[#806047] leading-relaxed">
                                Regenerating recovery codes will immediately invalidate all previously issued codes.
                                To proceed, verify your current password and active 6-digit Microsoft Authenticator code.
                              </p>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                                  Current Password
                                </label>
                                <input
                                  type="password"
                                  required
                                  value={regenPassword}
                                  onChange={(e) => setRegenPassword(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                                  Current 6-Digit Code from Microsoft Authenticator
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  required
                                  placeholder="000 000"
                                  value={regenTotp}
                                  onChange={(e) => setRegenTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-center font-mono text-xl tracking-widest text-sm"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                  type="button"
                                  onClick={() => setShowRegenModal(false)}
                                  className="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider border border-[#DCC9B3] text-[#806047]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={regeneratingCodes || regenTotp.length !== 6 || !regenPassword}
                                  className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-50"
                                >
                                  {regeneratingCodes ? 'Generating...' : 'Regenerate Now'}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-3.5 rounded-xl bg-[#F0F7F2] border border-[#C5DEC9] text-xs text-[#2D5A3A]">
                                <strong>Success!</strong> 8 new recovery codes have been generated. Previous codes are now invalid.
                              </div>

                              <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-[#F8F5EF] border border-[#DCC9B3]">
                                {newRecoveryCodes.map((c, i) => (
                                  <div
                                    key={i}
                                    className="px-3 py-2 rounded-lg bg-[#FFFCF7] border border-[#DCC9B3] font-mono text-xs font-bold text-[#3E2C22]"
                                  >
                                    <span className="text-[#A58A73] mr-1">{i + 1}.</span> {c}
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(newRecoveryCodes.join('\n'));
                                    setCopiedNewCodes(true);
                                    setTimeout(() => setCopiedNewCodes(false), 2000);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#DCC9B3] bg-[#F8F5EF] text-xs font-bold text-[#694B36]"
                                >
                                  {copiedNewCodes ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedNewCodes ? 'Copied to Clipboard' : 'Copy Codes'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setShowRegenModal(false)}
                                  className="px-6 py-2.5 rounded-full bg-[#3E2C22] text-[#F8F5EF] text-xs font-bold uppercase tracking-wider"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
