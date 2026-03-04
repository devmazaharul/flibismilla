'use client';

import * as React from "react"
import axios from "axios"
import {
  LogOut,
  Globe,
  Loader2,
  Plane,
  ChevronsUpDown,
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
  DropdownMenuLabel,
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
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { navMain } from "../helper/utlis"

// ==========================================
// Helpers
// ==========================================
const avatarColors = [
  'from-slate-600 to-slate-800',
  'from-gray-600 to-gray-800',
  'from-zinc-600 to-zinc-800',
  'from-neutral-600 to-neutral-800',
  'from-stone-600 to-stone-800',
];

const getAvatarGradient = (name: string) =>
  avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

const getInitials = (name?: string) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

// ==========================================
// Component
// ==========================================
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar?: string
  } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = React.useState(true)

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoadingUser(true)
        const response = await axios.get('/api/auth/me')
        if (response.data.success && response.data.user) {
          setUser(response.data.user)
        } else {
          throw new Error("User session invalid")
        }
      } catch (error: any) {
        console.error("Auth Error:", error.response?.data?.message || error.message)
        handleForceLogout()
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleForceLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } finally {
      router.push('/access')
      router.refresh()
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await axios.post('/api/auth/logout')
      if (response.data.success) {
        toast.success("Logged out successfully")
        router.push('/access')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed.")
      setShowLogoutDialog(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const initials = getInitials(user?.name)
  const gradient = getAvatarGradient(user?.name || 'A')

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        {/* ════════════════════════════════
            HEADER — Logo
        ════════════════════════════════ */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent active:bg-transparent"
              >
                <Link href="/admin" className="group/logo group-data-[collapsible=icon]:justify-center">
                  <div className="relative flex aspect-square size-9 items-center justify-center shrink-0 rounded-lg bg-gray-900 shadow-md shadow-gray-900/20 transition-all duration-300 group-hover/logo:scale-105 group-hover/logo:shadow-lg">
                    <Plane className="size-4 text-white transition-transform duration-300 group-hover/logo:-rotate-6" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-extrabold tracking-tight text-sidebar-foreground">
                      FlyBismillah
                    </span>
                    <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                      Admin Panel
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ════════════════════════════════
            CONTENT — Navigation
        ════════════════════════════════ */}
        <SidebarContent className="px-1 py-2">
          {navMain.map((group) => (
            <SidebarGroup key={group.title} className="mb-1">
              <SidebarGroupLabel className="flex items-center gap-1.5 px-3 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden">
                {group.title === "Content Management" && (
                  <Globe className="w-3 h-3" />
                )}
                {group.title}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.url === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.url)

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="p-0 h-auto w-full outline-none hover:bg-transparent"
                        >
                          <Link
                            href={item.url}
                            className={`
                              group/nav relative flex w-full items-center gap-3 rounded-xl py-2.5 px-3
                              transition-all duration-300 ease-in-out
                              group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center
                              ${isActive
                                ? '!bg-gray-800 !text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:!bg-gray-200'
                              }
                            `}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gray-400 shadow-[2px_0_8px_rgba(156,163,175,0.6)]" />
                            )}
                            <div
                              className={`
                                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300
                                ${isActive
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-100 text-gray-400 group-hover/nav:bg-white group-hover/nav:text-gray-900 group-hover/nav:shadow-sm'
                                }
                              `}
                            >
                              <item.icon className={`size-4 ${isActive ? 'animate-pulse' : ''}`} />
                            </div>
                            <span
                              className={`
                                text-[13px] tracking-wide truncate transition-all duration-200 group-data-[collapsible=icon]:hidden
                                ${isActive ? 'font-bold' : 'font-medium group-hover/nav:translate-x-0.5'}
                              `}
                            >
                              {item.title}
                            </span>
                            {isActive && (
                              <div className="ml-auto flex items-center group-data-[collapsible=icon]:hidden">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              </div>
                            )}
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

        {/* ════════════════════════════════
            FOOTER — User
        ════════════════════════════════ */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoadingUser ? (
                <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/30 p-2.5 mx-0.5 group-data-[collapsible=icon]:justify-center">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-2.5 w-28 rounded" />
                  </div>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="group/user cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <Avatar className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-sidebar-border/20 transition-transform duration-200 group-hover/user:scale-105">
                        <AvatarImage src={user?.avatar} alt={user?.name} className="rounded-lg" />
                        <AvatarFallback className={`rounded-lg bg-gradient-to-br ${gradient} text-white text-[11px] font-bold`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-sidebar-foreground">
                          {user?.name || "Admin"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-xl shadow-gray-200/40"
                    side="bottom"
                    align="end"
                    sideOffset={6}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-3">
                        <Avatar className="h-9 w-9 rounded-lg ring-1 ring-gray-200">
                          <AvatarImage src={user?.avatar} alt={user?.name} className="rounded-lg" />
                          <AvatarFallback className={`rounded-lg bg-gradient-to-br ${gradient} text-white text-xs font-bold`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left leading-tight min-w-0">
                          <span className="truncate text-sm font-bold text-gray-900">{user?.name}</span>
                          <span className="truncate text-[11px] text-gray-500">{user?.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1.5 bg-gray-100" />
                    <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="cursor-pointer rounded-lg px-3 py-2 font-medium text-rose-600 transition-colors focus:bg-rose-50 focus:text-rose-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="text-[13px]">Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* ════════════════════════════════
          Logout Dialog — Blurred Backdrop
      ════════════════════════════════ */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <AlertDialogContent className="max-w-[340px] rounded-2xl border-0 p-0 shadow-2xl shadow-black/20 overflow-hidden gap-0 animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Top Section */}
          <div className="relative bg-gradient-to-b from-gray-50 to-white px-6 pt-7 pb-5">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
            <div className="absolute top-4 right-8 w-8 h-8 bg-rose-100 rounded-full opacity-40" />

            <div className="relative">
              {/* Icon */}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 shadow-sm ring-1 ring-rose-200/60">
                <LogOut className="h-5 w-5 text-rose-500" />
              </div>

              <AlertDialogHeader className="mt-4 space-y-1 text-left">
                <AlertDialogTitle className="text-[17px] font-extrabold tracking-tight text-gray-900">
                  Sign out?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[12.5px] leading-relaxed text-gray-400">
                  You&apos;ll be signed out and will need to enter your credentials again to access the dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>

          {/* Bottom Section — Buttons */}
          <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100">
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel
                className="cursor-pointer flex-1 h-9 rounded-lg border-gray-200 bg-white text-[12.5px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all shadow-sm"
                disabled={isLoggingOut}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleLogout(); }}
                className="cursor-pointer flex-1 h-9 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-[12.5px] font-bold text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-rose-700 transition-all duration-200 active:scale-[0.97] border-0"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Signing out…
                  </span>
                ) : (
                  "Sign out"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}