import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <UserButton />
      </header>

      <p className="text-zinc-500 dark:text-zinc-400">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}. Your sessions and
        progress will live here.
      </p>

      <Link
        href="/chat"
        className="inline-flex w-fit rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-secondary-hover"
      >
        Start a conversation →
      </Link>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
        Your recent conversations and progress will show up here as you practice.
      </div>
    </main>
  );
}
