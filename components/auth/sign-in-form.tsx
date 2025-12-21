"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { authClient } from "@/lib/auth-client";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/redirect");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="animate-fade-in-up mb-8 text-center">
        <h1
          className={`${instrumentSerif.className} text-3xl tracking-[-0.02em] text-stone-900 dark:text-stone-100`}
        >
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] text-stone-500 dark:text-stone-400">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up-1 w-full space-y-5"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[13px] font-medium text-stone-600 dark:text-stone-400"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-[13px] font-medium text-stone-600 dark:text-stone-400"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="**********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800"
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-full bg-stone-900 text-[13px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white dark:hover:shadow-stone-100/10"
        >
          {isLoading ? (
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}
