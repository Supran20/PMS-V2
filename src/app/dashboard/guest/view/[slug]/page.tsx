"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { getGuestBySlug, Guest, updateGuestBySlug } from "@/lib/api/guest";
import {
  getGuestNotesByGuest,
  createGuestNote,
  updateGuestNote,
  deleteGuestNote,
  GuestNote,
} from "@/lib/api/guest_note";

import { getMediaUrl } from "@/lib/utils";
import { getInterviews, Interview } from "@/lib/api/interview";
import { AddButton } from "@/components/ui/AddButton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionActions from "@mui/material/AccordionActions";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";

import { FormField } from "@/components/ui/FormField";

interface NoteForm {
  title: string;
  description?: string | null;
}

export default function GuestViewPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { hasPermission } = useAuth();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState({
    title: "",
    description: "",
  });
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [editingNote, setEditingNote] = useState<NoteForm>({
    title: "",
    description: "",
  });
  const canAddInterview = hasPermission("interview.create");
  const canSchedule = canAddInterview && guest?.approved && !guest?.rejected;
  const isDisabled = !canSchedule;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const guestData = await getGuestBySlug(slug);
        setGuest(guestData);
        const guestNotes = await getGuestNotesByGuest(guestData.id);
        setNotes(guestNotes);

        const allInterviews = await getInterviews();
        const filtered = allInterviews.filter(
          (i) => i.guest_id === guestData.id,
        );
        setInterviews(filtered);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const formatTimeTo12Hour = (time?: string | null) => {
    if (!time) return "-";
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minuteStr} ${ampm}`;
  };

  const getStatusClass = (status?: string | null) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";

      case "postponed":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "recorded":
        return "bg-purple-100 text-purple-700";

      case "editing":
        return "bg-orange-100 text-orange-700";

      case "post_editing":
        return "bg-indigo-100 text-indigo-700";

      case "published":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDisplayStatus = (status?: string | null) => {
    if (!status) return "-";

    const map: Record<string, string> = {
      editing: "Edited",
      post_editing: "Post Editing",
      scheduled: "Scheduled",
      postponed: "Postponed",
      cancelled: "Cancelled",
      recorded: "Recorded",
      published: "Published",
    };

    return map[status] ?? status;
  };

  const handleAddNote = async () => {
    if (!guest) return;
    if (!newNote.title.trim()) return;

    setSavingNote(true);

    try {
      const created = await createGuestNote({
        guest_id: guest.id,
        title: newNote.title,
        description: newNote.description,
      });

      const guestNotes = await getGuestNotesByGuest(guest.id);
      setNotes(guestNotes);

      setNewNote({
        title: "",
        description: "",
      });

      toast.success("Note added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setSavingNote(true);

    try {
      await deleteGuestNote(noteId);

      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      toast.success("Note deleted successfully");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setSavingNote(false);
    }
  };

  // const handleEditNote = (index: number) => {
  //   setEditingIndex(index);
  //   setEditingNote(notes[index]);
  // };

  const handleEditStart = (note: GuestNote) => {
    setEditingNoteId(note.id);
    setEditingNote({
      title: note.title,
      description: note.description,
    });
  };

  const handleSaveNote = async () => {
    if (!editingNoteId) return;

    setSavingNote(true);

    try {
      const updated = await updateGuestNote(editingNoteId, editingNote);

      setNotes((prev) =>
        prev.map((n) => (n.id === editingNoteId ? updated : n)),
      );

      setEditingNoteId(null);
      toast.success("Note updated successfully");
    } catch {
      toast.error("Failed to update note");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="text-center py-24 text-gray-600">Guest not found</div>
    );
  }

  const profileImage =
    guest.profileImage?.path && guest.profileImage.type?.startsWith("image/")
      ? getMediaUrl(guest.profileImage.path)
      : null;
  const social = guest.social_media || {};

  return (
    <div className="max-w-7xl mx-auto px-2 py-6">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Guest Details</h2>
        {canAddInterview && (
          <AddButton
            href={`/dashboard/interview/add?guest_id=${guest.id}`}
            label="Schedule Interview"
            disabled={isDisabled}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation(); // 🔥 VERY IMPORTANT
                toast.error("Guest must be approved and not rejected");
              }
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 1/3 PROFILE */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-50 shadow-sm p-6 space-y-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={guest.full_name}
                  className="w-40 h-40 rounded-full object-cover border"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center">
                  <Icon icon="mdi:account" className="text-6xl text-gray-500" />
                </div>
              )}
              <h1 className="mt-4 text-xl font-semibold text-gray-900">
                {guest.full_name}
              </h1>
              {guest.designation && (
                <p className="text-sm text-gray-500 mt-1">
                  {guest.designation}
                </p>
              )}
            </div>

            {guest.bio && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {guest.bio}
                </p>
              </div>
            )}

            {/* Contact */}
            <div className="space-y-3 text-sm">
              {guest.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon icon="mdi:email-outline" />
                  <span>{guest.email}</span>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon icon="mdi:phone-outline" />
                  <span>{guest.phone}</span>
                </div>
              )}
              {guest.referrer && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon icon="mdi:account-multiple-outline" />
                  <span>Referred by: {guest.referrer.full_name}</span>
                </div>
              )}
              {guest.approver && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon icon="mdi:shield-check-outline" />
                  <span>Approved by: {guest.approver.full_name}</span>
                </div>
              )}
            </div>

            {/* Social */}
            {(social.linkedin ||
              social.github ||
              social.instagram ||
              social.facebook) && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Social Media
                </h3>
                <div className="flex gap-4">
                  {social.linkedin && (
                    <a
                      href={social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Icon icon="mdi:linkedin" className="text-xl" />
                    </a>
                  )}
                  {social.github && (
                    <a
                      href={social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-black"
                    >
                      <Icon icon="mdi:github" className="text-xl" />
                    </a>
                  )}
                  {social.instagram && (
                    <a
                      href={social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-pink-500"
                    >
                      <Icon icon="mdi:instagram" className="text-xl" />
                    </a>
                  )}
                  {social.facebook && (
                    <a
                      href={social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-700"
                    >
                      <Icon icon="mdi:facebook" className="text-xl" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 2/3: Tabs */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
            >
              <Tab label="Interview History" />
              <Tab label="Notes" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {tabValue == 0 && (
            <div className="bg-white rounded-lg border border-gray-50 shadow-sm p-4">
              {interviews.length === 0 ? (
                <p className="text-sm text-gray-500 mt-4">
                  No interviews found for this guest.
                </p>
              ) : (
                <div className="overflow-x-auto ">
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-5 gap-4 bg-gray-100 text-xs uppercase tracking-wider px-6 py-4 font-medium text-gray-600">
                      <div className="text-center text-xs capitalize  font-medium text-gray-700">
                        Host
                      </div>
                      <div className="text-center text-xs capitalize  font-medium text-gray-700">
                        Date
                      </div>
                      <div className="text-center text-xs capitalize  font-medium text-gray-700">
                        Start
                      </div>
                      <div className="text-center text-xs capitalize  font-medium text-gray-700">
                        End
                      </div>
                      <div className="text-center text-xs capitalize  font-medium text-gray-700">
                        Status
                      </div>
                    </div>

                    {interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="grid grid-cols-5 gap-4 px-6 py-5 items-center border-t hover:bg-gray-50 transition"
                      >
                        <div className="text-xs text-center text-gray-700 ">
                          {interview.host?.full_name ?? "-"}
                        </div>
                        <div className="text-xs text-center text-gray-600">
                          {interview.interview_date}
                        </div>
                        <div className="text-xs text-center text-gray-600 ">
                          {formatTimeTo12Hour(interview.start_time)}
                        </div>
                        <div className="text-xs text-center text-gray-600">
                          {formatTimeTo12Hour(interview.end_time)}
                        </div>
                        <div className="text-center">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${getStatusClass(
                              interview.status,
                            )}`}
                          >
                            {getDisplayStatus(interview.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tabValue === 1 && (
            <div className="bg-white rounded-lg border border-gray-50 shadow-sm p-4">
              {/* Add Note */}
              <div className="flex flex-col gap-3 mb-4">
                <FormField label="Title" required>
                  <input
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote({ ...newNote, title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm  rounded-md border border-gray-300 
              bg-gray-50 text-gray-800
              focus:border-gray-300 focus:outline-0"
                    placeholder="Enter title..."
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    rows={3}
                    value={newNote.description || ""}
                    onChange={(e) =>
                      setNewNote({
                        ...newNote,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 
              bg-gray-50 text-gray-800
              focus:border-gray-300 focus:outline-0"
                    placeholder="Enter description..."
                  />
                </FormField>

                <button
                  onClick={handleAddNote}
                  disabled={savingNote}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Add Note"}
                </button>
              </div>

              {/* Notes List */}
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes found.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <Accordion key={note.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={500}>{note.title}</Typography>
                      </AccordionSummary>

                      <AccordionDetails>
                        {editingNoteId === note.id ? (
                          <div className="flex flex-col gap-3">
                            <input
                              value={editingNote.title}
                              onChange={(e) =>
                                setEditingNote({
                                  ...editingNote,
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 
              bg-gray-50 text-gray-800
              focus:border-gray-300 focus:outline-0"
                            />

                            <textarea
                              rows={3}
                              value={editingNote.description || ""}
                              onChange={(e) =>
                                setEditingNote({
                                  ...editingNote,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 
              bg-gray-50 text-gray-800
              focus:border-gray-300 focus:outline-0"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Typography
                              sx={{
                                whiteSpace: "pre-line",
                                fontSize: "14px",
                                color: "#4b5563",
                              }}
                            >
                              {note.description || "No description"}
                            </Typography>
                          </div>
                        )}
                      </AccordionDetails>

                      <AccordionActions className="flex justify-between px-4 items-center  pb-3">
                        {/* LEFT SIDE (Metadata) */}
                        <div className="text-xs flex-1 text-gray-500 flex gap-4">
                          <div>
                            Created by:{" "}
                            <span className="font-medium">
                              {note.creator?.full_name}
                            </span>
                          </div>

                          <div>
                            Updated by:{" "}
                            <span className="font-medium">
                              {note.updater?.full_name}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT SIDE (Buttons) */}
                        <div className="flex gap-2">
                          {editingNoteId === note.id ? (
                            <>
                              <Button
                                size="small"
                                onClick={handleSaveNote}
                                disabled={savingNote}
                              >
                                Save
                              </Button>

                              <Button
                                size="small"
                                onClick={() => setEditingNoteId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="small"
                                onClick={() => handleEditStart(note)}
                              >
                                Edit
                              </Button>

                              <Button
                                color="error"
                                size="small"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </AccordionActions>
                    </Accordion>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
