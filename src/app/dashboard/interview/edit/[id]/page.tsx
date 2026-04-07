"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { DeleteModal } from "@/components/ui/DeleteModal";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";

import {
  updateInterviewSchema,
  UpdateInterviewInput,
  UpdateInterviewOutput,
} from "@/lib/validations/interview.validation";

import {
  getInterviewById,
  updateInterview,
  deleteInterview,
  getInterviews,
} from "@/lib/api/interview";

import { getGuests, Guest } from "@/lib/api/guest";
import { getHostUser, User } from "@/lib/api/user";
import { getStudios, Studio } from "@/lib/api/studio";

export default function EditInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [hosts, setHosts] = useState<User[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [maxEpisode, setMaxEpisode] = useState<number>(1);
  const [existingEpisodes, setExistingEpisodes] = useState<number[]>([]);
  const [episodeInputEnabled, setEpisodeInputEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);

  const { hasPermission } = useAuth();
  const canEditInterview = hasPermission("interview.update");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateInterviewInput>({
    resolver: zodResolver(updateInterviewSchema),
  });

  const selectedGuest = guests.find((g) => g.id === watch("guest_id"));

  /**
   * --------------------------------
   * Fetch Initial Data
   * --------------------------------
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [interview, guestData, userData, studioData] = await Promise.all([
          getInterviewById(id),
          getGuests(),
          getHostUser(),
          getStudios(),
        ]);

        const approvedGuests = guestData.filter((g) => g.approved === true);
        setGuests(approvedGuests);
        setHosts(userData);
        setStudios(studioData);

        reset({
          guest_id: interview.guest_id,
          host_id: interview.host_id,
          studio_id: interview.studio_id,
          episode: interview.episode,
          interview_date: interview.interview_date,
          start_time: interview.start_time,
          end_time: interview.end_time ?? undefined,
          google_drive_link: interview.google_drive_link,
          youtube_link: interview.youtube_link,
        });

        setSelectedDate(
          interview.interview_date ? new Date(interview.interview_date) : null,
        );

        setSelectedStartTime(
          interview.start_time
            ? new Date(`1970-01-01T${interview.start_time}`)
            : null,
        );

        setSelectedEndTime(
          interview.end_time
            ? new Date(`1970-01-01T${interview.end_time}`)
            : null,
        );
      } catch {
        toast.error("Failed to load interview");
        router.push("/dashboard/interview");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, reset, router]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const interviews = await getInterviews();
        const episodes = interviews.map((i) => i.episode);
        setExistingEpisodes(episodes);
        const max = Math.max(...episodes, 0);
        setMaxEpisode(max);

        // Only set default episode if the form has no episode set yet
        const currentEpisode = watch("episode");
        if (!currentEpisode) {
          setValue("episode", max + 1);
        }
      } catch {
        toast.error("Failed to fetch episodes");
      }
    };
    fetchEpisodes();
  }, [setValue, watch]);

  useEffect(() => {
    if (studios.length === 1) {
      setValue("studio_id", studios[0].id, {
        shouldValidate: true,
      });
    }
  }, [studios, setValue]);
  /**
   * --------------------------------
   * Submit
   * --------------------------------
   */
  const onSubmit = async (data: UpdateInterviewInput) => {
    const parsed = updateInterviewSchema.parse(data);
    const formData: UpdateInterviewOutput = parsed;

    setSubmitting(true);

    try {
      if (!formData.episode) formData.episode = maxEpisode + 1;

      const allInterviews = await getInterviews();

      const conflicting = allInterviews.find(
        (i) => i.episode === formData.episode && i.id !== id,
      );

      // only block published episode conflicts
      if (conflicting?.status === "published") {
        toast.error(
          "Can't assign episode already used by a published interview",
        );
        setSubmitting(false);
        return;
      }

      await updateInterview(id, formData);

      toast.success("Interview updated successfully");
      router.push("/dashboard/interview");
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      toast.error(message || "Failed to update interview");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this interview?",
    );

    if (!confirmDelete) return;

    try {
      setSubmitting(true);

      await deleteInterview(id);

      toast.success("Interview deleted successfully");

      router.push("/dashboard/interview");
    } catch {
      toast.error("Failed to delete interview");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);
      await deleteInterview(id);
      toast.success("Interview deleted successfully");
      router.push("/dashboard/interview");
    } catch {
      toast.error("Failed to delete interview");
    } finally {
      setSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Interview" backHref="/dashboard/interview" />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Guest */}
            <FormField label="Guest" required>
              <div className="md:w-3/4 space-y-2">
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(true)}
                  className="px-4 py-2 rounded-md bg-red-600 text-white text-sm"
                >
                  Select Guest
                </button>

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
                  className="w-full px-3 py-2 text-sm rounded-md border"
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
                  className="w-full px-3 py-2 text-sm rounded-md border"
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
                  onChange={(date) => {
                    setSelectedDate(date);
                    setValue(
                      "interview_date",
                      date ? date.toISOString().split("T")[0] : "",
                      { shouldValidate: true },
                    );
                  }}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select time"
                />
              </div>
            </FormField>

            {/* Start Time */}
            <FormField label="Start Time" required>
              <div className="md:w-3/4">
                <DatePicker
                  selected={selectedStartTime}
                  onChange={(date) => {
                    setSelectedStartTime(date);
                    if (date) {
                      setValue("start_time", date.toTimeString().slice(0, 5), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  dateFormat="HH:mm"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select time"
                />
              </div>
            </FormField>

            {/* End Time */}
            <FormField label="End Time" required>
              <div className="md:w-3/4">
                <DatePicker
                  selected={selectedEndTime}
                  onChange={(date) => {
                    setSelectedEndTime(date);
                    if (date) {
                      setValue("end_time", date.toTimeString().slice(0, 5), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
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
              <FormInput name="google_drive_link" control={control} />
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

            <div className="flex items-center gap-3 pt-4">
              {/* Cancel */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/interview")}
                className="px-4 py-2 text-sm rounded-md border cursor-pointer"
              >
                Cancel
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-4 py-2 text-sm rounded-md cursor-pointer bg-red-600 text-white hover:bg-red-700"
                disabled={submitting}
              >
                Delete
              </button>

              {/* Update */}
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-md cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                {submitting ? "Updating..." : "Update Interview"}
              </button>
            </div>
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
      <DeleteModal
        open={deleteModalOpen}
        item={{ id }}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => await handleConfirmDelete()}
        itemName="Interview"
      />
    </div>
  );
}
