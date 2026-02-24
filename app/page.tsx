"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Lock,
  LogIn,
  LogOut,
  Shield,
  User,
  Users,
  LayoutDashboard,
  FileText,
  Calendar,
  Network,
  Crown,
  TrendingUp,
  Eye,
  Sparkles,
  PartyPopper,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CIC Progression Dashboard (Aesthetic Glow POC — FULL)
 * - Next.js App Router single-page app
 * - Mock login with 4 member tiers + 1 admin
 * - Tier-based access + Admin console (view all + view-as)
 * - Auth persistence via localStorage
 * - Confetti + tier unlock animations
 *
 * Demo:
 * - explorer@cic.ca / demo123
 * - practitioner@cic.ca / demo123
 * - collaborator@cic.ca / demo123
 * - leader@cic.ca / demo123
 * - admin@cic.ca / admin123
 */

const STORAGE_USERS = "cic_demo_users_v1";
const STORAGE_AUTH = "cic_demo_auth_v1";

// --- Mock Users ---
const TIERS = ["Explorer", "Practitioner", "Collaborator", "Leader"] as const;
type Tier = (typeof TIERS)[number];
const tierRank = (tier: Tier) => TIERS.indexOf(tier);

type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  tier: Tier;
  orgType: string;
  year: number;
  engagementScore: number; // 0-100
  lastLogin: string | null;
  isAdmin?: boolean;
};

const defaultUsers: DemoUser[] = [
  {
    id: "u1",
    name: "Ava (Explorer)",
    email: "explorer@cic.ca",
    password: "demo123",
    tier: "Explorer",
    orgType: "Small business",
    year: 1,
    engagementScore: 18,
    lastLogin: null,
  },
  {
    id: "u2",
    name: "Noah (Practitioner)",
    email: "practitioner@cic.ca",
    password: "demo123",
    tier: "Practitioner",
    orgType: "Municipality",
    year: 1,
    engagementScore: 44,
    lastLogin: null,
  },
  {
    id: "u3",
    name: "Maya (Collaborator)",
    email: "collaborator@cic.ca",
    password: "demo123",
    tier: "Collaborator",
    orgType: "Large organization",
    year: 2,
    engagementScore: 71,
    lastLogin: null,
  },
  {
    id: "u4",
    name: "Liam (Leader)",
    email: "leader@cic.ca",
    password: "demo123",
    tier: "Leader",
    orgType: "Large organization",
    year: 3,
    engagementScore: 92,
    lastLogin: null,
  },
  {
    id: "admin",
    name: "CIC Admin",
    email: "admin@cic.ca",
    password: "admin123",
    tier: "Leader",
    orgType: "CIC Staff",
    year: 0,
    engagementScore: 0,
    lastLogin: null,
    isAdmin: true,
  },
];

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function burstConfetti() {
  // Dynamic import so it doesn't run during build SSR
  const confetti = (await import("canvas-confetti")).default;
  const duration = 700;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 70,
      origin: { x: 1 },
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 40,
    scalar: 0.9,
    origin: { y: 0.55 },
  });
}

// --- Privileges (gating by minimum tier) ---
const PRIVILEGES = [
  {
    group: "Core Access",
    items: [
      { label: "Newsletters & research library", minTier: "Explorer" as Tier },
      { label: "Discounted event access", minTier: "Explorer" as Tier },
      { label: "Member directory access", minTier: "Explorer" as Tier },
    ],
  },
  {
    group: "Onboarding & Guidance",
    items: [
      { label: "Getting Started curated pathway", minTier: "Explorer" as Tier },
      { label: "Invite to 1 working group as observer", minTier: "Explorer" as Tier },
    ],
  },
  {
    group: "Participation",
    items: [
      { label: "Full working group participation", minTier: "Practitioner" as Tier },
      { label: "Contribute to case studies", minTier: "Practitioner" as Tier },
      { label: "Members-only roundtables", minTier: "Practitioner" as Tier },
      { label: "Early event registration", minTier: "Practitioner" as Tier },
      { label: "Member spotlight (rotating)", minTier: "Practitioner" as Tier },
    ],
  },
  {
    group: "Visibility & Collaboration",
    items: [
      { label: "Co-lead working groups", minTier: "Collaborator" as Tier },
      { label: "Advisory roundtable invitations", minTier: "Collaborator" as Tier },
      { label: "Featured case study on CIC website", minTier: "Collaborator" as Tier },
      { label: "Logo placement in Active Collaborators section", minTier: "Collaborator" as Tier },
      { label: "Join pilot initiatives", minTier: "Collaborator" as Tier },
      { label: "Priority speaking consideration", minTier: "Collaborator" as Tier },
    ],
  },
  {
    group: "Influence & Recognition",
    items: [
      { label: "Priority input in policy submissions", minTier: "Leader" as Tier },
      { label: "Exclusive strategy briefings", minTier: "Leader" as Tier },
      { label: "Board/committee nomination priority", minTier: "Leader" as Tier },
      { label: "Public recognition badge", minTier: "Leader" as Tier },
      { label: "Annual impact recognition feature", minTier: "Leader" as Tier },
      { label: "Logo on major event materials", minTier: "Leader" as Tier },
    ],
  },
];

