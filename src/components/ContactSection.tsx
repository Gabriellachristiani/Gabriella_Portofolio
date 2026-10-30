import React, { useState } from 'react';
import { Mail, MapPin, Linkedin, Send, CheckCircle2, AlertCircle, Phone, ArrowUpRight } from 'lucide-react';
import { Profile } from '../types/portfolio';

interface ContactSectionProps {
  profile: Profile | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ profile }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMessage('Please complete all required fields.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Connection error. Please try reaching out directly via email.'
      );
    }
  };

  return (
    <section id="contact" className="py-20 sm:py-28 bg-[#F1E8DC]/40 border-t border-[#DCC9B3]/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Context & Direct Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#806047] mb-2">
                <span>05. Communication</span>
              </div>
              <h2 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#3E2C22] mb-4">
                Let's Connect.
              </h2>
              <p className="text-base text-[#694B36] leading-relaxed">
                I'm always open to professional opportunities, collaborations, and conversations about business analysis, data, and technology.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#DCC9B3]">
              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
                <div className="w-10 h-10 rounded-xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#806047] font-semibold">
                    Direct Email
                  </div>
                  <a
                    href={`mailto:${profile?.email || 'gabriellachristiani77@gmail.com'}`}
                    className="text-sm font-bold text-[#3E2C22] hover:text-[#694B36] transition-colors"
                  >
                    {profile?.email || 'gabriellachristiani77@gmail.com'}
                  </a>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
                <div className="w-10 h-10 rounded-xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] shrink-0 mt-0.5">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#806047] font-semibold">
                    LinkedIn Network
                  </div>
                  <a
                    href={profile?.linkedInUrl || 'https://www.linkedin.com/in/gabriella-christiani'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#3E2C22] hover:text-[#694B36] transition-colors flex items-center gap-1"
                  >
                    <span>Connect on LinkedIn</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
                <div className="w-10 h-10 rounded-xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#806047] font-semibold">
                    Current Location & Availability
                  </div>
                  <div className="text-sm font-bold text-[#3E2C22]">
                    {profile?.location || 'Purwokerto & Jakarta, Indonesia'}
                  </div>
                  <div className="text-xs text-[#806047]">
                    Open to On-Site, Hybrid & Remote Roles
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-[#FFFCF7] border border-[#DCC9B3] rounded-[32px] p-8 sm:p-10 shadow-sm">
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#3E2C22] mb-2">
              Send a Direct Message
            </h3>
            <p className="text-sm text-[#694B36] mb-8">
              Reach out regarding job opportunities, project questions, or collaboration.
            </p>

            {status === 'success' ? (
              <div className="p-8 rounded-2xl bg-[#F8F5EF] border border-[#A58A73] text-[#3E2C22] space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-[#694B36] font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Message Sent Successfully</span>
                </div>
                <p className="text-sm text-[#694B36] leading-relaxed">
                  Thank you for reaching out! Gabriella will review your inquiry and respond promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-xs font-bold uppercase tracking-wider text-[#694B36] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-[#FDF2F0] border border-[#F2C4BE] text-[#8C2E24] text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="user-name" className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                      Your Name *
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36] transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="user-email" className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="user-subject" className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                    Subject / Discussion Topic
                  </label>
                  <input
                    id="user-subject"
                    type="text"
                    placeholder="Junior Business Analyst Opportunity"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="user-message" className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5">
                    Message *
                  </label>
                  <textarea
                    id="user-message"
                    required
                    rows={4}
                    placeholder="Tell me about the role, project, or question..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{status === 'submitting' ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
