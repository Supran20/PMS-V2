"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChannelStatusBadge } from "@/components/channels/ChannelStatusBadge";
import {
  Channel,
  getChannels,
  suspendChannel,
  reactivateChannel,
  isDefaultChannel,
} from "@/lib/api/channel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const isTrialExpired = (channel: Channel) =>
  channel.status === "trial" &&
  !!channel.trial_ends_at &&
  new Date(channel.trial_ends_at) < new Date();

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const confirm = useConfirmDialog<{
    channel: Channel;
    action: "suspend" | "reactivate";
  }>();

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await getChannels();
      setChannels(data);
    } catch {
      toast.error("Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const runStatusAction = async () => {
    if (!confirm.item) return;
    const { channel, action } = confirm.item;

    setBusyId(channel.id);
    try {
      const updated =
        action === "suspend"
          ? await suspendChannel(channel.id)
          : await reactivateChannel(channel.id);

      toast.success(
        action === "suspend" ? "Channel suspended" : "Channel reactivated",
      );
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? updated : c)),
      );
      confirm.close();
    } catch (error) {
      // Surfaces backend messages like "Cannot suspend a cancelled channel".
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ?? `Failed to ${action} channel`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const isSuspendAction = confirm.item?.action === "suspend";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channels"
        actionHref="/dashboard/platform-admin/channels/add"
        actionLabel="Add Channel"
      />

      <Card className="shadow-lg bg-white border-none">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-500 p-6">Loading...</p>
          ) : channels.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">No channels found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Channel</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Subscription</th>
                  <th className="px-6 py-3 font-medium">Trial Ends</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => {
                  const busy = busyId === channel.id;
                  const isDefault = isDefaultChannel(channel);
                  // The default channel can never be suspended or edited.
                  const canSuspend =
                    !isDefault &&
                    (channel.status === "active" || channel.status === "trial");
                  // Reactivate stays available so a suspended default channel
                  // can always be recovered.
                  const canReactivate = channel.status === "suspended";

                  return (
                    <tr
                      key={channel.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">
                            {channel.channel_name}
                          </p>
                          {isDefault && (
                            <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{channel.slug}</p>
                      </td>
                      <td className="px-6 py-3">
                        <ChannelStatusBadge status={channel.status} />
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {channel.subscriptionPlan?.plan_name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600 capitalize">
                        {channel.subscription_status?.replace("_", " ") ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {formatDate(channel.trial_ends_at)}
                        {isTrialExpired(channel) && (
                          <span className="ml-2 text-xs font-medium text-red-600">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex items-center gap-4">
                          {isDefault ? (
                            <span
                              title="The default channel is locked and cannot be edited or suspended"
                              className="inline-flex items-center gap-1 text-gray-400 text-sm font-medium cursor-not-allowed"
                            >
                              <Icon icon="mdi:lock-outline" />
                              Locked
                            </span>
                          ) : (
                            <Link
                              href={`/dashboard/platform-admin/channels/${channel.id}/edit`}
                              title="Edit channel and subscription"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Icon icon="mdi:pencil-outline" />
                            </Link>
                          )}

                          {canSuspend && (
                            <button
                              onClick={() =>
                                confirm.open({ channel, action: "suspend" })
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 disabled:text-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <Icon icon="mdi:pause-circle-outline" />
                              {busy ? "Working..." : "Suspend"}
                            </button>
                          )}

                          {canReactivate && (
                            <button
                              onClick={() =>
                                confirm.open({ channel, action: "reactivate" })
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 disabled:text-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <Icon icon="mdi:play-circle-outline" />
                              {busy ? "Working..." : "Reactivate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirm.isOpen}
        tone={isSuspendAction ? "warning" : "success"}
        icon={
          isSuspendAction
            ? "mdi:pause-circle-outline"
            : "mdi:play-circle-outline"
        }
        title={
          isSuspendAction ? "Suspend this channel?" : "Reactivate this channel?"
        }
        highlight={confirm.item?.channel.channel_name}
        description={
          isSuspendAction
            ? "All of its users are blocked immediately until the channel is reactivated."
            : "Its users will be able to use the channel again."
        }
        confirmLabel={isSuspendAction ? "Suspend" : "Reactivate"}
        loading={busyId !== null}
        onConfirm={runStatusAction}
        onClose={confirm.close}
      />
    </div>
  );
}
