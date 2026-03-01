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

import {
  createInterviewSchema,
  CreateInterviewInput,
} from "@/lib/validations/interview.validation";

import {
  createInterview,
  getInterviews,
  checkInterviewOverlap,
  Interview,
} from "@/lib/api/interview";
import { getGuests, Guest } from "@/lib/api/guest";
import { getUsers, User } from "@/lib/api/user";
import { getStudios, Studio } from "@/lib/api/studio";

export default function AddInterviewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [hosts, setHosts] = useState<User[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const searchParams = useSearchParams();
  const guestIdFromUrl = searchParams.get("guest_id");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInterviewInput>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: {
      interview_status: "scheduled",
      live_status: "not_live",
    },
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
        const [guestData, userData, studioData] = await Promise.all([
          getGuests(),
          getUsers(),
          getStudios(),
        ]);

        setGuests(guestData);
        setHosts(userData);
        setStudios(studioData);

        // 🔥 AUTO-SELECT GUEST IF PASSED IN URL
        if (guestIdFromUrl) {
          setValue("guest_id", guestIdFromUrl, { shouldValidate: true });
        }
      } catch {
        toast.error("Failed to load form data");
      }
    };

    fetchData();
  }, [guestIdFromUrl, setValue]);

  /**
   * -------------------------
   * Submit
   * -------------------------
   */
  const onSubmit = async (data: CreateInterviewInput) => {
    setSubmitting(true);
    try {
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
          // If the overlap check fails (e.g., endpoint not available), proceed with creation
          // The backend will handle the overlap check anyway
          console.error("Overlap check error:", overlapError);
        }
      }

      await createInterview(data);
      toast.success("Interview scheduled successfully");
      router.push("/dashboard/interview");
    } catch (error: any) {
      // Handle overlap errors from backend
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

      <Card className="shadow-lg bg-white border-none py-5">
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
              <FormInput<CreateInterviewInput>
                name="interview_date"
                control={control}
                type="date"
              />
            </FormField>

            {/* Start Time */}
            <FormField label="Start Time" required>
              <FormInput<CreateInterviewInput>
                name="start_time"
                control={control}
                type="time"
              />
            </FormField>

            {/* End Time */}
            <FormField label="End Time" required>
              <FormInput<CreateInterviewInput>
                name="end_time"
                control={control}
                type="time"
              />
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
    </div>
  );
}
