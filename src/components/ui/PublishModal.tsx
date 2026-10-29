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

function isYoutubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^(www\.|m\.)/, "");
    return host === "youtube.com" || host === "youtu.be";
  } catch {
    return false;
  }
}

function normalizeYoutubeUrl(url: string): string {
  try {
    const u = new URL(url);

    // handle embed link
    if (u.hostname.includes("youtube.com") && u.pathname.includes("/embed/")) {
      const videoId = u.pathname.split("/embed/")[1];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // handle youtu.be short link
    if (u.hostname === "youtu.be") {
      const videoId = u.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return url;
  } catch {
    return url;
  }
}

const schema = z.object({
  youtube_link: z
    .string()
    .trim()
    .min(1, "Please enter YouTube link")
    .url("Enter a valid link, e.g. https://youtube.com/...")
    .refine(isYoutubeUrl, "Enter a valid YouTube link"),
});

type FormValues = z.infer<typeof schema>;

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSubmit: (id: string, youtube_link: string) => void | Promise<void>;
}

export default function PublishModal({
  open,
  onClose,
  interview,
  onSubmit,
}: PublishModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { youtube_link: "" },
  });

  useEffect(() => {
    if (open) reset({ youtube_link: interview?.youtube_link ?? "" });
  }, [open, interview, reset]);

  const submit = handleSubmit(async (values) => {
    if (!interview) return;
    await onSubmit(interview.id, normalizeYoutubeUrl(values.youtube_link));
  });

  return (
    <FormModal
      open={open}
      icon="mdi:publish"
      tone="success"
      title="Publish Interview"
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
        label="YouTube Link"
        htmlFor="youtube_link"
        error={errors.youtube_link?.message}
      >
        <input
          id="youtube_link"
          type="url"
          autoFocus
          placeholder="https://youtube.com/..."
          className={formInputClass(!!errors.youtube_link)}
          {...register("youtube_link")}
        />
      </FormModalField>
    </FormModal>
  );
}
