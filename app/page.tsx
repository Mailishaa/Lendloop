import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { PublicTools } from "@/components/public-tools";
import { RedirectToDashboard } from "@/components/redirect-to-dashboard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-8">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900">LendLoop</h1>
        <p className="text-lg text-zinc-600">Borrow what you need. Lend what you don&apos;t.</p>
      </div>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700">
            Sign in to lend or borrow
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <RedirectToDashboard />
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-500">You are signed in.</p>
          <Link href="/dashboard" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700">
            Go to dashboard
          </Link>
        </div>
      </Show>
      <PublicTools />
    </main>
  );
}
