import React from 'react';
import { Shield, LayoutDashboard, PlusCircle, Upload, LogOut, ArrowRight, Lock } from 'lucide-react';

interface AdminBarProps {
  isAdminLoggedIn: boolean;
  adminEmail?: string;
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({
  isAdminLoggedIn,
  adminEmail,
  onOpenDashboard,
  onOpenLogin,
  onLogout,
}) => {
  if (isAdminLoggedIn) {
    return (
      <div className="bg-[#3E2C22] text-[#F8F5EF] text-xs py-2 px-4 sm:px-8 border-b border-[#694B36] flex items-center justify-between z-50 sticky top-0 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-[#DCC9B3]">
            <Shield className="w-3.5 h-3.5 text-[#A58A73]" />
            <span className="hidden sm:inline">Admin Mode:</span>
            <span className="text-[#FFFCF7] font-semibold">{adminEmail || 'Gabriella Christiani'}</span>
          </div>

          <span className="text-[#806047] hidden sm:inline">|</span>

          <button
            onClick={onOpenDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#694B36] hover:bg-[#806047] text-[#FFFCF7] font-semibold transition-colors"
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Open Dashboard</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-[#DCC9B3] hover:text-[#FFFCF7] transition-colors font-medium"
            title="Log out of admin"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Floating discreet access trigger at bottom-right so Gabriella can easily enter Admin Portal inside the preview iframe
  return (
    <aside aria-label="Administrator access" className="fixed bottom-4 right-4 z-40">
      <button
        onClick={onOpenLogin}
        className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#3E2C22]/90 hover:bg-[#3E2C22] text-[#F8F5EF] text-xs font-semibold shadow-lg hover:shadow-xl backdrop-blur-md border border-[#DCC9B3]/40 transition-all hover:scale-105"
        title="Admin Portal Access"
        aria-label="Open Admin Login Portal"
      >
        <Lock className="w-3.5 h-3.5 text-[#DCC9B3] group-hover:text-white transition-colors" />
        <span className="opacity-90 group-hover:opacity-100">Admin Portal</span>
        <ArrowRight className="w-3 h-3 text-[#A58A73] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </aside>
  );
};
