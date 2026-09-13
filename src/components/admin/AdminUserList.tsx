"use client";

import { useState, useMemo } from "react";
import type { AdminUserProfile } from "../../lib/admin";

interface AdminUserListProps {
  users: AdminUserProfile[];
  currentUserId?: string;
  onUpdateRole: (userId: string, newRole: "admin" | "user") => Promise<void>;
  isActionLoading: boolean;
}

export default function AdminUserList({
  users,
  currentUserId,
  onUpdateRole,
  isActionLoading,
}: AdminUserListProps) {
  const [search, setSearch] = useState("");
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: AdminUserProfile;
    newRole: "admin" | "user";
  } | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        u.user_id.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const confirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    await onUpdateRole(roleChangeTarget.user.user_id, roleChangeTarget.newRole);
    setRoleChangeTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Search filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by email, name or ID..."
            className="w-full rounded-2xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none dark:border-[#2e2722] dark:bg-[#161311] dark:text-[#fafaf9] dark:placeholder-stone-500 transition shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              ✕
            </button>
          )}
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
          Total accounts: <strong className="font-bold text-stone-900 dark:text-white">{users.length}</strong>
        </p>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm dark:border-[#2e2722] dark:bg-[#1a1715]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 dark:text-stone-400">
            <thead className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-black uppercase tracking-wider text-stone-500 dark:border-[#2e2722] dark:bg-[#141210] dark:text-stone-400">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 sm:pl-6">
                  User
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Role
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Tier
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Last Active
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                  Manage Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-[#25201c]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <p className="text-sm font-semibold">No users found</p>
                    <p className="text-xs mt-1">Try another search query.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.user_id === currentUserId;
                  return (
                    <tr
                      key={user.user_id}
                      className="hover:bg-stone-50/50 dark:hover:bg-[#1f1b18] transition-colors"
                    >
                      {/* User details */}
                      <td className="py-3 pl-4 pr-3 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-[#201c19] border border-stone-200 dark:border-white/5 font-bold text-stone-700 dark:text-stone-300 text-xs">
                            {(user.display_name || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-stone-900 dark:text-white truncate">
                                {user.display_name || "Home Cook"}
                              </p>
                              {isCurrent && (
                                <span className="rounded-md bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                              {user.email || user.user_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            user.role === "admin"
                              ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                              : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            user.subscription_tier === "pro"
                              ? "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                              : "bg-stone-100 text-stone-500 dark:bg-[#1a1715] dark:text-stone-500"
                          }`}
                        >
                          {user.subscription_tier || "free"}
                        </span>
                      </td>

                      {/* Last updated */}
                      <td className="px-3 py-3 text-[11px] text-stone-400">
                        {user.updated_at
                          ? new Date(user.updated_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </td>

                      {/* Action */}
                      <td className="py-3 pl-3 pr-4 sm:pr-6 text-right">
                        <div className="flex items-center justify-end">
                          {isCurrent ? (
                            <span className="text-[11px] text-stone-400 italic">Current Session</span>
                          ) : (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() =>
                                setRoleChangeTarget({
                                  user,
                                  newRole: user.role === "admin" ? "user" : "admin",
                                })
                              }
                              className={`translate-x-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                                user.role === "admin"
                                  ? "border border-stone-200 bg-white text-stone-600 hover:border-rose-400 hover:text-rose-600 dark:border-[#2e2722] dark:bg-[#1f1b18] dark:text-stone-300 dark:hover:border-rose-500/60 dark:hover:text-rose-400 shadow-2xs"
                                  : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                              }`}
                            >
                              {user.role === "admin" ? (
                                <span>Demote to User</span>
                              ) : (
                                <>
                                  <svg className="h-3.5 w-3.5 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                  </svg>
                                  <span>Make Admin</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Role Change */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Change User Role?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Update administrative permissions.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              Are you sure you want to change the role of{" "}
              <strong className="font-bold text-stone-900 dark:text-white">
                {roleChangeTarget.user.display_name || roleChangeTarget.user.email}
              </strong>{" "}
              to <strong className="uppercase text-stone-900 dark:text-white font-black">{roleChangeTarget.newRole}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:bg-[#25211d] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRoleChange}
                className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-4 py-2 text-xs transition cursor-pointer active:scale-95"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
