import api from "@/lib/axios";

/**
 * --------------------------------
 * TYPES
 * --------------------------------
 */

export interface GuestNote {
  id: string;

  guest_id: string;

  title: string;
  description?: string | null;

  created_by?: string | null;
  updated_by?: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * GET NOTES BY GUEST
 * --------------------------------
 */

export const getGuestNotesByGuest = async (
  guestId: string,
): Promise<GuestNote[]> => {
  const response = await api.get(`/guest_notes/guest/${guestId}`);
  return response.data.data ?? [];
};

/**
 * --------------------------------
 * CREATE NOTE
 * --------------------------------
 */

export const createGuestNote = async (payload: {
  guest_id: string;
  title: string;
  description?: string | null;
}): Promise<GuestNote> => {
  const response = await api.post("/guest_notes", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE NOTE
 * --------------------------------
 */

export const updateGuestNote = async (
  noteId: string,
  payload: {
    title?: string;
    description?: string | null;
  },
): Promise<GuestNote> => {
  const response = await api.patch(`/guest_notes/${noteId}`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data.data;
};

/**
 * --------------------------------
 * DELETE NOTE
 * --------------------------------
 */

export const deleteGuestNote = async (noteId: string): Promise<void> => {
  await api.delete(`/guest_notes/${noteId}`);
};
