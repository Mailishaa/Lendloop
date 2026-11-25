import { MyLoans } from "@/components/my-loans";

export default function DashboardLoansPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">My Loans</h1>
      <MyLoans />
    </div>
  );
}
