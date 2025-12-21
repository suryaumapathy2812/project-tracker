import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default async function Home() {
  // Check if user is authenticated
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    redirect("/redirect");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#faf9f7] dark:bg-[#0a0a0a]">
      {/* Subtle grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative lines */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-32 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-stone-300/50 to-stone-300/20 dark:via-stone-600/30 dark:to-stone-600/10" />
        <div className="absolute bottom-0 left-1/2 h-32 w-px -translate-x-1/2 bg-gradient-to-t from-transparent via-stone-300/50 to-stone-300/20 dark:via-stone-600/30 dark:to-stone-600/10" />
      </div>

      <main className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Eyebrow */}
        <div className="animate-fade-in-up mb-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
          <span className="h-px w-8 bg-stone-300 dark:bg-stone-700" />
          <span>For Teams & Educators</span>
          <span className="h-px w-8 bg-stone-300 dark:bg-stone-700" />
        </div>

        {/* Main title */}
        <h1
          className={`${instrumentSerif.className} animate-fade-in-up-1 text-5xl leading-[1.1] tracking-[-0.02em] text-stone-900 sm:text-6xl md:text-7xl dark:text-stone-100`}
        >
          Project Tracker
        </h1>

        {/* Tagline */}
        <p className="animate-fade-in-up-2 mt-6 max-w-sm text-[17px] leading-relaxed text-stone-500 dark:text-stone-400">
          From features to feedback.<br />
          <span className="text-stone-700 dark:text-stone-300">Track every milestone.</span>
        </p>

        {/* Decorative divider */}
        <div className="animate-fade-in-up-3 my-10 flex items-center gap-4">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-stone-300 dark:to-stone-700" />
          <span className="h-1.5 w-1.5 rotate-45 border border-stone-300 dark:border-stone-700" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-stone-300 dark:to-stone-700" />
        </div>

        {/* CTA */}
        <div className="animate-fade-in-up-4">
          <Link
            href="/login"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-stone-900 px-8 text-[13px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white dark:hover:shadow-stone-100/10"
          >
            Sign In
            <svg
              className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Bottom flourish */}
      <div className="animate-fade-in-up-5 absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-300 dark:text-stone-700">
        Simple · Elegant · Effective
      </div>
    </div>
  );
}
