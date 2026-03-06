// app/admin/profile/page.tsx

'use client';

import * as React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  KeyRound,
  Monitor,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Eye,
  EyeOff,
  ChevronRight,
  LogIn,
  History,
  Zap,
  Star,
  Crown,
  BadgeCheck,
  ShieldCheck,
  Lock,
  Unlock,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Bell,
  Palette,
  Info,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import Link from 'next/link';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface IPermissions {
  dashboard: string;
  products: string;
  orders: string;
  customers: string;
  staff: string;
  settings: string;
  reports: string;
}

interface IProfile {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  adminId: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'blocked' | 'suspended';
  isVerified: boolean;
  permissions: IPermissions;
  isTwoFactorEnabled: boolean;
  isOnline: boolean;
  lastLogin: string;
  lastActive: string;
  createdBy: { name: string; email: string; adminId: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ICurrentSession {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActive: string;
}

interface IRecentActivity {
  _id: string;
  action: string;
  actionLabel: string;
  details: string;
  createdAt: string;
  timeAgo: string;
  admin: { name: string; email: string } | null;
}

interface IProfileStats {
  totalActiveSessions: number;
  totalLoginHistory: number;
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function getInitials(name?: string): string {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}

function getTimeSince(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType; description: string }
> = {
  admin: {
    label: 'Administrator',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Crown,
    description: 'Full system access & control',
  },
  editor: {
    label: 'Editor',
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200',
    icon: Edit3,
    description: 'Can edit content & manage orders',
  },
  viewer: {
    label: 'Viewer',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: Eye,
    description: 'Read-only access to dashboard',
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  blocked: { label: 'Blocked', color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  suspended: { label: 'Suspended', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
};

const PERMISSION_LEVELS: Record<string, { label: string; color: string }> = {
  full: { label: 'Full Access', color: 'text-emerald-700 bg-emerald-50' },
  edit: { label: 'Edit', color: 'text-blue-700 bg-blue-50' },
  view: { label: 'View Only', color: 'text-amber-700 bg-amber-50' },
  none: { label: 'No Access', color: 'text-gray-400 bg-gray-50' },
};

const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
];

function getAvatarGradient(name: string): string {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

// ═══════════════════════════════════════
// INFO ROW COMPONENT
// ═══════════════════════════════════════

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  badge,
  action,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  badge?: { text: string; color: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 px-1 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p
            className={clsx(
              'text-[14px] text-gray-800 truncate mt-0.5',
              mono ? 'font-mono font-semibold text-[13px]' : 'font-semibold'
            )}
          >
            {value}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span
            className={clsx(
              'px-2 py-0.5 rounded-md text-[10px] font-bold border',
              badge.color
            )}
          >
            {badge.text}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EDIT PROFILE MODAL/INLINE
// ═══════════════════════════════════════

function EditProfileForm({
  profile,
  onSave,
  onCancel,
  isSaving,
}: {
  profile: IProfile;
  onSave: (data: { name: string; phone: string; avatar: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone || '');
  const [avatar, setAvatar] = React.useState(profile.avatar || '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (phone && !/^[+]?[\d\s\-()]{7,20}$/.test(phone.trim())) {
      newErrors.phone = 'Invalid phone format';
    }
    if (avatar && avatar.trim()) {
      try {
        new URL(avatar.trim());
      } catch {
        newErrors.avatar = 'Invalid URL format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ name: name.trim(), phone: phone.trim(), avatar: avatar.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3 h-3" />
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={clsx(
            'w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-[15px] text-gray-900 font-medium transition-all',
            'focus:bg-white focus:border-blue-300 focus:outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]',
            errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-gray-100'
          )}
          placeholder="Enter your name"
        />
        {errors.name && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3 h-3" />
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={clsx(
            'w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-[15px] text-gray-900 font-medium transition-all',
            'focus:bg-white focus:border-blue-300 focus:outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]',
            errors.phone ? 'border-rose-300 bg-rose-50/30' : 'border-gray-100'
          )}
          placeholder="+880 1712 345678"
        />
        {errors.phone && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Avatar URL */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-3 h-3" />
          Avatar URL
        </label>
        <input
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className={clsx(
            'w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-[15px] text-gray-900 font-medium transition-all',
            'focus:bg-white focus:border-blue-300 focus:outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]',
            errors.avatar ? 'border-rose-300 bg-rose-50/30' : 'border-gray-100'
          )}
          placeholder="https://example.com/avatar.jpg"
        />
        {errors.avatar && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.avatar}
          </p>
        )}
        {avatar && !errors.avatar && (
          <div className="flex items-center gap-2 mt-2">
            <img
              src={avatar}
              alt="Preview"
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-[11px] text-gray-400">Preview</span>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-blue-700/70 leading-relaxed">
          Email and role can only be changed by an administrator. Contact your admin for changes.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all',
            'cursor-pointer disabled:cursor-not-allowed',
            isSaving
              ? 'bg-gray-100 text-gray-400'
              : 'bg-gray-900 text-white shadow-lg shadow-gray-900/15 hover:shadow-xl active:scale-[0.98]'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-5 py-3 rounded-xl text-[14px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════
// QUICK ACTION CARD
// ═══════════════════════════════════════

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  color,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 p-4 rounded-xl bg-white border border-gray-100 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div
        className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
          {title}
          {badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
              {badge}
            </span>
          )}
        </p>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
          {description}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = React.useState<IProfile | null>(null);
  const [currentSession, setCurrentSession] = React.useState<ICurrentSession | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<IRecentActivity[]>([]);
  const [profileStats, setProfileStats] = React.useState<IProfileStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // ── Fetch Profile ──
  const fetchProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/auth/profile', {
        withCredentials: true,
      });

      if (response.data.success && response.data.data) {
        setProfile(response.data.data.profile);
        setCurrentSession(response.data.data.currentSession || null);
        setRecentActivity(response.data.data.recentActivity || []);
        setProfileStats(response.data.data.stats || null);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push('/access');
          return;
        }
        toast.error(error.response?.data?.message || 'Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Update Profile ──
  const handleSaveProfile = async (data: {
    name: string;
    phone: string;
    avatar: string;
  }) => {
    setIsSaving(true);
    try {
      const response = await axios.put('/api/auth/profile/update', data, {
        withCredentials: true,
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!', { icon: '✨' });
        setProfile(response.data.data.profile);
        setIsEditing(false);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Copy to clipboard ──
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
              <div className="space-y-3 flex-1">
                <div className="w-48 h-6 bg-gray-200 rounded-lg" />
                <div className="w-64 h-4 bg-gray-100 rounded-lg" />
                <div className="flex gap-2">
                  <div className="w-20 h-6 bg-gray-100 rounded-md" />
                  <div className="w-16 h-6 bg-gray-100 rounded-md" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                  <div className="w-32 h-4 bg-gray-100 rounded-lg mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                        <div className="flex-1 space-y-1.5">
                          <div className="w-16 h-3 bg-gray-50 rounded" />
                          <div className="w-40 h-4 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="w-24 h-3 bg-gray-100 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="w-full h-12 bg-gray-50 rounded-xl" />
                    <div className="w-full h-12 bg-gray-50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const roleConfig = ROLE_CONFIG[profile.role] || ROLE_CONFIG.viewer;
  const statusConfig = STATUS_CONFIG[profile.status] || STATUS_CONFIG.active;
  const gradient = getAvatarGradient(profile.name);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ═══════════════════════════════
            PROFILE HEADER CARD
        ═══════════════════════════════ */}
        <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 shadow-2xl shadow-gray-100">
          {/* Background pattern */}
          <div className="absolute inset-0 h-36 bg-gradient-to-br from-gray-50 via-blue-50/30 to-violet-50/20" />
          <div
            className="absolute inset-0 h-36 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative px-6 sm:px-8 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Avatar */}
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-white rounded-[22px] shadow-lg" />
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-xl"
                  />
                ) : (
                  <div
                    className={clsx(
                      'relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br flex items-center justify-center ring-4 ring-white shadow-xl',
                      gradient
                    )}
                  >
                    <span className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-2xl shadow-gray-100">
                      {getInitials(profile.name)}
                    </span>
                  </div>
                )}

                {/* Online indicator */}
                {profile.isOnline && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 ring-3 ring-white items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full" />
                    </span>
                  </span>
                )}

                {/* Edit avatar overlay */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white drop-shadow-lg" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                      {profile.name}
                      {profile.isVerified && (
                        <BadgeCheck className="w-6 h-6 text-blue-500 shrink-0" />
                      )}
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">
                      {profile.email}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {/* Role badge */}
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                          roleConfig.bg,
                          roleConfig.color
                        )}
                      >
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleConfig.label}
                      </span>

                      {/* Status badge */}
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                          statusConfig.color
                        )}
                      >
                        <span className={clsx('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                        {statusConfig.label}
                      </span>

                      {/* 2FA badge */}
                      {profile.isTwoFactorEnabled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <ShieldCheck className="w-3 h-3" />
                          2FA On
                        </span>
                      )}

                      {/* Online badge */}
                      {profile.isOnline && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <Zap className="w-3 h-3" />
                          Online
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit button */}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-bold shadow-lg shadow-gray-900/15 hover:shadow-xl active:scale-[0.97] transition-all cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════
            MAIN GRID
        ═══════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form OR Personal Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {isEditing ? 'Edit Profile' : 'Personal Information'}
                </h2>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <EditProfileForm
                  profile={profile}
                  onSave={handleSaveProfile}
                  onCancel={() => setIsEditing(false)}
                  isSaving={isSaving}
                />
              ) : (
                <div className="divide-y divide-gray-50">
                  <InfoRow
                    icon={User}
                    label="Full Name"
                    value={profile.name}
                  />
                  <InfoRow
                    icon={Mail}
                    label="Email Address"
                    value={profile.email}
                    action={
                      <button
                        onClick={() => copyToClipboard(profile.email, 'email')}
                        className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    }
                  />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={profile.phone || 'Not set'}
                  />
                  <InfoRow
                    icon={Fingerprint}
                    label="Admin ID"
                    value={profile.adminId}
                    mono
                    action={
                      <button
                        onClick={() => copyToClipboard(profile.adminId, 'adminId')}
                        className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        {copiedField === 'adminId' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Member Since"
                    value={format(new Date(profile.createdAt), 'PPP')}
                  />
                  {profile.createdBy && (
                    <InfoRow
                      icon={Star}
                      label="Added By"
                      value={profile.createdBy.name}
                      badge={{
                        text: profile.createdBy.adminId,
                        color: 'bg-gray-50 text-gray-500 border-gray-200',
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xl shadow-gray-100">
              <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2 mb-5">
                <Shield className="w-4 h-4 text-gray-400" />
                Permissions
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {Object.entries(profile.permissions).map(([key, value]) => {
                  const level = PERMISSION_LEVELS[value] || PERMISSION_LEVELS.none;
                  return (
                    <div
                      key={key}
                      className="group p-3 rounded-xl bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-2xl shadow-gray-100 transition-all"
                    >
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        {key}
                      </p>
                      <span
                        className={clsx(
                          'inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold',
                          level.color
                        )}
                      >
                        {level.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Role description */}
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/50">
                <p className="text-[12px] text-blue-700/70 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    As a <span className="font-bold">{roleConfig.label}</span>, you have{' '}
                    {roleConfig.description.toLowerCase()}.
                    {profile.role !== 'admin' &&
                      ' Contact your admin to request permission changes.'}
                  </span>
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xl shadow-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Recent Activity
                  </h2>
                  <Link
                    href="/admin/activity-log"
                    className="text-[12px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div
                      key={activity._id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0 group-hover:bg-blue-400 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">
                          {activity.actionLabel || activity.action.replace(/_/g, ' ')}
                        </p>
                        {activity.details && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {activity.details}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0">
                        {activity.timeAgo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Quick Actions
              </h3>

              <QuickActionCard
                icon={KeyRound}
                title="Change Password"
                description="Update your password"
                href="/admin/change-password"
                color="bg-violet-50 text-violet-600"
              />
              <QuickActionCard
                icon={Monitor}
                title="Active Sessions"
                description="Manage your devices"
                href="/admin/sessions"
                color="bg-blue-50 text-blue-600"
                badge={
                  profileStats && profileStats.totalActiveSessions > 1
                    ? `${profileStats.totalActiveSessions}`
                    : undefined
                }
              />
              <QuickActionCard
                icon={Shield}
                title="Two-Factor Auth"
                description={
                  profile.isTwoFactorEnabled
                    ? '2FA is enabled'
                    : 'Set up 2FA for extra security'
                }
                href="/admin/security"
                color={
                  profile.isTwoFactorEnabled
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }
              />
              <QuickActionCard
                icon={Activity}
                title="Activity Log"
                description="View your activity history"
                href="/admin/activity-log"
                color="bg-gray-100 text-gray-600"
              />
            </div>

            {/* Current Session */}
            {currentSession && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xl shadow-gray-100">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Current Session
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[12px] font-semibold text-emerald-700">
                      Active now
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <Monitor className="w-3.5 h-3.5 text-gray-300" />
                      <span className="font-medium">{currentSession.device}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <Globe className="w-3.5 h-3.5 text-gray-300" />
                      <span className="font-medium">{currentSession.browser}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-300" />
                      <span>{currentSession.ip} · {currentSession.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-gray-300" />
                      <span>
                        Logged in {getTimeSince(currentSession.loginTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xl shadow-gray-100">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Security Status
              </h3>

              <div className="space-y-2.5">
                {/* Password */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">
                        Password
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Last changed {getTimeSince(profile.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        profile.isTwoFactorEnabled
                          ? 'bg-emerald-50'
                          : 'bg-amber-50'
                      )}
                    >
                      <Fingerprint
                        className={clsx(
                          'w-4 h-4',
                          profile.isTwoFactorEnabled
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">
                        Two-Factor Auth
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {profile.isTwoFactorEnabled
                          ? 'Enabled & active'
                          : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  {profile.isTwoFactorEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                {/* Email verified */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">
                        Email Verified
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  {profile.isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>

                {/* Active sessions */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">
                        Active Sessions
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {profileStats?.totalActiveSessions || 1} device
                        {(profileStats?.totalActiveSessions || 1) !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>
                  </div>
                  {(profileStats?.totalActiveSessions || 1) > 3 ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Security score */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-400">
                    Security Score
                  </span>
                  <span className="text-[13px] font-extrabold text-gray-900">
                    {(() => {
                      let score = 50; // base
                      if (profile.isVerified) score += 15;
                      if (profile.isTwoFactorEnabled) score += 25;
                      if ((profileStats?.totalActiveSessions || 1) <= 3) score += 10;
                      return `${Math.min(score, 100)}%`;
                    })()}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-1000',
                      (() => {
                        let score = 50;
                        if (profile.isVerified) score += 15;
                        if (profile.isTwoFactorEnabled) score += 25;
                        if ((profileStats?.totalActiveSessions || 1) <= 3)
                          score += 10;
                        score = Math.min(score, 100);
                        if (score >= 80)
                          return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
                        if (score >= 60)
                          return 'bg-gradient-to-r from-blue-400 to-blue-500';
                        return 'bg-gradient-to-r from-amber-400 to-amber-500';
                      })()
                    )}
                    style={{
                      width: `${Math.min(
                        50 +
                          (profile.isVerified ? 15 : 0) +
                          (profile.isTwoFactorEnabled ? 25 : 0) +
                          ((profileStats?.totalActiveSessions || 1) <= 3
                            ? 10
                            : 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
                {!profile.isTwoFactorEnabled && (
                  <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Enable 2FA to improve your security score
                  </p>
                )}
              </div>
            </div>

            {/* Account Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xl shadow-gray-100">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Account Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700">
                      Account Created
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(profile.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700">
                      Last Login
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {getTimeSince(profile.lastLogin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700">
                      Profile Updated
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {getTimeSince(profile.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700">
                      Last Active
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {getTimeSince(profile.lastActive)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}