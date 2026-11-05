"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { getInitials, getMediaUrl } from "@/lib/utils";
import {
  ChannelProfile,
  getMyChannel,
  removeMyChannelLogo,
  updateMyChannel,
  uploadMyChannelLogo,
} from "@/lib/api/channelProfile";
import {
  ChannelProfileFormInput,
  LOGO_ALLOWED_TYPES,
  LOGO_MAX_BYTES,
  channelProfileFormSchema,
  toChannelProfileFormValues,
  toUpdateChannelProfilePayload,
} from "@/lib/validations/channelProfile.validation";

const inputClass =
  "w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";

const submitButtonClass =
  "rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500";

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message ?? fallback;
};

export default function ChannelSettingsPage() {
  const router = useRouter();
  const { loading: authLoading, hasPermission, updateUserChannel } = useAuth();

  const canView = hasPermission("settings.view");
  const canEdit = hasPermission("settings.edit");

  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ChannelProfileFormInput>({
    resolver: zodResolver(channelProfileFormSchema),
    defaultValues: {
      channel_name: "",
      description: "",
      youtube: "",
      spotify: "",
      instagram: "",
      website: "",
    },
  });

  const descriptionLength = watch("description")?.length ?? 0;

  // Keep the sidebar / header in sync with what was just saved.
  const syncSidebar = (p: ChannelProfile) =>
    updateUserChannel({
      id: p.id,
      channel_name: p.channel_name,
      slug: p.slug,
      logo: p.logo,
    });

  // Users without settings.view have no business on this page.
  useEffect(() => {
    if (!authLoading && !canView) {
      router.replace("/dashboard");
    }
  }, [authLoading, canView, router]);

  useEffect(() => {
    if (authLoading || !canView) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await getMyChannel();
        if (cancelled) return;

        setProfile(data);
        reset(toChannelProfileFormValues(data));
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getErrorMessage(error, "Failed to load channel settings"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, canView, reset]);

  const onSave = async (data: ChannelProfileFormInput) => {
    setSaving(true);
    try {
      const updated = await updateMyChannel(
        toUpdateChannelProfilePayload(data),
      );
      setProfile(updated);
      reset(toChannelProfileFormValues(updated));
      syncSidebar(updated);
      toast.success("Channel profile updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update channel profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;

    if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Invalid file type. Only jpg, png or webp images are allowed.",
      );
      return;
    }

    if (file.size > LOGO_MAX_BYTES) {
      toast.error("Logo must be 2 MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const updated = await uploadMyChannelLogo(file);
      // Only the logo changed here; unsaved form edits are left alone.
      setProfile(updated);
      syncSidebar(updated);
      toast.success("Logo updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload logo"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setRemoving(true);
    try {
      const updated = await removeMyChannelLogo();
      setProfile(updated);
      syncSidebar(updated);
      toast.success("Logo removed");
      setRemoveOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove logo"));
    } finally {
      setRemoving(false);
    }
  };

  if (authLoading || loading || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
          <CardContent>
            <p className="text-sm text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logoBusy = uploading || removing;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      {!canEdit && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You have view-only access to the channel settings.
        </p>
      )}

      {/* Logo */}
      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Channel Logo
            </h3>

            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-xl font-semibold text-gray-500">
                {profile.logo?.path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getMediaUrl(profile.logo.path)}
                    alt={profile.channel_name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  getInitials(profile.channel_name)
                )}
              </div>

              <div className="space-y-2">
                {canEdit && (
                  <div className="flex flex-wrap gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleLogoSelected}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      disabled={logoBusy}
                      onClick={() => fileInputRef.current?.click()}
                      className={submitButtonClass}
                    >
                      {uploading
                        ? "Uploading..."
                        : profile.logo
                          ? "Replace Logo"
                          : "Upload Logo"}
                    </Button>

                    {profile.logo && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={logoBusy}
                        onClick={() => setRemoveOpen(true)}
                        className="rounded-md border-gray-400"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  PNG, JPG or WebP, up to 2 MB. A square image works best.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details + links */}
      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* fieldset disables every input inside it */}
        <fieldset disabled={!canEdit} className="space-y-6">
          <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
            <CardContent>
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Channel Details
                </h3>

                <FormField label="Channel Name" required>
                  <FormInput<ChannelProfileFormInput>
                    name="channel_name"
                    control={control}
                    placeholder="e.g. Tech Talks Nepal"
                  />
                </FormField>

                <FormField label="Slug">
                  <input
                    type="text"
                    value={profile.slug}
                    disabled
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    The slug is managed by the platform and cannot be changed
                    here.
                  </p>
                </FormField>

                <FormField label="Description">
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder="A short description of your channel"
                    className={inputClass}
                  />
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="text-red-600 text-sm">
                      {errors.description?.message}
                    </p>
                    <p className="ml-auto text-xs text-gray-400">
                      {descriptionLength}/500
                    </p>
                  </div>
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
            <CardContent>
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Social Links
                </h3>

                <FormField label="YouTube">
                  <FormInput<ChannelProfileFormInput>
                    name="youtube"
                    control={control}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </FormField>

                <FormField label="Spotify">
                  <FormInput<ChannelProfileFormInput>
                    name="spotify"
                    control={control}
                    placeholder="https://open.spotify.com/show/..."
                  />
                </FormField>

                <FormField label="Instagram">
                  <FormInput<ChannelProfileFormInput>
                    name="instagram"
                    control={control}
                    placeholder="https://instagram.com/yourchannel"
                  />
                </FormField>

                <FormField label="Website">
                  <FormInput<ChannelProfileFormInput>
                    name="website"
                    control={control}
                    placeholder="https://example.com"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </fieldset>

        {canEdit && (
          <div className="flex md:justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !isDirty}
              className={submitButtonClass}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={removeOpen}
        tone="danger"
        icon="mdi:trash-can-outline"
        title="Remove channel logo?"
        description="The logo will disappear from the sidebar and its file will be deleted. You can upload a new one at any time."
        confirmLabel="Remove logo"
        loading={removing}
        onConfirm={handleRemoveLogo}
        onClose={() => setRemoveOpen(false)}
      />
    </div>
  );
}
