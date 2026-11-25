import { IncomingLoans } from "@/components/incoming-loans";

export default function DashboardRequestsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Requests</h1>
      <IncomingLoans />
    </div>
  );
}
