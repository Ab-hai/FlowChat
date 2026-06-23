import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  // Route is protected by proxy.ts, so a user is guaranteed here.
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

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
        This is a placeholder. The real dashboard (session history, fluency
        trends, feedback) gets built on a later day. For now it confirms the
        route is protected and Clerk auth works end to end.
      </div>
    </main>
  );
}
