import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppSidebar } from './components/AppSidebar';
import '@/app/(main)/globals.css';
import { Toaster } from 'sonner';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard | FlyBismillah',
    description: 'Travel Agency Management System - Admin Panel',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head />
            <body className="antialiased bg-[#f8f9fb] text-slate-900 selection:bg-blue-100 selection:text-blue-700">
                <SidebarProvider>
                    <AppSidebar />

                    <SidebarInset>
                        {/* ═══════════════════════════════════
                            STICKY HEADER
                        ═══════════════════════════════════ */}
                        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-3 w-full">
                                {/* Sidebar Toggle */}
                                <SidebarTrigger className="-ml-1 cursor-pointer h-8 w-8 rounded-lg border border-slate-200/60 bg-white text-slate-500 shadow-2xl shadow-gray-100 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-200 active:scale-95" />

                                <Separator orientation="vertical" className="h-4 bg-slate-200/80" />

                                {/* Breadcrumbs */}
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink
                                                href="/admin"
                                                className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                                            >
                                                Dashboard
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block text-slate-300" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage className="text-[13px] font-semibold text-slate-900">
                                                Overview
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>

                                {/* Right side — subtle live indicator */}
                                <div className="ml-auto hidden sm:flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200/50">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                            Live
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* ═══════════════════════════════════
                            MAIN CONTENT AREA
                        ═══════════════════════════════════ */}
                        <div className="flex flex-1 flex-col min-h-[calc(100vh-3.5rem)] bg-[#f8f9fb]">
                            {/* Subtle top-of-content gradient line */}
                            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                            {/* Page Content */}
                            <div className="flex-1">{children}</div>

                            {/* Footer */}
                            <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm px-4 md:px-6 py-3">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                                    <p>
                                        © {new Date().getFullYear()}{' '}
                                        <span className="font-semibold text-slate-500">
                                            FlyBismillah
                                        </span>
                                        . Admin Dashboard
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                            All systems operational
                                        </span>
                                    </div>
                                </div>
                            </footer>
                        </div>
                    </SidebarInset>
                </SidebarProvider>

                {/* Toast */}
                <Toaster
                    position="top-center"
                    closeButton
                    expand={false}
                    duration={3000}
                    visibleToasts={5}
                    toastOptions={{
                        style: {
                            maxWidth: '25rem',
                            width: 'auto',
                        },
                    }}
                />
            </body>
        </html>
    );
}