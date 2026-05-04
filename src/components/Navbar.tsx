import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-black text-xl hover:opacity-90 transition-opacity">
          Hardflip<span className="text-accent">AI</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/pricing"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Pricing
          </Link>
          {session && (
            <Link
              href="/dashboard"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-text-muted text-sm hidden md:block">
                {session.user.name || session.user.email}
              </span>
              <Link
                href="/goals/new"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
              >
                + New Goal
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
