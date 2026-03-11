"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "./sidebar";
import { LoginPage } from "./login-page";
import { ClipboardPrompt } from "./clipboard-prompt";
import { CommandPalette } from "@/components/ui/command-palette";
import { PageLoader } from "@/components/ui/loading";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
      <ClipboardPrompt />
      <CommandPalette />
    </div>
  );
}
