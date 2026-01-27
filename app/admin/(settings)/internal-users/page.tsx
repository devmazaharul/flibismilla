'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, MoreVertical, UserPlus, Filter, 
  Shield, Eye, Trash2, Edit, AlertCircle, 
  Mail, Smartphone, Lock, Loader2, FileEdit, Ban, CheckCircle, 
  X, Check
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
import Link from 'next/link';

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

export default function InternalUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/dashboard/settings/internal-user');
      if (data.success) setUsers(data.users);
    } catch (err: any) {
      toast.error("Failed to fetch team data.");
    } finally {
      setLoading(false);
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
    } catch (error) { toast.error("Could not remove user."); } finally { setIsDeleting(false); }
  };

  // ✅ FIX: Block/Unblock Logic Updated
  const handleBlockAction = async () => {
    if (!userToBlock) return;
    setIsBlocking(true);
    
    // Check current status: if true -> we want to BLOCK. if false -> we want to UNBLOCK.
    const isCurrentlyActive = userToBlock.isVerified;

    try {
      let response;

      if (isCurrentlyActive) {
        // BLOCK ACTION: Use regular Patch with body (Existing logic)
        response = await axios.patch(`/api/dashboard/settings/internal-user/${userToBlock._id}`, {
           isVerified: false 
        });
      } else {
        // UNBLOCK ACTION: Use the specific API endpoint requested
        response = await axios.patch(`/api/dashboard/settings/internal-user/${userToBlock._id}/unblock`);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        // Update local state
        setUsers(users.map(u => u._id === userToBlock._id ? { ...u, isVerified: !isCurrentlyActive } : u));
        setBlockModalOpen(false);
      }
    } catch (error: any) { 
        toast.error(error.response?.data?.message || "Action failed."); 
    } finally { 
        setIsBlocking(false); 
    }
  };

  const handleUpdateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingUser) return;
    setIsUpdating(true);
    try {
      await axios.put(`/api/dashboard/settings/internal-user/${editingUser._id}`, { name: editingUser.name, role: editingUser.role });
      toast.success("Profile updated successfully.");
      setUsers(users.map(u => u._id === editingUser._id ? editingUser : u));
      setEditModalOpen(false);
    } catch (error) { toast.error("Update failed."); } finally { setIsUpdating(false); }
  };

  // Helper
  const openBlockModal = (user: User) => {
      setUserToBlock(user);
      setBlockModalOpen(true);
  }

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <UsersTableSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* ---------------- MODALS ---------------- */}

      {/* 1. Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 gap-0 overflow-hidden rounded-xl">
       
          <div className="flex flex-col items-center justify-center text-center pt-2">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-600 w-6 h-6" />
            </div>
            <DialogHeader className='mb-2'>
                <DialogTitle className="text-lg font-semibold text-gray-900">Delete Team Member</DialogTitle>
                <DialogDescription className="text-gray-500 text-sm mt-1">
                  Are you sure you want to remove this user? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="mt-6">
            <Button variant="destructive" onClick={handleDeleteAction} disabled={isDeleting} className="w-full rounded-lg font-medium cursor-pointer">
                {isDeleting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : "Delete Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Block/Unblock Modal */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 gap-0 rounded-xl">
        

          <div className="flex flex-col items-center justify-center text-center pt-2">
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-4", userToBlock?.isVerified ? "bg-amber-100" : "bg-emerald-100")}>
                {userToBlock?.isVerified ? <Ban className="text-amber-600 w-6 h-6" /> : <CheckCircle className="text-emerald-600 w-6 h-6" />}
            </div>
            <DialogHeader className='mb-2'>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                    {userToBlock?.isVerified ? "Suspend Access?" : "Reactivate Access?"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm mt-1">
                    {userToBlock?.isVerified 
                        ? "User will be immediately logged out and blocked." 
                        : "User will regain access to the dashboard immediately."}
                </DialogDescription>
            </DialogHeader>
          </div>

          <div className="mt-6">
            <Button 
                onClick={handleBlockAction} 
                disabled={isBlocking} 
                className={cn("w-full rounded-lg font-medium cursor-pointer text-white", userToBlock?.isVerified ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700")}
            >
                {isBlocking ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : (userToBlock?.isVerified ? "Confirm Suspension" : "Confirm Reactivation")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-xl">
         
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Permissions</DialogTitle>
            <DialogDescription>Update user details and access level.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateAction} className="space-y-6 mt-4">
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label className='text-xs font-medium text-gray-700'>Full Name</Label>
                    <Input 
                        value={editingUser?.name || ''} 
                        onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)} 
                        className="rounded-lg border-gray-200 focus:ring-gray-900" 
                    />
                </div>

                <div className="space-y-2">
                    <Label className='text-xs font-medium text-gray-700'>Access Level</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {/* ✅ Fixed: Admin removed, only Editor/Viewer available */}
                        {['editor', 'viewer'].map((roleType) => (
                            <div 
                                key={roleType}
                                onClick={() => setEditingUser(prev => prev ? {...prev, role: roleType as any} : null)}
                                className={cn(
                                    "relative cursor-pointer px-4 py-3 rounded-lg border flex items-center gap-3 transition-all",
                                    editingUser?.role === roleType 
                                        ? "border-gray-900 bg-gray-900 text-white shadow-md" 
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                {roleType === 'editor' ? <FileEdit className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium capitalize">{roleType}</span>
                                </div>
                                {editingUser?.role === roleType && <Check className="absolute top-3 right-3 w-3 h-3 text-white" />}
                            </div>
                        ))}
                    </div>
                </div>
             </div>
             <Button type="submit" disabled={isUpdating} className="w-full rounded-lg bg-gray-900 text-white font-medium cursor-pointer hover:bg-black mt-2">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Save Changes"}
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- PAGE CONTENT ---------------- */}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Team Management</h1>
                <p className="text-sm text-gray-500">Control access and roles for your dashboard.</p>
            </div>
            
        </div>
      </div>

      {/* Main Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Search & Filter */}
        <div className="flex items-center justify-between gap-4 mb-6">
           <div className="relative w-full max-w-sm shadow-2xl shadow-gray-100 border border-gray-100 rounded-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9 h-10 bg-white  rounded-lg focus:ring-1 focus:ring-gray-200" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
           </div>
         
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xl shadow-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-6">User Details</th>
                      <th className="py-3 px-6">Role</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Security</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                         
                         {/* Name Column */}
                         <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                               <Avatar className="h-9 w-9 border border-gray-200 bg-gray-100">
                                   <AvatarFallback className="text-gray-500 font-medium text-xs">
                                       {u.name?.slice(0, 2).toUpperCase()}
                                   </AvatarFallback>
                                   <AvatarImage src="" />
                               </Avatar>
                               <div>
                                  <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                               </div>
                            </div>
                         </td>

                         {/* Role Badge */}
                         <td className="py-4 px-6">
                            <div className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", 
                                u.role === 'admin' ? "bg-gray-100 text-gray-800 border-gray-200" : "bg-white text-gray-600 border-gray-200"
                            )}>
                               {u.role === 'admin' && <Shield className="w-3 h-3 mr-1"/>}
                               {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                            </div>
                         </td>

                         {/* Status */}
                         <td className="py-4 px-6">
                            {u.isVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                    <Ban className="w-3 h-3" /> Blocked
                                </span>
                            )}
                         </td>

                         {/* Security */}
                         <td className="py-4 px-6">
                            {u.isTwoFactorEnabled ? (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <Smartphone className="w-3.5 h-3.5 text-emerald-500"/> 
                                    <span className="font-medium">2FA On</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Lock className="w-3.5 h-3.5"/> 2FA Off
                                </div>
                            )}
                         </td>

                         {/* Actions */}
                         <td className="py-4 px-6 text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100 cursor-pointer">
                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-lg border-gray-200 p-1">
                                    <DropdownMenuLabel className="text-xs text-gray-500 px-2 py-1.5 font-normal">Manage User</DropdownMenuLabel>
                                    
                                    <DropdownMenuItem onClick={() => { setEditingUser(u); setEditModalOpen(true); }} className="cursor-pointer text-sm font-medium text-gray-700 rounded-md py-2 focus:bg-gray-50">
                                        <Edit className="w-4 h-4 mr-2 text-gray-500" /> Edit Profile
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                        onClick={() => openBlockModal(u)} 
                                        className="cursor-pointer text-sm font-medium rounded-md py-2 focus:bg-gray-50"
                                    >
                                        {u.isVerified ? (
                                            <> <Ban className="w-4 h-4 mr-2 text-amber-500" /> <span className="text-amber-600">Block Access</span> </>
                                        ) : (
                                            <> <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> <span className="text-emerald-600">Unblock Access</span> </>
                                        )}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                    
                                    <DropdownMenuItem onClick={() => { setUserToDelete(u._id); setDeleteModalOpen(true); }} className="cursor-pointer text-sm font-medium rounded-md py-2 text-red-600 focus:bg-red-50">
                                        <Trash2 className="w-4 h-4 mr-2" /> Remove User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                         </td>
                      </tr>
                   )) : (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                <div className="bg-gray-50 p-3 rounded-full mb-3"><Filter className="w-6 h-6 text-gray-300"/></div>
                                <p className="text-sm font-medium">No team members found</p>
                                <p className="text-xs mt-1 text-gray-400">Try adjusting your search query.</p>
                            </div>
                        </td>
                      </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}

// Minimalist Skeleton
function UsersTableSkeleton() {
  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    </div>
  );
}

// Minimalist Error
function ErrorState({ message }: { message: string }) {
  return <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center text-gray-900"><AlertCircle className="w-10 h-10 text-red-500 mb-3"/><h3 className="font-semibold text-lg">{message}</h3></div>;
}