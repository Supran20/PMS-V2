"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { getMediaUrl, getInitials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  getPlatformAdmins,
  revokePlatformAdmin,
  PlatformAdmin,
} from "@/lib/api/platformAdmin";

export default function PlatformAdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await getPlatformAdmins();
      setAdmins(data);
    } catch {
      toast.error("Failed to load platform admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleRevoke = async (admin: PlatformAdmin) => {
    if (
      !window.confirm(
        `Revoke platform admin access for ${admin.user?.full_name}? Their regular channel account will be unaffected.`,
      )
    ) {
      return;
    }

    setRevokingId(admin.id);
    try {
      await revokePlatformAdmin(admin.id);
      toast.success("Platform admin access revoked");
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (error) {
      // Surfaces backend messages: "cannot revoke your own access",
      // "cannot remove the last remaining platform admin", etc.
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ?? "Failed to revoke platform admin";
      toast.error(message);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Admins"
        actionHref="/dashboard/platform-admin/admins/add"
        actionLabel="Add Platform Admin"
      />

      <Card className="shadow-lg bg-white border-none">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-500 p-6">Loading...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">
              No platform admins found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Admin</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Mobile</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.user?.id === user?.id;

                  return (
                    <tr
                      key={admin.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 text-xs font-semibold text-gray-600">
                            {admin.user?.profileImage?.path ? (
                              <img
                                src={getMediaUrl(admin.user.profileImage.path)}
                                alt={admin.user.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(admin.user?.full_name ?? "?")
                            )}
                          </div>
                          <span className="font-medium text-gray-800">
                            {admin.user?.full_name}
                            {isSelf && (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                (you)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {admin.user?.email}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {admin.user?.mobile_number || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            admin.user?.status === "active"
                              ? "text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium"
                              : "text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium"
                          }
                        >
                          {admin.user?.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleRevoke(admin)}
                          disabled={isSelf || revokingId === admin.id}
                          title={
                            isSelf
                              ? "You cannot revoke your own access"
                              : "Revoke access"
                          }
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <Icon icon="mdi:shield-off-outline" />
                          {revokingId === admin.id ? "Revoking..." : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
