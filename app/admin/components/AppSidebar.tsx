'use client';

import * as React from "react"
import axios from "axios"; // Axios Import
import {
  LogOut,
  Globe,
  Loader2,
  Plane,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { navMain } from "../helper/utlis";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  
  const [user, setUser] = React.useState<{ name: string; email: string; avatar?: string } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = React.useState(true)

  // 1. Fetch Current User Profile
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoadingUser(true);
        const response = await axios.get('/api/auth/me');
        
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          // যদি রেসপন্স সাকসেস না হয়, ফোর্স লগআউট
          throw new Error("User session invalid");
        }
      } catch (error: any) {
        console.error("Auth Error:", error.response?.data?.message || error.message);
        // ইউজার ইনফো না আসলে বা এরর হলে লগআউট API কল করা হবে
        handleForceLogout();
      } finally {
        setIsLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  // ২. ফোর্স লগআউট ফাংশন (যখন সেশন এরর হবে)
  const handleForceLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } finally {
      // এপিআই কল ফেইল হলেও ক্লায়েন্ট সাইড থেকে এক্সেস পেজে পাঠিয়ে দেবে
      router.push('/access');
      router.refresh();
    }
  }

  // ৩. ম্যানুয়াল লগআউট হ্যান্ডলার (বাটন ক্লিক)
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await axios.post('/api/auth/logout');
      
      if (response.data.success) {
        toast.success("Logged out successfully");
        router.push('/access'); 
        router.refresh(); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed. Please try again.");
      setShowLogoutDialog(false);
    } finally {
      setIsLoggingOut(false)
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-900 text-sidebar-primary-foreground">
                    <Plane className="size-4 text-white" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold">FlyBismillah</span>
                    <span className="truncate text-xs">Admin Panel</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {navMain.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="flex items-center gap-2">
                {group.title === "Content Management" && <Globe className="w-3 h-3" />}
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = item.url === '/admin' 
                      ? pathname === '/admin'
                      : pathname.startsWith(item.url);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                            asChild  
                            isActive={isActive} 
                            tooltip={item.title}
                            className="data-[active=true]:bg-gray-800 data-[active=true]:text-slate-100"
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span className={isActive ? "font-bold" : ""}>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoadingUser ? (
                <div className="flex items-center gap-2 p-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent cursor-pointer data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="rounded-lg bg-slate-100 text-slate-900 font-bold">
                          {user?.name?.charAt(0).toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name || "Admin"}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg shadow-xl"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal ">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user?.avatar} alt={user?.name} />
                          <AvatarFallback className="rounded-lg">
                             {user?.name?.charAt(0).toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{user?.name}</span>
                          <span className="truncate text-xs">{user?.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => setShowLogoutDialog(true)} 
                      className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-medium"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-xl">Sign out from Admin?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to sign out? You'll need to enter your credentials again to manage the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="cursor-pointer rounded-xl border-gray-100" disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                handleLogout();
              }}
              className="bg-rose-600 cursor-pointer hover:bg-rose-700 text-white rounded-xl font-bold"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                "Sign out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}