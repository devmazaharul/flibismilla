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
import { Metadata } from 'next';


export const metadata: Metadata = {
    title: 'Admin Dashboard | FlyBismillah',
    description: 'Travel Agency Management System - Admin Panel',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <head>
        </head>
        <body className="antialiased">
          <SidebarProvider>
            <AppSidebar />

            {/* 2. Main Content Wrapper */}
            <SidebarInset>
              {/* A. Sticky Header with Toggle Button & Breadcrumbs */}
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-white sticky top-0 z-10 px-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1 cursor-pointer" />
                  <Separator orientation="vertical" className="mr-2 h-4" />

                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Overview</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>

              {/* B. Dynamic Page Content */}
              <div className="flex flex-1 flex-col gap-4  pt-0 bg-[#F4F4F5] min-h-[calc(100vh-4rem)]">
                <div className="">{children}</div>
              </div>
            </SidebarInset>
          </SidebarProvider>

          {/* Toast Notification Provider */}
          <Toaster
            position="top-center"
            closeButton
            expand={false}
            duration={3000}
            visibleToasts={5}
            toastOptions={{
              style: {
                maxWidth: "25rem",
                width: "auto",
              },
            }}
          />
        </body>
      </html>
    );
}