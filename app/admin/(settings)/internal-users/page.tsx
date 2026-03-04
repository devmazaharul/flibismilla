'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, MoreVertical, Filter,
  Shield, Eye, Trash2, Edit, AlertCircle,
  Smartphone, Lock, Loader2, FileEdit, Ban, CheckCircle,
  Check, Users, UserCheck, UserX, ShieldCheck,
  ChevronDown, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastLogin?: string;
  createdAt: string;
  isTwoFactorEnabled: boolean;
  isVerified: boolean;
}

// --- Gradient Avatar Colors ---
const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
];

function getGradient(name: string) {
  const index = name?.charCodeAt(0) % avatarGradients.length || 0;
  return avatarGradients[index];
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeAgo(dateStr: string) {
  if (!dateStr) return 'Never';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ====================================================
// MAIN COMPONENT
// ====================================================
export default function InternalUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'editor' | 'viewer'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- API Functions ---
  const fetchUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const { data } = await axios.get('/api/dashboard/settings/internal-user');
      if (data.success) setUsers(data.users);
    } catch {
      toast.error("Failed to fetch team data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeleteAction = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/dashboard/settings/internal-user/${userToDelete}`);
      toast.success("Team member removed.");
      setUsers(users.filter(u => u._id !== userToDelete));
      setDeleteModalOpen(false);
    } catch { toast.error("Could not remove user."); }
    finally { setIsDeleting(false); }
  };

  const handleBlockAction = async () => {
    if (!userToBlock) return;
    setIsBlocking(true);
    const isCurrentlyActive = userToBlock.isVerified;

    try {
      let response;
      if (isCurrentlyActive) {
        response = await axios.patch(`/api/dashboard/settings/internal-user/${userToBlock._id}`, { isVerified: false });
      } else {
        response = await axios.patch(`/api/dashboard/settings/internal-user/${userToBlock._id}/unblock`);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setUsers(users.map(u => u._id === userToBlock._id ? { ...u, isVerified: !isCurrentlyActive } : u));
        setBlockModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Action failed.");
    } finally { setIsBlocking(false); }
  };

  const handleUpdateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await axios.put(`/api/dashboard/settings/internal-user/${editingUser._id}`, { name: editingUser.name, role: editingUser.role });
      toast.success("Profile updated successfully.");
      setUsers(users.map(u => u._id === editingUser._id ? editingUser : u));
      setEditModalOpen(false);
    } catch { toast.error("Update failed."); }
    finally { setIsUpdating(false); }
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isVerified).length;
  const blockedUsers = users.filter(u => !u.isVerified).length;
  const twoFAUsers = users.filter(u => u.isTwoFactorEnabled).length;

  // Filters
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || u.role === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <PremiumSkeleton />;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">

      {/* ==================== MODALS ==================== */}

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="bg-gradient-to-b from-red-50 to-white px-6 pt-8 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center rotate-3">
                  <Trash2 className="text-red-600 w-7 h-7" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-bold text-gray-900">Remove Team Member</DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
                  This person will lose all access immediately. This action is permanent.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1 rounded-xl h-11 font-medium border-gray-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAction}
              disabled={isDeleting}
              className="flex-1 rounded-xl h-11 font-medium bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              {isDeleting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {isDeleting ? "Removing..." : "Yes, Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Modal */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className={cn(
            "bg-gradient-to-b to-white px-6 pt-8 pb-6",
            userToBlock?.isVerified ? "from-amber-50" : "from-emerald-50"
          )}>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center -rotate-3",
                  userToBlock?.isVerified ? "bg-amber-100" : "bg-emerald-100"
                )}>
                  {userToBlock?.isVerified
                    ? <Ban className="text-amber-600 w-7 h-7" />
                    : <CheckCircle className="text-emerald-600 w-7 h-7" />
                  }
                </div>
              </div>

              {/* User Preview */}
              {userToBlock && (
                <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4 shadow-2xl shadow-gray-100">
                  <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold", getGradient(userToBlock.name))}>
                    {userToBlock.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{userToBlock.name}</p>
                    <p className="text-xs text-gray-400">{userToBlock.email}</p>
                  </div>
                </div>
              )}

              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {userToBlock?.isVerified ? "Suspend Access?" : "Restore Access?"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
                  {userToBlock?.isVerified
                    ? "This user will be logged out and blocked from the dashboard."
                    : "This user will immediately regain full dashboard access."}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <Button variant="outline" onClick={() => setBlockModalOpen(false)} className="flex-1 rounded-xl h-11 font-medium border-gray-200 cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleBlockAction}
              disabled={isBlocking}
              className={cn(
                "flex-1 rounded-xl h-11 font-medium text-white cursor-pointer",
                userToBlock?.isVerified
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isBlocking ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {isBlocking ? "Processing..." : userToBlock?.isVerified ? "Suspend" : "Restore"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="bg-gradient-to-b from-gray-50 to-white px-6 pt-8 pb-4">
            <div className="flex items-center gap-4 mb-6">
              {editingUser && (
                <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-lg font-bold shadow-lg", getGradient(editingUser.name))}>
                  {editingUser.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-xl font-bold text-gray-900">Edit Member</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Update details and access level
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <form onSubmit={handleUpdateAction} className="px-6 pb-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</Label>
              <Input
                value={editingUser?.name || ''}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="rounded-xl h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-gray-900/10 transition-all"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Level</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'editor', icon: FileEdit, label: 'Editor', desc: 'Can edit content' },
                  { key: 'viewer', icon: Eye, label: 'Viewer', desc: 'Read-only access' },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <div
                    key={key}
                    onClick={() => setEditingUser(prev => prev ? { ...prev, role: key as any } : null)}
                    className={cn(
                      "relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200",
                      editingUser?.role === key
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                        : "border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:shadow-2xl shadow-gray-100"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 mb-2", editingUser?.role === key ? "text-gray-300" : "text-gray-400")} />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className={cn("text-[11px] mt-0.5", editingUser?.role === key ? "text-gray-400" : "text-gray-400")}>{desc}</p>
                    {editingUser?.role === key && (
                      <div className="absolute top-3 right-3 h-5 w-5 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-900" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 rounded-xl h-11 font-medium border-gray-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 rounded-xl h-11 bg-gray-900 text-white font-medium cursor-pointer hover:bg-black transition-colors"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== PAGE CONTENT ==================== */}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team</h1>
                  <p className="text-sm text-gray-500">Manage members and permissions</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="rounded-lg h-9 text-xs font-medium border-gray-200 cursor-pointer gap-2 hover:bg-gray-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: totalUsers, icon: Users, color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
            { label: 'Active', value: activeUsers, icon: UserCheck, color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
            { label: 'Blocked', value: blockedUsers, icon: UserX, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
            { label: '2FA Enabled', value: twoFAUsers, icon: ShieldCheck, color: 'bg-violet-500', bgColor: 'bg-violet-50', textColor: 'text-violet-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("w-5 h-5", stat.textColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search members..."
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 shadow-2xl shadow-gray-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'admin', 'editor', 'viewer'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer capitalize",
                  activeFilter === filter
                    ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                {filter === 'all' ? 'All Roles' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Member</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Security</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {filteredUsers.length > 0 ? filteredUsers.map((u, i) => (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Member */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative">
                            <div className={cn(
                              "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-2xl shadow-gray-100",
                              getGradient(u.name)
                            )}>
                              {u.name?.slice(0, 2).toUpperCase()}
                            </div>
                            {/* Online dot */}
                            {u.isVerified && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm group-hover:text-gray-700 transition-colors">
                              {u.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                          u.role === 'admin'
                            ? "bg-gray-900 text-white"
                            : u.role === 'editor'
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                        )}>
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role === 'editor' && <FileEdit className="w-3 h-3" />}
                          {u.role === 'viewer' && <Eye className="w-3 h-3" />}
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {u.isVerified ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-700">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            <span className="text-xs font-semibold text-red-600">Blocked</span>
                          </div>
                        )}
                      </td>

                      {/* Security */}
                      <td className="py-4 px-6">
                        {u.isTwoFactorEnabled ? (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-100">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            2FA
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-gray-400 text-xs">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="font-medium">None</span>
                          </div>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="py-4 px-6">
                        <p className="text-xs text-gray-500 font-medium">{formatDate(u.createdAt)}</p>
                        {u.lastLogin && (
                          <p className="text-[11px] text-gray-400 mt-0.5">Last seen: {getTimeAgo(u.lastLogin)}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg  hover:bg-gray-100 cursor-pointer transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-gray-100 p-1.5">
                            <DropdownMenuLabel className="text-[11px] text-gray-400 uppercase tracking-wider px-2 py-1.5 font-semibold">
                              Manage
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => { setEditingUser(u); setEditModalOpen(true); }}
                              className="cursor-pointer text-sm font-medium text-gray-700 rounded-lg py-2.5 px-3 focus:bg-gray-50 gap-3"
                            >
                              <Edit className="w-4 h-4 text-gray-400" />
                              Edit Profile
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => { setUserToBlock(u); setBlockModalOpen(true); }}
                              className="cursor-pointer text-sm font-medium rounded-lg py-2.5 px-3 focus:bg-gray-50 gap-3"
                            >
                              {u.isVerified ? (
                                <>
                                  <Ban className="w-4 h-4 text-amber-500" />
                                  <span className="text-amber-600">Suspend</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  <span className="text-emerald-600">Restore</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-gray-100" />

                            <DropdownMenuItem
                              onClick={() => { setUserToDelete(u._id); setDeleteModalOpen(true); }}
                              className="cursor-pointer text-sm font-medium rounded-lg py-2.5 px-3 text-red-600 focus:bg-red-50 gap-3"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <Users className="w-7 h-7 text-gray-300" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">No members found</p>
                          <p className="text-xs text-gray-400 mt-1.5 max-w-[200px]">
                            Try changing your search or filter criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">
                Showing <span className="text-gray-700 font-semibold">{filteredUsers.length}</span> of{' '}
                <span className="text-gray-700 font-semibold">{totalUsers}</span> members
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================
// PREMIUM SKELETON
// ====================================================
function PremiumSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-8 w-12 rounded-md" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Search Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex gap-16">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-16 rounded" />
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-50 flex items-center gap-16">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-6 w-12 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}