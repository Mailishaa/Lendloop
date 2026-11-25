import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard-nav";

export const metadata: Metadata = {
  title: "Dashboard · LendLoop",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <DashboardNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
