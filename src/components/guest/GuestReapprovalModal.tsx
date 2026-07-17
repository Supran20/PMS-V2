"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  createReapprovalRequest,
  type ReapprovalTriggerSource,
  type GuestReapprovalRequest,
} from "@/lib/api/guestReapproval";

interface GuestReapprovalModalProps {
  open: boolean;
  onClose: () => void;
  triggerSource: ReapprovalTriggerSource;
  guestId: string;
  guestName?: string;
  /** Host to assign if/when this request is approved (nullable — e.g. Staff/Admin with no host picked yet) */
  proposedHostId?: string | null;
  /** Set when the backend already found an open request (…_PENDING codes) — skips straight to the pending state */
  reapprovalRequestId?: string | null;
  onRequested?: (request: GuestReapprovalRequest) => void;
}

type ModalStep = "confirm" | "pending" | "submitted";

type CopyConfig = {
  title: string;
  icon: string;
  confirmLabel: string;
  found: (name: string) => string;
  pending: (name: string) => string;
  submitted: (name: string) => string;
};

const COPY: Record<ReapprovalTriggerSource, CopyConfig> = {
  duplicate_guest_attempt: {
    title: "Guest already exists",
    icon: "solar:user-block-rounded-bold-duotone",
    confirmLabel: "Request Access",
    found: (name) =>
      `A guest matching this email or phone number ("${name}") already exists. You can request access so it becomes visible to you once approved.`,
    pending: (name) =>
      `A guest matching this email or phone ("${name}") already exists, and a request to access it is already under review.`,
    submitted: (name) =>
      `Your request to access "${name}" has been sent for review. You'll be notified once it's approved.`,
  },
  repeat_booking: {
    title: "Guest requires re-approval",
    icon: "solar:calendar-mark-bold-duotone",
    confirmLabel: "Request Re-approval",
    found: (name) =>
      `"${name}" has a prior published interview and needs re-approval before being booked again.`,
    pending: (name) =>
      `"${name}" requires re-approval before being booked again, and a request is already under review.`,
    submitted: (name) =>
      `Your re-approval request for "${name}" has been sent for review. You'll be notified once it's approved.`,
  },
};

export default function GuestReapprovalModal({
  open,
  onClose,
  triggerSource,
  guestId,
  guestName = "this guest",
  proposedHostId = null,
  reapprovalRequestId = null,
  onRequested,
}: GuestReapprovalModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<ModalStep>(
    reapprovalRequestId ? "pending" : "confirm",
  );

  const copy = COPY[triggerSource];

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const request = await createReapprovalRequest({
        guest_id: guestId,
        proposed_host_id: proposedHostId,
        trigger_source: triggerSource,
      });
      setStep("submitted");
      onRequested?.(request);
    } catch (err) {
      const error = err as unknown as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        error?.response?.data?.message ??
          "Failed to send the request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <Icon icon={copy.icon} width={24} className="text-amber-500" />
        {copy.title}
      </DialogTitle>

      <DialogContent>
        {step === "confirm" && (
          <Alert severity="warning" variant="outlined">
            {copy.found(guestName)}
          </Alert>
        )}
        {step === "pending" && (
          <Alert severity="info" variant="outlined">
            {copy.pending(guestName)}
          </Alert>
        )}
        {step === "submitted" && (
          <Alert severity="success" variant="outlined">
            {copy.submitted(guestName)}
          </Alert>
        )}
      </DialogContent>

      <DialogActions className="px-6 pb-4">
        {step === "confirm" ? (
          <>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} /> : null}
            >
              {copy.confirmLabel}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained">
            Got it
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
