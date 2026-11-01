import { useState, useEffect } from 'react';
import { PortfolioData } from './types/portfolio';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ProjectsSection } from './components/ProjectsSection';
import { SkillsSection } from './components/SkillsSection';
import { CertificationsSection } from './components/CertificationsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminBar } from './components/AdminBar';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sync navigation on browser popstate & listen to keyboard shortcut Ctrl+Shift+A
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A or Cmd+Shift+A opens admin
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigateTo('/admin');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verify Admin Session on mount or path change
  const verifyAdminSession = async () => {
    setCheckingAuth(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.user);
      } else {
        setAdminUser(null);
        localStorage.removeItem('admin_token');
      }
    } catch {
      setAdminUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Fetch Public Portfolio
  const fetchPublicPortfolio = async () => {
    try {
      const res = await fetch('/api/public/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (err) {
      console.error('Error fetching public portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAdminSession();
    fetchPublicPortfolio();
  }, []);

  const handleLoginSuccess = (_token: string, user: { email: string; role: string }) => {
    setAdminUser(user);
    navigateTo('/admin');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_token');
    setAdminUser(null);
    navigateTo('/');
  };

  // Check if current route is private admin
  const isAdminRoute = currentPath.startsWith('/admin');

  // ADMIN ROUTE HANDLING
  if (isAdminRoute) {
    if (checkingAuth) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#2A1E17] gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8C5E34]" />
          <span className="text-sm font-medium">Verifying administrator authorization...</span>
        </div>
      );
    }

    if (!adminUser) {
      // Unauthenticated visitor attempting to access /admin -> private login
      return (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onBackToPublic={() => navigateTo('/')}
        />
      );
    }

    // Authenticated administrator -> private dashboard
    return (
      <AdminDashboard
        onLogout={handleLogout}
        onReturnToPublic={() => navigateTo('/')}
      />
    );
  }

  // PUBLIC WEBSITE (Strictly public, no admin or dashboard link)
  if (loading && !portfolio) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#2A1E17] gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#8C5E34]" />
        <span className="text-sm font-medium">Loading portfolio...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#3E2C22] flex flex-col font-sans selection:bg-[#E8DDD0] selection:text-[#3E2C22]">
      {/* Admin Bar (Active top bar if logged in, or floating access button) */}
      <AdminBar
        isAdminLoggedIn={Boolean(adminUser)}
        adminEmail={adminUser?.email}
        onOpenDashboard={() => navigateTo('/admin')}
        onOpenLogin={() => navigateTo('/admin')}
        onLogout={handleLogout}
      />

      {/* Public Header */}
      <Navbar profile={portfolio?.profile || null} />

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero profile={portfolio?.profile || null} />

        {/* About Gabriella Christiani */}
        <AboutSection profile={portfolio?.profile || null} />

        {/* Professional Experience Timeline */}
        <ExperienceSection experiences={portfolio?.experiences || []} />

        {/* Business Analysis & Data Analytics Projects */}
        <ProjectsSection projects={portfolio?.projects || []} />

        {/* Core Competencies & Skills */}
        <SkillsSection
          certifications={portfolio?.certifications || []}
          profile={portfolio?.profile || null}
        />

        {/* Accredited Certifications with Image Lightbox */}
        <CertificationsSection certifications={portfolio?.certifications || []} />

        {/* Contact Form & Information */}
        <ContactSection profile={portfolio?.profile || null} />
      </main>

      {/* Public Footer - Strictly no admin link */}
      <Footer profile={portfolio?.profile || null} />
    </div>
  );
}