const PAGES = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "resources", label: "Resources", icon: FileText },
  { key: "events", label: "Events", icon: Calendar },
  { key: "workingGroups", label: "Working Groups", icon: Network },
  { key: "influence", label: "Influence & Recognition", icon: Crown },
  { key: "progress", label: "Progress", icon: TrendingUp },
] as const;

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "info";
}) {
  const tones: Record<string, string> = {
    default:
      "bg-white/10 text-white/80 border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
    good:
      "bg-emerald-400/10 text-emerald-100 border-emerald-300/20 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]",
    warn:
      "bg-amber-400/10 text-amber-100 border-amber-300/20 shadow-[0_0_0_1px_rgba(245,158,11,0.18)]",
    bad:
      "bg-rose-400/10 text-rose-100 border-rose-300/20 shadow-[0_0_0_1px_rgba(244,63,94,0.18)]",
    info:
      "bg-sky-400/10 text-sky-100 border-sky-300/20 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs backdrop-blur",
        tones[tone] ?? tones.default
      )}
    >
      {children}
    </span>
  );
}

function GlowCard({
  title,
  icon: Icon,
  children,
  right,
}: {
  title: string;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -inset-40 opacity-0 blur-3xl transition duration-700 group-hover:opacity-70">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/30 via-sky-500/30 to-emerald-500/30" />
      </div>

      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10">
              <Icon className="h-5 w-5 text-white/90" />
            </span>
          ) : null}
          <h3 className="text-sm font-semibold tracking-wide text-white/95">{title}</h3>
        </div>
        {right ? <div>{right}</div> : null}
      </div>

      <div className="relative px-5 py-4">{children}</div>
    </motion.div>
  );
}

function LockedRow({ label, unlocked }: { label: string; unlocked: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border p-4",
        unlocked ? "border-emerald-300/15 bg-emerald-400/5" : "border-white/10 bg-white/5"
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-white/90">{label}</div>
        <div className="mt-0.5 text-xs text-white/60">
          {unlocked ? "Unlocked" : "Locked — advance a tier to access"}
        </div>
      </div>
      <div className="shrink-0">
        {unlocked ? (
          <Pill tone="good">✓ Available</Pill>
        ) : (
          <Pill tone="warn">
            <Lock className="h-3.5 w-3.5" /> Locked
          </Pill>
        )}
      </div>
    </motion.div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = clamp(value, 0, 100);
  return (
    <div className="w-full rounded-full bg-white/10 ring-1 ring-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400"
      />
    </div>
  );
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

function GlowButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition";

  const variants: Record<string, string> = {
    primary:
      "bg-white text-slate-900 hover:bg-white/90 shadow-[0_16px_40px_-24px_rgba(255,255,255,0.9)]",
    secondary: "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10",
    ghost: "text-white/80 hover:bg-white/10",
  };

  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60")}
    >
      {children}
    </button>
  );
}

function computeTierFromScore(score: number): Tier {
  // Simple demo rule: score gates tier; keep it lightweight + automatable.
  if (score >= 90) return "Leader";
  if (score >= 70) return "Collaborator";
  if (score >= 40) return "Practitioner";
  return "Explorer";
}

