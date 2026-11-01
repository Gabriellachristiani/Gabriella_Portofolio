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
  Star,
  ArrowLeft,
  ArrowRight,
  Clock,
  Laptop,
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

  // Profile, Hero & About Photo states
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [uploadingHeroPhoto, setUploadingHeroPhoto] = useState(false);
  const [uploadingAboutPhoto, setUploadingAboutPhoto] = useState(false);

  // Certifications CRUD state
  const [isEditingCert, setIsEditingCert] = useState(false);
  const [certForm, setCertForm] = useState<Partial<Certification>>({
    title: '',
    issuer: '',
    issueDate: new Date().getFullYear().toString(),
    period: '',
    credentialUrl: '',
    skills: [],
    imageUrl: '',
    description: '',
  });
  const [rawCertSkills, setRawCertSkills] = useState('');
  const [uploadingCertImage, setUploadingCertImage] = useState(false);

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

  // Trusted Devices state
  const [trustedDevicesData, setTrustedDevicesData] = useState<{
    totalTrustedDevices: number;
    isCurrentDeviceTrusted: boolean;
    currentExpiresAt: string | null;
    devices: any[];
  } | null>(null);

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

  const fetchTrustedDevices = async () => {
    try {
      const res = await fetch('/api/admin/trusted-devices', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setTrustedDevicesData(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchMfaStatus();
    fetchTrustedDevices();
  }, []);

  useEffect(() => {
    if (activeTab === 'media') {
      fetchMedia();
    } else if (activeTab === 'security') {
      fetchMfaStatus();
      fetchTrustedDevices();
    }
  }, [activeTab]);

  // --- HERO PHOTO MANAGEMENT (INDEPENDENT) ---
  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeroPhoto(true);
    const formData = new FormData();
    formData.append('heroPhoto', file);

    try {
      const res = await fetch('/api/admin/profile/hero-photo', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload hero photo');
      showNotice('success', 'Hero photo uploaded and stored persistently!');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Hero photo upload failed');
    } finally {
      setUploadingHeroPhoto(false);
    }
  };

  const handleDeleteHeroPhoto = async () => {
    if (!confirm('Are you sure you want to remove your Hero photo? An artistic placeholder will be shown.')) return;
    try {
      const res = await fetch('/api/admin/profile/hero-photo', {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to remove hero photo');
      showNotice('success', 'Hero photo removed successfully.');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to remove hero photo');
    }
  };

  // --- ABOUT ME PHOTO MANAGEMENT (INDEPENDENT) ---
  const handleAboutPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAboutPhoto(true);
    const formData = new FormData();
    formData.append('aboutPhoto', file);

    try {
      const res = await fetch('/api/admin/profile/about-photo', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload About Me photo');
      showNotice('success', 'About Me photo uploaded and stored persistently!');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'About Me photo upload failed');
    } finally {
      setUploadingAboutPhoto(false);
    }
  };

  const handleDeleteAboutPhoto = async () => {
    if (!confirm('Are you sure you want to remove your About Me photo? A formal graduation badge placeholder will be shown.')) return;
    try {
      const res = await fetch('/api/admin/profile/about-photo', {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to remove About Me photo');
      showNotice('success', 'About Me photo removed successfully.');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to remove About Me photo');
    }
  };

  // --- CERTIFICATIONS CRUD & IMAGE MANAGEMENT ---
  const handleOpenNewCert = () => {
    setCertForm({
      title: '',
      issuer: '',
      issueDate: new Date().getFullYear().toString(),
      period: '',
      credentialUrl: '',
      skills: [],
      imageUrl: '',
      description: '',
    });
    setRawCertSkills('');
    setIsEditingCert(true);
  };

  const handleEditCert = (cert: Certification) => {
    setCertForm({
      ...cert,
      imageUrl: cert.imageUrl || cert.image || '',
    });
    setRawCertSkills((cert.skills || []).join(', '));
    setIsEditingCert(true);
  };

  const handleCertImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCertImage(true);
    const formData = new FormData();
    formData.append('certificateImage', file);

    try {
      const res = await fetch('/api/admin/certifications/upload-image', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload certificate image');
      setCertForm((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
        image: data.imageUrl,
      }));
      showNotice('success', 'Certificate image uploaded! Preview is shown below.');
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingCertImage(false);
    }
  };

  const handleRemoveCertImage = () => {
    setCertForm((prev) => ({
      ...prev,
      imageUrl: '',
      image: '',
    }));
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title || !certForm.issuer) {
      showNotice('error', 'Certification title and issuer are required.');
      return;
    }

    const payload = {
      ...certForm,
      skills: rawCertSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: certForm.imageUrl || '',
      image: certForm.imageUrl || '',
    };

    const isUpdate = Boolean(certForm.id);
    const url = isUpdate ? `/api/admin/certifications/${certForm.id}` : '/api/admin/certifications';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save certification');
      showNotice('success', isUpdate ? 'Certification updated successfully!' : 'Certification created successfully!');
      setIsEditingCert(false);
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Save certification failed');
    }
  };

  const handleDeleteCert = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove certification: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/certifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to delete certification');
      showNotice('success', 'Certification deleted successfully.');
      fetchData();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to delete certification');
    }
  };

  const handleRevokeTrustedDevices = async () => {
    if (!confirm('Are you sure you want to revoke all trusted devices? You will be prompted for Microsoft Authenticator OTP next time you sign in.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/trusted-devices/revoke', {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to revoke trusted devices');
      showNotice('success', 'All trusted devices revoked. Microsoft Authenticator required on next login.');
      fetchTrustedDevices();
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to revoke trusted devices');
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
      setProjectForm((prev) => {
        const updatedImages = [...(prev.images || []), ...newUrls];
        return {
          ...prev,
          images: updatedImages,
          coverImage: prev.coverImage || updatedImages[0] || '',
        };
      });
      showNotice('success', `${newUrls.length} image(s) uploaded successfully`);
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetCoverImage = (url: string) => {
    setProjectForm((prev) => ({
      ...prev,
      coverImage: url,
    }));
    showNotice('success', 'Cover image selected.');
  };

  const handleRemoveProjectImage = (indexToRemove: number) => {
    setProjectForm((prev) => {
      const currentList = prev.images || [];
      const imageToRemove = currentList[indexToRemove];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      const wasCover = prev.coverImage === imageToRemove;
      return {
        ...prev,
        images: updated,
        coverImage: wasCover ? (updated[0] || '') : prev.coverImage,
      };
    });
  };

  const handleMoveProjectImage = (index: number, direction: 'left' | 'right') => {
    setProjectForm((prev) => {
      const list = [...(prev.images || [])];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        images: list,
      };
    });
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

                    {/* Two Independent Photo Upload Cards: Hero Section & About Me */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 1. Hero Section Photo */}
                      <div className="p-6 rounded-3xl bg-[#F8F5EF] border border-[#DCC9B3] flex flex-col justify-between space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#DCC9B3] bg-[#E8DDD0] shrink-0 flex items-center justify-center">
                            {portfolio?.profile?.heroPhotoUrl ? (
                              <img
                                src={portfolio.profile.heroPhotoUrl}
                                alt="Hero section"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10 text-[#806047]" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#694B36] text-[#F8F5EF]">
                              Hero Section
                            </span>
                            <h4 className="text-sm font-bold text-[#3E2C22]">
                              Hero Section Photo
                            </h4>
                            <p className="text-xs text-[#806047] leading-relaxed">
                              Displayed in the top hero showcase alongside your headline. Neutral aesthetic placeholder used if empty.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#DCC9B3]/60">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleHeroPhotoUpload}
                            disabled={uploadingHeroPhoto}
                            className="text-xs text-[#694B36] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36] cursor-pointer"
                          />
                          {uploadingHeroPhoto && (
                            <p className="text-xs text-[#694B36] animate-pulse">Uploading hero photo...</p>
                          )}
                          {portfolio?.profile?.heroPhotoUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={handleDeleteHeroPhoto}
                                className="text-xs font-semibold text-[#8C2E24] hover:underline"
                              >
                                Remove Hero Photo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. About Me Section Photo */}
                      <div className="p-6 rounded-3xl bg-[#F8F5EF] border border-[#DCC9B3] flex flex-col justify-between space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#DCC9B3] bg-[#E8DDD0] shrink-0 flex items-center justify-center">
                            {portfolio?.profile?.aboutPhotoUrl ? (
                              <img
                                src={portfolio.profile.aboutPhotoUrl}
                                alt="About me section"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <GraduationCap className="w-10 h-10 text-[#806047]" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#806047] text-[#F8F5EF]">
                              About Me Section
                            </span>
                            <h4 className="text-sm font-bold text-[#3E2C22]">
                              About Me Photo
                            </h4>
                            <p className="text-xs text-[#806047] leading-relaxed">
                              Displayed in the About Me section next to your Telkom University education. Completely independent from Hero photo.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#DCC9B3]/60">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAboutPhotoUpload}
                            disabled={uploadingAboutPhoto}
                            className="text-xs text-[#694B36] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36] cursor-pointer"
                          />
                          {uploadingAboutPhoto && (
                            <p className="text-xs text-[#694B36] animate-pulse">Uploading About Me photo...</p>
                          )}
                          {portfolio?.profile?.aboutPhotoUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={handleDeleteAboutPhoto}
                                className="text-xs font-semibold text-[#8C2E24] hover:underline"
                              >
                                Remove About Me Photo
                              </button>
                            </div>
                          )}
                        </div>
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
                              <div className="flex items-start gap-4 flex-1">
                                {(proj.coverImage || (proj.images && proj.images[0])) ? (
                                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-[#DCC9B3] bg-[#E8DDD0] shrink-0">
                                    <img
                                      src={proj.coverImage || proj.images?.[0]}
                                      alt={proj.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-20 h-14 rounded-lg border border-[#DCC9B3] bg-[#E8DDD0] shrink-0 flex items-center justify-center text-[#806047]">
                                    <ImageIcon className="w-5 h-5 opacity-50" />
                                  </div>
                                )}

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
                                    {proj.images && proj.images.length > 0 && (
                                      <span className="text-[10px] text-[#806047] font-semibold">
                                        ({proj.images.length} screenshots)
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                                    {proj.title}
                                  </h3>
                                  <p className="text-xs text-[#694B36] line-clamp-1">{proj.tagline}</p>
                                </div>
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

                          {/* Project Cover & Gallery Image Management */}
                          <div className="sm:col-span-2 p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36]">
                                Project Screenshots, Diagrams & Cover Image
                              </label>
                              <p className="text-xs text-[#806047] mt-0.5">
                                Select image files directly from your computer (JPG, PNG, WebP). Pick any image as the primary card cover, or reorder them.
                              </p>
                            </div>

                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleProjectImageUpload}
                              disabled={uploadingImage}
                              className="text-xs text-[#694B36] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36] cursor-pointer"
                            />
                            {uploadingImage && (
                              <p className="text-xs text-[#694B36] animate-pulse">Uploading and storing images persistently...</p>
                            )}

                            {projectForm.images && projectForm.images.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                                {projectForm.images.map((img, iIdx) => {
                                  const isCover = (projectForm.coverImage === img) || (!projectForm.coverImage && iIdx === 0);
                                  return (
                                    <div
                                      key={iIdx}
                                      className={`rounded-xl overflow-hidden border p-2 bg-[#FFFCF7] flex flex-col justify-between space-y-2 transition-all ${
                                        isCover ? 'border-[#3E2C22] ring-2 ring-[#3E2C22]/20' : 'border-[#DCC9B3]'
                                      }`}
                                    >
                                      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#E8DDD0]">
                                        <img src={img} alt={`Screenshot ${iIdx + 1}`} className="w-full h-full object-cover" />
                                        {isCover && (
                                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#3E2C22] text-[#F8F5EF] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                            <Star className="w-3 h-3 fill-[#F8F5EF]" />
                                            Cover Image
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between pt-1 gap-1">
                                        {!isCover ? (
                                          <button
                                            type="button"
                                            onClick={() => handleSetCoverImage(img)}
                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-[#DCC9B3] text-[#694B36] hover:bg-[#F8F5EF]"
                                          >
                                            Set as Cover
                                          </button>
                                        ) : (
                                          <span className="text-[10px] font-bold text-emerald-800">
                                            ✓ Active Cover
                                          </span>
                                        )}

                                        <div className="flex items-center gap-1 ml-auto">
                                          <button
                                            type="button"
                                            disabled={iIdx === 0}
                                            onClick={() => handleMoveProjectImage(iIdx, 'left')}
                                            className="p-1 rounded border border-[#DCC9B3] hover:bg-[#F8F5EF] disabled:opacity-30 text-[#3E2C22]"
                                            title="Move left"
                                          >
                                            <ArrowLeft className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={iIdx === (projectForm.images?.length || 1) - 1}
                                            onClick={() => handleMoveProjectImage(iIdx, 'right')}
                                            className="p-1 rounded border border-[#DCC9B3] hover:bg-[#F8F5EF] disabled:opacity-30 text-[#3E2C22]"
                                            title="Move right"
                                          >
                                            <ArrowRight className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveProjectImage(iIdx)}
                                            className="p-1 rounded border border-[#F2C4BE] text-[#8C2E24] hover:bg-red-50"
                                            title="Remove image"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
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
                  <div>
                    {!isEditingCert ? (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCC9B3]">
                          <div>
                            <h2 className="font-editorial text-3xl font-bold text-[#3E2C22]">
                              Accredited Certifications
                            </h2>
                            <p className="text-xs text-[#806047]">
                              Upload certificate images, manage credentials, and configure verification links for your public portfolio.
                            </p>
                          </div>
                          <button
                            onClick={handleOpenNewCert}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors self-start sm:self-auto"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Certification</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {portfolio?.certifications?.map((cert) => {
                            const certImg = cert.imageUrl || cert.image;
                            return (
                              <div
                                key={cert.id}
                                className="p-5 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="flex items-start gap-4 flex-1">
                                  {certImg ? (
                                    <div className="w-20 h-16 rounded-xl overflow-hidden border border-[#DCC9B3] bg-[#E8DDD0] shrink-0">
                                      <img
                                        src={certImg}
                                        alt={cert.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-20 h-16 rounded-xl border border-[#DCC9B3] bg-[#E8DDD0] shrink-0 flex items-center justify-center text-[#806047]">
                                      <Award className="w-6 h-6 opacity-60" />
                                    </div>
                                  )}

                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="font-bold text-[#806047] uppercase tracking-wider">
                                        {cert.issuer}
                                      </span>
                                      <span className="text-[#DCC9B3]">·</span>
                                      <span className="text-[#806047]">{cert.period || cert.issueDate}</span>
                                      {certImg && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8DDD0] text-[#694B36]">
                                          Has Image
                                        </span>
                                      )}
                                    </div>

                                    <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                                      {cert.title}
                                    </h3>

                                    {cert.skills && cert.skills.length > 0 && (
                                      <p className="text-xs text-[#694B36]">
                                        <strong>Skills:</strong> {cert.skills.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {cert.credentialUrl && (
                                    <a
                                      href={cert.credentialUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2.5 rounded-xl border border-[#DCC9B3] hover:bg-[#FFFCF7] text-[#3E2C22] transition-colors"
                                      title="Open verification link"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleEditCert(cert)}
                                    className="p-2.5 rounded-xl border border-[#DCC9B3] hover:bg-[#FFFCF7] text-[#3E2C22] transition-colors"
                                    title="Edit certification"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCert(cert.id, cert.title)}
                                    className="p-2.5 rounded-xl border border-[#F2C4BE] text-[#8C2E24] hover:bg-red-50 transition-colors"
                                    title="Delete certification"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Certification Create / Edit Form */
                      <form onSubmit={handleSaveCert} className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-[#DCC9B3]">
                          <div>
                            <h2 className="font-editorial text-2xl font-bold text-[#3E2C22]">
                              {certForm.id ? 'Edit Certification' : 'Add New Certification'}
                            </h2>
                            <p className="text-xs text-[#806047] mt-0.5">
                              Upload the certificate image and provide credential details.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditingCert(false)}
                            className="p-2 rounded-lg text-[#806047] hover:bg-[#F1E8DC]"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Certificate Image Upload & Preview Box */}
                        <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-4">
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36]">
                            Upload Certificate Image (JPG, JPEG, PNG, WebP)
                          </label>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            {certForm.imageUrl ? (
                              <div className="relative w-44 h-32 rounded-xl overflow-hidden border-2 border-[#DCC9B3] bg-[#E8DDD0] shrink-0">
                                <img
                                  src={certForm.imageUrl}
                                  alt="Certificate preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveCertImage}
                                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                                  title="Remove certificate image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-44 h-32 rounded-xl border-2 border-dashed border-[#DCC9B3] bg-[#FFFCF7] flex flex-col items-center justify-center text-[#806047] shrink-0">
                                <Award className="w-8 h-8 opacity-40 mb-1" />
                                <span className="text-[11px] font-semibold">No Image Uploaded</span>
                              </div>
                            )}

                            <div className="space-y-2 flex-1">
                              <p className="text-xs text-[#806047] leading-relaxed">
                                Upload a clear photograph or high-resolution scan of your official certificate. This image will be displayed on the public website with zoom and fullscreen Lightbox preview.
                              </p>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/*"
                                onChange={handleCertImageUpload}
                                disabled={uploadingCertImage}
                                className="text-xs text-[#694B36] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E2C22] file:text-white hover:file:bg-[#694B36] cursor-pointer"
                              />
                              {uploadingCertImage && (
                                <p className="text-xs text-[#694B36] animate-pulse">Uploading and validating certificate image...</p>
                              )}
                              {certForm.imageUrl && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={handleRemoveCertImage}
                                    className="text-xs font-semibold text-[#8C2E24] hover:underline"
                                  >
                                    Remove certificate image
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Certification Title *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Associate Data Scientist"
                              value={certForm.title || ''}
                              onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Issuing Organization *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. BNSP (Badan Nasional Sertifikasi Profesi)"
                              value={certForm.issuer || ''}
                              onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Issue Date / Year
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2024"
                              value={certForm.issueDate || ''}
                              onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Validity Period / Label
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2024 - 2027 or Score 480"
                              value={certForm.period || ''}
                              onChange={(e) => setCertForm({ ...certForm, period: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Verification / Credential URL
                            </label>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={certForm.credentialUrl || ''}
                              onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Verified Skills (Comma separated)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Data Analytics, Python, Machine Learning, Statistical Evaluation"
                              value={rawCertSkills}
                              onChange={(e) => setRawCertSkills(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                              Description / Additional Notes
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Brief description or certificate score details..."
                              value={certForm.description || ''}
                              onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-[#DCC9B3]">
                          <button
                            type="submit"
                            className="px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                          >
                            Save Certification
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingCert(false)}
                            className="px-6 py-3.5 rounded-full text-xs font-bold text-[#806047] hover:bg-[#F1E8DC] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
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

                    {/* Trusted Devices & 30-Day Remember Status */}
                    <div className="p-6 rounded-2xl border border-[#DCC9B3] bg-[#F8F5EF] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#DCC9B3]">
                        <div className="flex items-center gap-2.5">
                          <Laptop className="w-5 h-5 text-[#694B36]" />
                          <div>
                            <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                              Trusted Devices (30-Day Remember)
                            </h3>
                            <p className="text-xs text-[#806047]">
                              Browsers checked with "Remember this device" bypass the 6-digit TOTP challenge on future logins for 30 days.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRevokeTrustedDevices}
                          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-[#F2C4BE] text-[#8C2E24] hover:bg-red-50 transition-colors shrink-0"
                        >
                          Revoke All Trusted Devices
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3] space-y-1">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-[#806047]">
                            Current Browser Status
                          </div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            {trustedDevicesData?.isCurrentDeviceTrusted ? (
                              <span className="text-emerald-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                Recognized Trusted Device (Active)
                              </span>
                            ) : (
                              <span className="text-[#806047] flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Standard Session (MFA Required Next Login)
                              </span>
                            )}
                          </div>
                          {trustedDevicesData?.currentExpiresAt && (
                            <p className="text-[11px] text-[#806047]">
                              Trust expires on: {new Date(trustedDevicesData.currentExpiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div className="p-4 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3] space-y-1">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-[#806047]">
                            Total Active Trusted Devices
                          </div>
                          <div className="font-editorial text-2xl font-bold text-[#3E2C22]">
                            {trustedDevicesData?.totalTrustedDevices || 0}
                          </div>
                          <p className="text-[11px] text-[#806047]">
                            Clicking Revoke All immediately forces Microsoft Authenticator TOTP verification on all browsers.
                          </p>
                        </div>
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
