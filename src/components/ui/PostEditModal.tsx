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

const schema = z.object({
  drive_link: z
    .string()
    .trim()
    .min(1, "Please enter Google Drive link")
    .url("Enter a valid link, e.g. https://drive.google.com/..."),
});

type FormValues = z.infer<typeof schema>;

interface PostEditModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSubmit: (id: string, drive_link: string) => void | Promise<void>;
}

export default function PostEditModal({
  open,
  onClose,
  interview,
  onSubmit,
}: PostEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { drive_link: "" },
  });

  useEffect(() => {
    if (open) reset({ drive_link: interview?.google_drive_link ?? "" });
  }, [open, interview, reset]);

  const submit = handleSubmit(async (values) => {
    if (!interview) return;
    await onSubmit(interview.id, values.drive_link);
  });

  return (
    <FormModal
      open={open}
      icon="mdi:movie-edit-outline"
      tone="primary"
      title="Mark as Edited"
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
        label="Google Drive Link"
        htmlFor="drive_link"
        error={errors.drive_link?.message}
      >
        <input
          id="drive_link"
          type="url"
          autoFocus
          placeholder="https://drive.google.com/..."
          className={formInputClass(!!errors.drive_link)}
          {...register("drive_link")}
        />
      </FormModalField>
    </FormModal>
  );
}