type Toast = {
  id: string;
  title: string;
  body?: string;
  tone?: "info" | "good" | "warn";
};

export default function CICDashboardPOC() {
  const [users, setUsers] = useState<DemoUser[]>(defaultUsers);
  const [auth, setAuth] = useState<{ userId: string | null; viewAsUserId: string | null }>({
    userId: null,
    viewAsUserId: null,
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [page, setPage] = useState<(typeof PAGES)[number]["key"] | "admin">("overview");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [recentUnlock, setRecentUnlock] = useState<{ from: Tier; to: Tier } | null>(null);

  // --- persistence: load on mount ---
  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem(STORAGE_USERS);
      const rawAuth = localStorage.getItem(STORAGE_AUTH);

      if (rawUsers) setUsers(JSON.parse(rawUsers));
      if (rawAuth) setAuth(JSON.parse(rawAuth));
    } catch {
      // ignore
    }
  }, []);

  // --- persistence: save ---
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTH, JSON.stringify(auth));
    } catch {}
  }, [auth]);

  function pushToast(t: Omit<Toast, "id">) {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 3));
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }

  const signedInUser = useMemo(
    () => users.find((u) => u.id === auth.userId) ?? null,
    [users, auth.userId]
  );

  const viewAsUser = useMemo(() => {
    if (!signedInUser?.isAdmin) return null;
    if (!auth.viewAsUserId) return null;
    return users.find((u) => u.id === auth.viewAsUserId) ?? null;
  }, [users, signedInUser, auth.viewAsUserId]);

  const activeUser = viewAsUser ?? signedInUser;

  const tier: Tier = activeUser?.tier ?? "Explorer";
  const rank = tierRank(tier);

  function canAccess(minTier: Tier) {
    return rank >= tierRank(minTier);
  }

  const tierMeta = useMemo(() => {
    const hints: Record<Tier, string> = {
      Explorer:
        "Start here: discover what’s relevant, attend events, and join your first working group as an observer.",
      Practitioner:
        "You’re engaged: participate in working groups, contribute a case study, and join members-only roundtables.",
      Collaborator:
        "You’re contributing: co-lead groups, join pilots, and gain visibility through features and recognition.",
      Leader:
        "You’re leading: shape policy input, join strategy briefings, and access governance + high-visibility recognition.",
    };
    const next = TIERS[Math.min(rank + 1, TIERS.length - 1)];
    return { hint: hints[tier], nextTier: rank < 3 ? next : null };
  }, [tier, rank]);

  function signIn(e?: React.FormEvent) {
    e?.preventDefault?.();
    setLoginError("");

    const match = users.find(
      (u) =>
        u.email.toLowerCase() === loginForm.email.trim().toLowerCase() &&
        u.password === loginForm.password
    );

    if (!match) {
      setLoginError("Invalid email or password.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === match.id ? { ...u, lastLogin: new Date().toISOString() } : u))
    );

    setAuth({ userId: match.id, viewAsUserId: null });
    setPage("overview");
    setLoginForm({ email: "", password: "" });

    pushToast({
      title: `Welcome back, ${match.name.split(" ")[0]}!`,
      body: `Signed in as ${match.tier}.`,
      tone: "info",
    });
  }

  function signOut() {
    setAuth({ userId: null, viewAsUserId: null });
    setPage("overview");
    setLoginError("");
    pushToast({ title: "Signed out", tone: "info" });
  }

  function DemoHeader() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_120px_-70px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -inset-40 opacity-70 blur-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/30 via-sky-500/30 to-emerald-500/30" />
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-white/10 p-3 ring-1 ring-white/10">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold tracking-tight text-white">
                  CIC Progression Dashboard
                </div>
                <Pill tone="info">
                  <Sparkles className="h-3.5 w-3.5" /> Glow + Persistence
                </Pill>
              </div>
              <div className="mt-0.5 text-sm text-white/70">
                Progression-based membership: access → contribution → visibility → influence.
              </div>
            </div>
          </div>

          {signedInUser ? (
            <div className="flex flex-wrap items-center gap-2">
              {signedInUser.isAdmin ? (
                <Pill tone="info">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Pill>
              ) : null}

              <motion.span
                animate={{ filter: ["drop-shadow(0 0 0px rgba(255,255,255,0))", "drop-shadow(0 0 14px rgba(56,189,248,0.6))", "drop-shadow(0 0 0px rgba(255,255,255,0))"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Pill tone={tier === "Leader" ? "good" : tier === "Explorer" ? "warn" : "default"}>
                  <Crown className="h-3.5 w-3.5" /> {tier}
                </Pill>
              </motion.span>

              <GlowButton onClick={signOut} variant="secondary">
                <LogOut className="h-4 w-4" /> Sign out
              </GlowButton>
            </div>
          ) : (
            <Pill tone="info">
              <User className="h-3.5 w-3.5" /> Use demo accounts below
            </Pill>
          )}
        </div>

        {signedInUser ? (
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <Pill>
              <Users className="h-3.5 w-3.5" /> {activeUser?.orgType ?? "—"}
            </Pill>
            <Pill>
              <TrendingUp className="h-3.5 w-3.5" /> Engagement: {activeUser?.engagementScore ?? 0}/100
            </Pill>
            <Pill>
              <Calendar className="h-3.5 w-3.5" /> Year: {activeUser?.year ?? 0}
            </Pill>
            {viewAsUser ? (
              <Pill tone="warn">
                <Eye className="h-3.5 w-3.5" /> Viewing as: {viewAsUser.name}
              </Pill>
            ) : null}
          </div>
        ) : (
          <div className="relative mt-4 text-sm text-white/70">
            Login to see tier-gated UX. State persists so judges can refresh and it still works.
          </div>
        )}
      </motion.div>
    );
  }

  function LoginPanel() {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard title="Sign in" icon={LogIn} right={<Pill tone="info">Demo</Pill>}>
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Email</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-sky-400/30"
                placeholder="e.g., explorer@cic.ca"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Password</label>
              <input
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-sky-400/30"
                placeholder="demo123"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>

            {loginError ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                {loginError}
              </div>
            ) : null}

            <GlowButton type="submit" variant="primary">
              <LogIn className="h-4 w-4" /> Sign in
            </GlowButton>

            <div className="text-xs text-white/60">
              Tip: Login as <span className="font-semibold text-white/80">Explorer</span> to see locks → then
              <span className="font-semibold text-white/80"> Leader</span> to see everything unlocked.
            </div>
          </form>
        </GlowCard>

        <GlowCard title="Demo accounts" icon={Users}>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/90">Members (password: demo123)</div>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                {[
                  ["Explorer", "explorer@cic.ca", "warn"],
                  ["Practitioner", "practitioner@cic.ca", "default"],
                  ["Collaborator", "collaborator@cic.ca", "default"],
                  ["Leader", "leader@cic.ca", "good"],
                ].map(([t, email, tone]) => (
                  <div key={email} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{t}</div>
                      <div className="text-xs text-white/50">{email}</div>
                    </div>
                    <Pill tone={tone as any}>{t}</Pill>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/90">Admin</div>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm text-white/80">
                <div>
                  <div className="font-medium">CIC Admin</div>
                  <div className="text-xs text-white/50">admin@cic.ca • admin123</div>
                </div>
                <Pill tone="info">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Pill>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              This demo persists auth + member state in localStorage (refresh-proof for judges).
            </div>
          </div>
        </GlowCard>
      </div>
    );
  }

  function Sidebar() {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_25px_90px_-60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="px-2 py-2 text-xs font-semibold tracking-widest text-white/50">NAVIGATION</div>
        <div className="space-y-1.5">
          {PAGES.map((p) => {
            const Icon = p.icon;
            const active = page === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPage(p.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-white text-slate-900 shadow-[0_16px_40px_-28px_rgba(255,255,255,0.9)]"
                    : "text-white/80 hover:bg-white/10"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-slate-900" : "text-white/70")} />
                {p.label}
              </button>
            );
          })}

          {signedInUser?.isAdmin ? (
            <button
              onClick={() => setPage("admin")}
              className={cn(
                "mt-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                page === "admin"
                  ? "bg-white text-slate-900 shadow-[0_16px_40px_-28px_rgba(255,255,255,0.9)]"
                  : "text-white/80 hover:bg-white/10"
              )}
            >
              <Shield className={cn("h-4 w-4", page === "admin" ? "text-slate-900" : "text-white/70")} />
              Admin
            </button>
          ) : null}

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
            <div className="font-semibold text-white/80">Judge-friendly</div>
            <div className="mt-1">Refresh the page — auth + tier state stay.</div>
          </div>
        </div>
      </div>
    );
  }

  function OverviewPage() {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard
          title="Your membership tier"
          icon={Crown}
          right={
            <Pill tone={tier === "Leader" ? "good" : tier === "Explorer" ? "warn" : "default"}>{tier}</Pill>
          }
        >
          <div className="space-y-4">
            <div className="text-sm leading-relaxed text-white/80">{tierMeta.hint}</div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Engagement score</div>
                <div className="text-sm font-semibold text-white/90">{activeUser?.engagementScore ?? 0}/100</div>
              </div>
              <div className="mt-3">
                <ProgressBar value={activeUser?.engagementScore ?? 0} />
              </div>
              <div className="mt-2 text-xs text-white/55">
                Engagement increases with attendance, participation, and contribution (automatable rules).
              </div>
            </div>

            {tierMeta.nextTier ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                Next tier: <span className="font-semibold">{tierMeta.nextTier}</span> — unlock more participation,
                visibility, and influence.
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Top tier reached. Focus: sustained leadership, policy input, and recognition.
              </div>
            )}
          </div>
        </GlowCard>

        <GlowCard title="What you can access right now" icon={Lock}>
          <div className="space-y-3">
            {PRIVILEGES.flatMap((g) => g.items)
              .slice(0, 6)
              .map((it, idx) => (
                <LockedRow key={idx} label={it.label} unlocked={canAccess(it.minTier)} />
              ))}
            <div className="text-xs text-white/55">
              Explore the other pages to see tier-gated UX across resources, events, groups, and influence.
            </div>
          </div>
        </GlowCard>
      </div>
    );
  }

  function ResourcesPage() {
    const blocks = [
      {
        title: "Curated pathway",
        desc: "A role-specific ‘Getting Started’ path that helps members find what matters quickly.",
        minTier: "Explorer" as Tier,
      },
      {
        title: "Toolkits & templates",
        desc: "Practical templates and implementation checklists.",
        minTier: "Practitioner" as Tier,
      },
      {
        title: "Case study submission portal",
        desc: "Submit a short case study outline (review workflow stays light).",
        minTier: "Practitioner" as Tier,
      },
      {
        title: "Pilot initiative library",
        desc: "Browse past pilots and join active pilots as a collaborator.",
        minTier: "Collaborator" as Tier,
      },
      {
        title: "Strategy briefings archive",
        desc: "High-level strategy notes and briefing summaries.",
        minTier: "Leader" as Tier,
      },
    ];

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard title="Resources hub" icon={FileText}>
          <div className="space-y-3">
            {blocks.map((b, i) => (
              <LockedRow key={i} label={`${b.title} — ${b.desc}`} unlocked={canAccess(b.minTier)} />
            ))}
          </div>
        </GlowCard>

        <GlowCard title="Quick actions" icon={TrendingUp}>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/90">Recommended next step</div>
              <div className="mt-1 text-sm leading-relaxed text-white/75">
                {tier === "Explorer"
                  ? "Complete Getting Started + attend your first event."
                  : tier === "Practitioner"
                  ? "Join a working group and submit a short insight."
                  : tier === "Collaborator"
                  ? "Co-lead a session or join a pilot initiative."
                  : "Provide policy input and join a strategy briefing."}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <GlowButton variant="primary" onClick={() => pushToast({ title: "Saved!", body: "Added to your plan.", tone: "good" })}>
                  <CheckCircle2 className="h-4 w-4" /> Add to plan
                </GlowButton>
                <GlowButton variant="secondary">Save for later</GlowButton>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              Feasibility: Resources can be managed via Notion/Airtable/Sheets so CIC staff can update without dev support.
            </div>
          </div>
        </GlowCard>
      </div>
    );
  }

  function EventsPage() {
    const rows = [
      { name: "Monthly circular economy webinar", minTier: "Explorer" as Tier, badge: "Discounted" },
      { name: "Members-only roundtable", minTier: "Practitioner" as Tier, badge: "Members-only" },
      { name: "Pilot collaboration session", minTier: "Collaborator" as Tier, badge: "Pilot" },
      { name: "Executive strategy briefing", minTier: "Leader" as Tier, badge: "Exclusive" },
      { name: "AGM governance session", minTier: "Leader" as Tier, badge: "Governance" },
    ];

    return (
      <GlowCard title="Events" icon={Calendar}>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/90">{r.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill tone="info">{r.badge}</Pill>
                  <Pill>{`Min tier: ${r.minTier}`}</Pill>
                </div>
              </div>
              <div className="shrink-0">
                {canAccess(r.minTier) ? (
                  <GlowButton
                    variant="primary"
                    onClick={() => pushToast({ title: "Registered", body: "See you there!", tone: "good" })}
                  >
                    Register
                  </GlowButton>
                ) : (
                  <GlowButton variant="secondary" disabled>
                    <Lock className="h-4 w-4" /> Locked
                  </GlowButton>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
            Feasibility: Events can be tagged by tier. Early registration is a simple rule + tier check.
          </div>
        </div>
      </GlowCard>
    );
  }

  function WorkingGroupsPage() {
    const groups = [
      {
        name: "Municipal circular procurement",
        desc: "Peer learning and implementation exchange.",
        minTier: "Explorer" as Tier,
        mode: "Observer allowed",
      },
      {
        name: "SME circular operations playbook",
        desc: "Templates and practical tooling for early-stage orgs.",
        minTier: "Practitioner" as Tier,
        mode: "Participate",
      },
      {
        name: "Cross-sector pilot working group",
        desc: "Co-develop and run a lightweight pilot initiative.",
        minTier: "Collaborator" as Tier,
        mode: "Co-lead eligible",
      },
      {
        name: "Policy input taskforce",
        desc: "Draft policy input and participate in strategy discussions.",
        minTier: "Leader" as Tier,
        mode: "Lead",
      },
    ];

    return (
      <GlowCard title="Working Groups" icon={Network}>
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g, i) => {
            const unlocked = canAccess(g.minTier);
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/90">{g.name}</div>
                    <div className="mt-1 text-sm text-white/70">{g.desc}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill>{`Min tier: ${g.minTier}`}</Pill>
                      <Pill tone="info">{g.mode}</Pill>
                    </div>
                  </div>
                  {unlocked ? (
                    <Pill tone="good">✓ Available</Pill>
                  ) : (
                    <Pill tone="warn">
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </Pill>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <GlowButton
                    variant={unlocked ? "primary" : "secondary"}
                    disabled={!unlocked}
                    onClick={() => unlocked && pushToast({ title: "Joined", body: "You’re on the roster.", tone: "good" })}
                  >
                    {unlocked ? "Join" : "Locked"}
                  </GlowButton>
                  <GlowButton variant="secondary">Learn more</GlowButton>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          Feasibility: observer vs. participant vs. lead is a simple permission rule tied to tier.
        </div>
      </GlowCard>
    );
  }

  function InfluencePage() {
    return (
      <GlowCard title="Influence & Recognition" icon={Crown}>
        <div className="space-y-6">
          {PRIVILEGES.map((g, gi) => (
            <div key={gi} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white/90">{g.group}</div>
                <Pill tone="info">Progression-based unlock</Pill>
              </div>
              <div className="space-y-2">
                {g.items.map((it, ii) => (
                  <LockedRow
                    key={`${gi}-${ii}`}
                    label={`${it.label} (min tier: ${it.minTier})`}
                    unlocked={canAccess(it.minTier)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
            Retention mechanism: members stay because status + recognition + influence increase over time.
          </div>
        </div>
      </GlowCard>
    );
  }

  function ProgressPage() {
    const score = activeUser?.engagementScore ?? 0;
    const year = activeUser?.year ?? 0;

    const suggested = [
      { label: "Attend an event", points: 10, minTier: "Explorer" as Tier },
      { label: "Join a working group session", points: 15, minTier: "Practitioner" as Tier },
      { label: "Contribute a case study outline", points: 20, minTier: "Practitioner" as Tier },
      { label: "Co-lead a working group", points: 25, minTier: "Collaborator" as Tier },
      { label: "Provide policy input", points: 30, minTier: "Leader" as Tier },
    ];

    const demoUpgradeHint =
      tier === "Explorer"
        ? "(Demo) Hit 40+ engagement to unlock Practitioner."
        : tier === "Practitioner"
        ? "(Demo) Hit 70+ engagement to unlock Collaborator."
        : tier === "Collaborator"
        ? "(Demo) Hit 90+ engagement to unlock Leader."
        : "You’re at the top tier.";

    const completeAction = async (points: number, label: string) => {
      if (!signedInUser || signedInUser.isAdmin) return;
      if (viewAsUser) return; // don't mutate when in view-as

      const userId = signedInUser.id;

      let fromTier: Tier | null = null;
      let toTier: Tier | null = null;

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const newScore = clamp(u.engagementScore + points, 0, 100);
          const newTier = computeTierFromScore(newScore);
          fromTier = u.tier;
          toTier = newTier;
          return { ...u, engagementScore: newScore, tier: newTier };
        })
      );

      pushToast({ title: "Nice!", body: `+${points} engagement — ${label}`, tone: "good" });

      // unlock animation if tier increased
      if (fromTier && toTier && tierRank(toTier) > tierRank(fromTier)) {
        setRecentUnlock({ from: fromTier, to: toTier });
        await burstConfetti();
        pushToast({ title: `Tier unlocked: ${toTier}`, body: "New privileges are now available.", tone: "info" });
        setTimeout(() => setRecentUnlock(null), 2200);
      }
    };

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard title="Progress snapshot" icon={TrendingUp}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Engagement</div>
                <div className="text-sm font-semibold text-white/90">{score}/100</div>
              </div>
              <div className="mt-3">
                <ProgressBar value={score} />
              </div>
              <div className="mt-2 text-xs text-white/55">Year in membership: {year}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              {demoUpgradeHint}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              Note: In this demo, “Mark done” updates engagement and can auto-upgrade tier — fully automatable.
            </div>
          </div>
        </GlowCard>

        <GlowCard title="Suggested actions" icon={FileText}>
          <div className="space-y-3">
            {suggested.map((s, i) => {
              const unlocked = canAccess(s.minTier);
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: unlocked ? 1.01 : 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-white/90">{s.label}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill>{`+${s.points} points`}</Pill>
                      <Pill>{`Min tier: ${s.minTier}`}</Pill>
                    </div>
                  </div>
                  {unlocked ? (
                    <GlowButton variant="primary" onClick={() => completeAction(s.points, s.label)}>
                      <PartyPopper className="h-4 w-4" /> Mark done
                    </GlowButton>
                  ) : (
                    <GlowButton variant="secondary" disabled>
                      <Lock className="h-4 w-4" /> Locked
                    </GlowButton>
                  )}
                </motion.div>
              );
            })}
          </div>
        </GlowCard>
      </div>
    );
  }

  function AdminPage() {
    const members = users.filter((u) => !u.isAdmin);

    const resetDemo = () => {
      setUsers(defaultUsers);
      setAuth((a) => ({ ...a, viewAsUserId: null }));
      pushToast({ title: "Reset complete", body: "Demo users restored.", tone: "warn" });
    };

    return (
      <div className="space-y-6">
        <GlowCard
          title="Admin console"
          icon={Shield}
          right={
            <div className="flex items-center gap-2">
              <Pill tone="info">
                <Users className="h-3.5 w-3.5" /> {members.length} members
              </Pill>
              <GlowButton variant="secondary" onClick={resetDemo}>
                Reset demo
              </GlowButton>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              Lightweight admin view: who signed up, tier, engagement score, and “view as” preview.
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="grid grid-cols-12 gap-2 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold tracking-wide text-white/60">
                <div className="col-span-4">Member</div>
                <div className="col-span-2">Org type</div>
                <div className="col-span-2">Tier</div>
                <div className="col-span-2">Engagement</div>
                <div className="col-span-2">Actions</div>
              </div>

              {members.map((m) => (
                <div key={m.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-white/80">
                  <div className="col-span-4">
                    <div className="font-semibold text-white/95">{m.name}</div>
                    <div className="text-xs text-white/50">{m.email}</div>
                    <div className="text-xs text-white/50">Last login: {formatDate(m.lastLogin)}</div>
                  </div>

                  <div className="col-span-2 text-xs md:text-sm text-white/70">{m.orgType}</div>

                  <div className="col-span-2">
                    <Pill tone={m.tier === "Leader" ? "good" : m.tier === "Explorer" ? "warn" : "default"}>
                      {m.tier}
                    </Pill>
                  </div>

                  <div className="col-span-2">
                    <div className="text-xs text-white/50">{m.engagementScore}/100</div>
                    <ProgressBar value={m.engagementScore} />
                  </div>

                  <div className="col-span-2 flex flex-wrap gap-2">
                    <GlowButton variant="secondary" onClick={() => setAuth((a) => ({ ...a, viewAsUserId: m.id }))}>
                      <Eye className="h-4 w-4" /> View
                    </GlowButton>
                    <GlowButton variant="ghost" onClick={() => setAuth((a) => ({ ...a, viewAsUserId: null }))}>
                      Clear
                    </GlowButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              Feasibility: This table can be powered by a CRM export or sheet. Tier rules stay lightweight + automatable.
            </div>
          </div>
        </GlowCard>
      </div>
    );
  }

  function MainContent() {
    if (!signedInUser) return <LoginPanel />;

    if (page === "admin") return <AdminPage />;

    switch (page) {
      case "overview":
        return <OverviewPage />;
      case "resources":
        return <ResourcesPage />;
      case "events":
        return <EventsPage />;
      case "workingGroups":
        return <WorkingGroupsPage />;
      case "influence":
        return <InfluencePage />;
      case "progress":
        return <ProgressPage />;
      default:
        return <OverviewPage />;
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a]">
      {/* animated neon blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full bg-sky-500/25 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[-220px] left-1/3 h-[560px] w-[560px] rounded-full bg-emerald-500/20 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Unlock banner */}
      <AnimatePresence>
        {recentUnlock ? (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="fixed left-1/2 top-5 z-50 w-[92%] max-w-xl -translate-x-1/2"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-4 shadow-[0_30px_120px_-70px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -inset-24 blur-3xl opacity-70">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/35 via-sky-500/35 to-emerald-500/35" />
              </div>
              <div className="relative flex items-start gap-3">
                <div className="rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/10">
                  <PartyPopper className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Tier unlocked!</div>
                  <div className="mt-0.5 text-sm text-white/80">
                    {recentUnlock.from} → <span className="font-semibold">{recentUnlock.to}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    New privileges are now available across Events, Working Groups, and Influence.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-50 w-[92%] max-w-sm space-y-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/10">
                  {t.tone === "good" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  ) : t.tone === "warn" ? (
                    <Shield className="h-5 w-5 text-amber-200" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-sky-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{t.title}</div>
                  {t.body ? <div className="mt-0.5 text-sm text-white/75">{t.body}</div> : null}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        <DemoHeader />

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {signedInUser ? (
            <div className="lg:col-span-3">
              <Sidebar />
            </div>
          ) : null}

          <div className={signedInUser ? "lg:col-span-9" : "lg:col-span-12"}>
            <MainContent />
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/75 shadow-[0_25px_100px_-70px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="font-semibold text-white/90">POC assumptions (for your slide notes)</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Tier unlocks are lightweight rules (engagement score), so admin overhead stays low.</li>
            <li>Content can be managed via Notion/Airtable/Sheets.</li>
            <li>Focus is sequencing value—access → contribution → visibility → influence (retention via progression).</li>
          </ul>

          <div className="mt-3 text-xs text-white/60">
            Tip: To re-demo tier upgrades quickly, login as Explorer and click “Mark done” actions until you hit 40+ / 70+ / 90+.
          </div>
        </div>
      </div>
    </div>
  );
}
