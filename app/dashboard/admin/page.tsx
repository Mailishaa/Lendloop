import { AdminUsers } from "@/components/admin-users";

export default function DashboardAdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Admin</h1>
      <AdminUsers />
    </div>
  );
}
