"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import NotificationToast from "@/components/admin/NotificationToast";
import CommandPalette from "@/components/admin/CommandPalette";
import { useAdminUIStore } from "@/store/admin-ui-store";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen } = useAdminUIStore();

  return (
    <div className="flex bg-black min-h-screen font-sans text-white bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-fixed relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Wrapper */}
      <div
        className={cn(
          "flex-1 flex flex-col relative z-10 transition-all duration-300",
          isSidebarOpen ? "md:pl-64" : "md:pl-20",
        )}
      >
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 booking-scrollbar">
          {children}
        </main>
      </div>

      {/* Global Components */}
      <NotificationToast />
      <CommandPalette />
    </div>
  );
}
