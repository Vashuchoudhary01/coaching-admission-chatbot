"use client";

import {
  Download,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Lead = {
  name: string | null;
  phone: string | null;
  course: string | null;
  status: string | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const formatIstDate = (value?: string | null) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const isTodayInIndia = (value?: string | null) => {
  if (!value) return false;

  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const leadDate = new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  return today === leadDate;
};

const csvSafe = (value?: string | null) => {
  const text = value ?? "";
  return `"${text.replaceAll('"', '""')}"`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
  useEffect(() => {
  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setCheckingAuth(false);
  };

  checkUser();
}, [router]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) =>
      [lead.name, lead.phone, lead.course].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [leads, search]);

  const todayLeadCount = useMemo(
    () => leads.filter((lead) => isTodayInIndia(lead.created_at)).length,
    [leads],
  );

  const uniqueCourseCount = useMemo(
    () =>
      new Set(
        leads
          .map((lead) => lead.course?.trim().toLowerCase())
          .filter(Boolean),
      ).size,
    [leads],
  );
  const newLeadCount = useMemo(
  () => leads.filter((lead) => lead.status === "new").length,
  [leads],
);

const contactedLeadCount = useMemo(
  () => leads.filter((lead) => lead.status === "contacted").length,
  [leads],
);

const interestedLeadCount = useMemo(
  () => leads.filter((lead) => lead.status === "interested").length,
  [leads],
);

const convertedLeadCount = useMemo(
  () => leads.filter((lead) => lead.status === "converted").length,
  [leads],
);

const closedLeadCount = useMemo(
  () => leads.filter((lead) => lead.status === "closed").length,
  [leads],
);

  const fetchLeads = useCallback(async (passwordToUse = password) => {
    if (!passwordToUse.trim()) {
      setError("Enter admin password.");
      if (checkingAuth) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Checking authentication...</p>
    </div>
  );
}
      return;

    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/leads", {
        headers: {
          "x-admin-password": passwordToUse,
        },
      });
      const result = (await response.json()) as {
        leads?: Lead[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Could not load leads.");
      }

      setLeads(result.leads ?? []);
      setLastLoadedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [password]);
const updateStatus = async (
  phone: string,
  status: string
) => {
  try {
    await fetch("/api/admin/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        status,
      }),
    });

    setLeads((current) =>
      current.map((lead) =>
        lead.phone === phone
          ? { ...lead, status }
          : lead
      )
    );
  } catch (error) {
    console.error(error);
  }
};
const updateNotes = async (
  phone: string,
  notes: string
) => {
  try {
    await fetch("/api/admin/update-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        notes,
      }),
    });

    setLeads((current) =>
      current.map((lead) =>
        lead.phone === phone
          ? { ...lead, notes }
          : lead
      )
    );
  } catch (error) {
    console.error(error);
  }
};

  const exportCsv = () => {
    const rows = filteredLeads.map((lead) =>
      [
        csvSafe(lead.name),
        csvSafe(lead.phone),
        csvSafe(lead.course),
        csvSafe(formatIstDate(lead.created_at)),
      ].join(","),
    );
    const csv = ["Name,Phone,Course,Created At IST", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "admission-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Shield size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admission Admin</h1>
                <p className="text-sm text-zinc-500">Lead management dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex rounded-lg border border-zinc-300 bg-white">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void fetchLeads();
                }}
                placeholder="Admin password"
                className="min-w-0 flex-1 rounded-l-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex rounded-lg border border-zinc-300 bg-white">
            
                </div>

                {/* Add Logout Button Here */}
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            <button
              type="button"
              onClick={() => fetchLeads()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              Load Leads
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Total Leads</p>
              <Users size={18} className="text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-bold">{leads.length}</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">Today</p>
            <p className="mt-3 text-3xl font-bold">{todayLeadCount}</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">Courses Requested</p>
            <p className="mt-3 text-3xl font-bold">{uniqueCourseCount}</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white">
        <div className="mt-4 grid gap-4 md:grid-cols-5">
  <div className="rounded-lg border bg-gray-50 p-4">
    <p className="text-sm text-gray-600">New</p>
    <p className="text-2xl font-bold">{newLeadCount}</p>
  </div>

  <div className="rounded-lg border bg-blue-50 p-4">
    <p className="text-sm text-blue-600">Contacted</p>
    <p className="text-2xl font-bold">{contactedLeadCount}</p>
  </div>

  <div className="rounded-lg border bg-yellow-50 p-4">
    <p className="text-sm text-yellow-600">Interested</p>
    <p className="text-2xl font-bold">{interestedLeadCount}</p>
  </div>

  <div className="rounded-lg border bg-green-50 p-4">
    <p className="text-sm text-green-600">Converted</p>
    <p className="text-2xl font-bold">{convertedLeadCount}</p>
  </div>

  <div className="rounded-lg border bg-red-50 p-4">
    <p className="text-sm text-red-600">Closed</p>
    <p className="text-2xl font-bold">{closedLeadCount}</p>
  </div>
</div>
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Leads</h2>
              {lastLoadedAt && (
                <p className="text-sm text-zinc-500">
                  Last loaded {formatIstDate(lastLoadedAt.toISOString())}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2">
                <Search size={18} className="text-zinc-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search leads"
                  className="min-w-0 outline-none"
                />
              </label>

              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredLeads.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 font-semibold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Course</th>
           <th>Status</th>
            <th>Notes</th>
            <th>Last Updated</th>
            <th>Created</th>
          </tr>
        </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLeads.map((lead, index) => (
                  <tr key={`${lead.phone}-${lead.created_at}-${index}`} className="hover:bg-zinc-50">
                    <td>{lead.name}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.course}</td>
                    <td className="px-4 py-4">
                    <select
                  value={lead.status || "new"}
                  onChange={(e) =>
                    updateStatus(
                      lead.phone || "",
                      e.target.value
                    )
                  }
                  className={`rounded border px-2 py-1 ${
  lead.status === "converted"
    ? "bg-green-100 text-green-800"
    : lead.status === "interested"
    ? "bg-yellow-100 text-yellow-800"
    : lead.status === "contacted"
    ? "bg-blue-100 text-blue-800"
    : lead.status === "closed"
    ? "bg-red-100 text-red-800"
    : "bg-gray-100 text-gray-800"
}`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
                  </td>
                    <td>
                <textarea
                  defaultValue={lead.notes || ""}
                  placeholder="Add notes..."
                  className="min-w-[200px] rounded border p-2"
                  onBlur={(e) =>
                   updateNotes(
                      lead.phone || "",
                      e.target.value
                    )
                  }
                />
              </td>
              <td>
                  {formatIstDate(lead.updated_at)}
                  </td>
                    <td>{formatIstDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!isLoading && filteredLeads.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-zinc-500">
                No leads found.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
