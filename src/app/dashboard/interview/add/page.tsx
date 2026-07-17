"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { FormActions } from "@/components/ui/FormActions";
import YoutubeEmbedInput from "@/components/ui/YoutubeEmbedInput";
import GuestSelectModal from "@/components/ui/GuestSelectModal";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";

import {
  createInterviewSchema,
  CreateInterviewInput,
  CreateInterviewOutput,
} from "@/lib/validations/interview.validation";

import {
  createInterview,
  getInterviews,
  getEpisodeMeta,
  checkInterviewOverlap,
} from "@/lib/api/interview";
import { getGuests, Guest } from "@/lib/api/guest";
import { getHostUser, User } from "@/lib/api/user";
import { getStudios, Studio } from "@/lib/api/studio";
import GuestReapprovalModal from "@/components/guest/GuestReapprovalModal";
import { parseReapprovalError, type ReapprovalErrorInfo } from "@/lib/utils";

export default function AddInterviewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [hosts, setHosts] = useState<User[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [maxEpisode, setMaxEpisode] = useState<number>(1);
  const [episodeInputEnabled, setEpisodeInputEnabled] = useState(false);
  const [existingEpisodes, setExistingEpisodes] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  // Set when createInterview 409s with a repeat-booking reapproval code
  // — drives GuestReapprovalModal instead of a plain error toast. Note
  // the matched guest may not be present in `guests` (that list is
  // filtered to approved === true, and this guest just isn't), so the
  // guest name shown here comes from the backend's error payload, not
  // a local lookup.
  const [reapprovalInfo, setReapprovalInfo] =
    useState<ReapprovalErrorInfo | null>(null);

  const searchParams = useSearchParams();
  const guestIdFromUrl = searchParams.get("guest_id");
  const { hasPermission, user } = useAuth();

  const canEditInterview = hasPermission("interview.update");
  const isHostUser = user?.roles?.includes("Host");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createInterviewSchema),
  });

  const selectedGuest = guests.find((g) => g.id === watch("guest_id"));

  /**
   * -------------------------
   * Fetch dropdown data
   * -------------------------
   */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guestData, userData, studioData, interviews, episodeMeta] =
          await Promise.all([
            getGuests(),
            getHostUser(),
            getStudios(),
            getInterviews(), // fetch all interviews to get max episode
            getEpisodeMeta(),
          ]);

        const approvedGuests = guestData.filter((g) => g.approved === true);
        setGuests(approvedGuests);
        setHosts(userData);
        setStudios(studioData);

        // Determine max episode from unrestricted source
        const episodes = episodeMeta.existingEpisodes.map((e) => e.episode);
        setExistingEpisodes(episodes);
        setMaxEpisode(episodeMeta.maxEpisode);

        // Set default episode in form
        setValue("episode", episodeMeta.maxEpisode + 1);

        if (guestIdFromUrl) {
          setValue("guest_id", guestIdFromUrl, { shouldValidate: true });
        }
      } catch {
        toast.error("Failed to load form data");
      }
    };

    fetchData();
  }, [guestIdFromUrl, setValue]);

  useEffect(() => {
    if (studios.length === 1) {
      setValue("studio_id", studios[0].id, {
        shouldValidate: true,
      });
    }
  }, [studios, setValue]);

  useEffect(() => {
    if (!selectedGuest) return;

    if (selectedGuest.host_id) {
      // Auto set host from guest
      setValue("host_id", selectedGuest.host_id, {
        shouldValidate: true,
      });
    } else {
      // If guest has no host → clear host selection
      setValue("host_id", "", {
        shouldValidate: true,
      });
    }
  }, [selectedGuest, setValue]);

  /**
   * -------------------------
   * Submit
   * -------------------------
   */
  const onSubmit = async (data: CreateInterviewOutput) => {
    setSubmitting(true);
    try {
      // Check if episode exists
      const episodeExists = existingEpisodes.includes(data.episode);
      if (episodeExists) {
        // Fetch the interview to see if it is published
        const episodeMeta = await getEpisodeMeta();
        const conflicting = episodeMeta.existingEpisodes.find(
          (e) => e.episode === data.episode,
        );

        if (conflicting?.status === "published") {
          toast.error("Can't assign interview with this episode number");
          setSubmitting(false);
          return;
        } else {
          toast.error("Episode number already exists");
          setSubmitting(false);
          return;
        }
      }

      // Check for overlaps before creating the interview
      const endTime = data.end_time || "";

      if (
        data.guest_id &&
        data.host_id &&
        data.studio_id &&
        data.interview_date &&
        data.start_time &&
        endTime
      ) {
        try {
          const overlapResponse = await checkInterviewOverlap({
            guest_id: data.guest_id,
            host_id: data.host_id,
            studio_id: data.studio_id,
            interview_date: data.interview_date,
            start_time: data.start_time,
            end_time: endTime,
          });

          if (overlapResponse.conflict) {
            toast.error(
              overlapResponse.message || "Scheduling conflict detected",
            );
            setSubmitting(false);
            return;
          }
        } catch (overlapError: any) {
          console.error("Overlap check error:", overlapError);
        }
      }

      // Create interview
      await createInterview(data);
      toast.success("Interview scheduled successfully");
      router.push("/dashboard/interview");
    } catch (error: any) {
      const info = parseReapprovalError(error);

      if (info) {
        // Guest has a prior published interview and Guest.approved is
        // false — needs a reapproval request before this booking can
        // proceed. Surface the modal instead of a plain error toast.
        setReapprovalInfo(info);
        setSubmitting(false);
        return;
      }

      const errorMessage = error.response?.data?.message || error.message;
      if (
        errorMessage.includes("Guest is already booked") ||
        errorMessage.includes("Host is already assigned") ||
        errorMessage.includes("Studio is already reserved")
      ) {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to schedule interview");
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Schedule Interview" backHref="/dashboard/interview" />

      <Card className="shadow-lg bg-white border-none py-5 px-5 md:px-0">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Guest */}
            <FormField label="Guest" required>
              <div className="md:w-3/4 space-y-2">
                {!guestIdFromUrl && (
                  <button
                    type="button"
                    onClick={() => setGuestModalOpen(true)}
                    className="px-4 py-2 rounded-md bg-red-600 text-white text-sm"
                  >
                    Select Guest
                  </button>
                )}

                {selectedGuest && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedGuest.full_name}
                  </p>
                )}

                {errors.guest_id && (
                  <p className="text-sm text-red-600">
                    {errors.guest_id.message}
                  </p>
                )}
              </div>
            </FormField>

            {/* Host */}
            <FormField label="Host" required>
              <div className="md:w-3/4">
                <select
                  {...register("host_id")}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Host</option>
                  {hosts.map((host) => (
                    <option key={host.id} value={host.id}>
                      {host.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* Studio */}
            <FormField label="Studio" required>
              <div className="md:w-3/4">
                <select
                  {...register("studio_id")}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Studio</option>
                  {studios.map((studio) => (
                    <option key={studio.id} value={studio.id}>
                      {studio.studio_name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* Date */}
            <FormField label="Interview Date" required>
              <div className="md:w-3/4">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => {
                    setSelectedDate(date);

                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const day = String(date.getDate()).padStart(2, "0");

                      const formattedDate = `${year}-${month}-${day}`;

                      setValue("interview_date", formattedDate, {
                        shouldValidate: true,
                      });
                    } else {
                      setValue("interview_date", "", {
                        shouldValidate: true,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select date"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </FormField>

            {/* Start Time */}
            <FormField label="Start Time" required>
              <div className="md:w-3/4">
                <DatePicker
                  selected={selectedTime}
                  onChange={(date: Date | null) => {
                    setSelectedTime(date);

                    if (date) {
                      const time = date.toTimeString().slice(0, 5);
                      setValue("start_time", time, { shouldValidate: true });
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="HH:mm"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select time"
                />
              </div>
            </FormField>

            <FormField label="Episode Number" required>
              <div className="flex items-center gap-3 md:w-3/4">
                <input
                  type="number"
                  {...register("episode", {
                    valueAsNumber: true,
                  })}
                  className={`w-32 px-3 py-2 text-sm rounded-md border border-gray-300 ${
                    episodeInputEnabled ? "bg-white" : "bg-gray-100"
                  }`}
                  readOnly={!episodeInputEnabled || !canEditInterview}
                  min={1}
                />
                <span className="text-gray-600">
                  Latest Episode: {maxEpisode}
                </span>

                {canEditInterview && (
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={episodeInputEnabled}
                      onChange={(e) => setEpisodeInputEnabled(e.target.checked)}
                      className="cursor-pointer"
                    />
                    Edit
                  </label>
                )}
              </div>
              {errors.episode && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.episode.message}
                </p>
              )}
            </FormField>

            {/* Google Drive */}
            <FormField label="Google Drive Link">
              <FormInput<CreateInterviewInput>
                name="google_drive_link"
                control={control}
                placeholder="https://drive.google.com/..."
              />
            </FormField>

            {/* YouTube */}
            <FormField label="YouTube Link">
              <div className="md:w-3/4">
                <YoutubeEmbedInput
                  value={watch("youtube_link")}
                  setValue={setValue}
                />
                {errors.youtube_link && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.youtube_link.message}
                  </p>
                )}
              </div>
            </FormField>

            <FormActions
              cancelHref="/dashboard/interview"
              submitLabel="Schedule Interview"
              loadingLabel="Scheduling..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
      <GuestSelectModal
        open={guestModalOpen}
        guests={guests}
        onClose={() => setGuestModalOpen(false)}
        onSelect={(guest) => {
          setValue("guest_id", guest.id, { shouldValidate: true });
          setGuestModalOpen(false);
        }}
      />

      {reapprovalInfo && (
        <GuestReapprovalModal
          open={!!reapprovalInfo}
          onClose={() => setReapprovalInfo(null)}
          triggerSource={reapprovalInfo.triggerSource}
          guestId={reapprovalInfo.guestId}
          guestName={reapprovalInfo.guestName ?? "this guest"}
          proposedHostId={
            isHostUser ? (user?.id ?? null) : watch("host_id") || null
          }
          reapprovalRequestId={reapprovalInfo.reapprovalRequestId}
          onRequested={() => {
            setReapprovalInfo(null);
            router.push("/dashboard/interview");
          }}
        />
      )}
    </div>
  );
}
