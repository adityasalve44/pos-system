"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ChefHat, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/tables");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-slate-100 to-slate-100 p-4">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-card ">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center mb-3 shadow-card">
                <ChefHat size={24} className="text-white" />
              </div>
              {/*<h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                Restaurant POS
              </h1>
              */}
              <p className="text-slate-400 text-base">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@demo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="rounded-xl pt-1">
                <button
                  type="submit"
                  disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-sky-500/20 mt-1"
                >
                  {loading ? (
                    <>
                    <Loader2 size={15} className="animate-spin" /> Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Demo hint */}
          <p className="text-center text-xs text-slate-600 mt-6 font-mono">
              admin@demo.com · admin123
            </p>
        </div>
      </div>
    </div>
  );
}
