"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Interview } from "@/lib/api/interview";
import {
  FormModal,
  FormModalField,
  formInputClass,
} from "@/components/ui/FormModal";

// Local date (YYYY-MM-DD). toISOString() would give the UTC date, which is
// yesterday for part of the morning in Nepal.
const getTodayLocal = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const schema = z.object({
  date: z
    .string()
    .min(1, "Please select a new date")
    .refine((value) => value >= getTodayLocal(), "Date cannot be in the past"),
  start_time: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PostponeModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSubmit: (
    id: string,
    date: string | null,
    start_time: string | null,
  ) => void | Promise<void>;
}

export default function PostponeModal({
  open,
  onClose,
  interview,
  onSubmit,
}: PostponeModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "", start_time: "" },
  });

  useEffect(() => {
    if (open) reset({ date: "", start_time: "" });
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    if (!interview) return;
    await onSubmit(interview.id, values.date, values.start_time || null);
  });

  return (
    <FormModal
      open={open}
      icon="mdi:calendar-clock-outline"
      tone="warning"
      title="Postpone Interview"
      subtitle={
        interview?.guest
          ? `Interview with ${interview.guest.full_name}`
          : undefined
      }
      loading={isSubmitting}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormModalField
        label="New Interview Date"
        htmlFor="postpone_date"
        error={errors.date?.message}
      >
        <input
          id="postpone_date"
          type="date"
          autoFocus
          min={getTodayLocal()}
          className={formInputClass(!!errors.date)}
          {...register("date")}
        />
      </FormModalField>

      <FormModalField
        label="Start Time (optional)"
        htmlFor="postpone_time"
        error={errors.start_time?.message}
      >
        <input
          id="postpone_time"
          type="time"
          className={formInputClass(!!errors.start_time)}
          {...register("start_time")}
        />
      </FormModalField>
    </FormModal>
  );
}
