import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-cream">
      <NavBar />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">{children}</main>
    </div>
  );
}
