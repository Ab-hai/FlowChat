import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          FlowChat
        </h1>
        <p className="max-w-md text-lg text-zinc-500 dark:text-zinc-400">
          Practice spoken English with an AI partner. Get real, personal
          feedback after every conversation.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {userId ? (
          <Link
            href="/dashboard"
            className="rounded-full bg-secondary px-6 py-3 font-medium text-white transition-colors hover:bg-secondary-hover"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/sign-up"
              className="rounded-full bg-secondary px-6 py-3 font-medium text-white transition-colors hover:bg-secondary-hover"
            >
              Get started
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-zinc-300 px-6 py-3 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
