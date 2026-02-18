"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

import { getInterviews, deleteInterview, Interview } from "@/lib/api/interview";

import { DeleteModal } from "@/components/ui/DeleteModal";
import { AddButton } from "@/components/ui/AddButton";

export default function InterviewsPage() {
  const router = useRouter();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(
    null,
  );

  /**
   * Convert 24-hour time (HH:mm or HH:mm:ss) to 12-hour AM/PM
   */
  const formatTimeTo12Hour = (time?: string | null) => {
    if (!time) return "-";

    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12; // 0 becomes 12

    return `${hour}:${minuteStr} ${ampm}`;
  };

  /**
   * Interview Status Badge Colors
   */
  const getInterviewStatusClass = (status?: string | null) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  /**
   * Live Status Badge Colors
   */
  const getLiveStatusClass = (status?: string | null) => {
    switch (status) {
      case "live":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "recorded":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "not_live":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  /**
   * ------------------------------
   * Fetch Interviews
   * ------------------------------
   */
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const data = await getInterviews();
      setInterviews(data ?? []);
    } catch {
      toast.error("Failed to load interviews");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  /**
   * ------------------------------
   * Search Filter
   * ------------------------------
   */
  const filteredInterviews = useMemo(() => {
    if (!search.trim()) return interviews;

    const q = search.toLowerCase();

    return interviews.filter(
      (i) =>
        i.guest?.full_name.toLowerCase().includes(q) ||
        i.host?.full_name.toLowerCase().includes(q) ||
        i.interview_status?.toLowerCase().includes(q) ||
        i.live_status?.toLowerCase().includes(q),
    );
  }, [interviews, search]);

  /**
   * ------------------------------
   * Actions
   * ------------------------------
   */
  const handleEditClick = (interview: Interview) => {
    router.push(`/dashboard/interview/edit/${interview.id}`);
  };

  const handleDeleteClick = (interview: Interview) => {
    setInterviewToDelete(interview);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setInterviewToDelete(null);
  };

  const handleDeleteConfirm = async (interview: Interview) => {
    try {
      await deleteInterview(interview.id);
      toast.success("Interview deleted successfully");
      fetchInterviews();
    } catch {
      toast.error("Failed to delete interview");
    } finally {
      handleDeleteClose();
    }
  };

  /**
   * ------------------------------
   * Loading State
   * ------------------------------
   */
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Interviews
        </h2>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Interviews
        </h2>
        <AddButton href="/dashboard/interview/add" label="Schedule Interview" />
      </div>

      {/* Search + Table */}
      <Card className="shadow-sm bg-white border-none py-5">
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by guest, host, status..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          {filteredInterviews.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
              {search.trim()
                ? "No interviews match your search"
                : "No interviews found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Guest
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Host
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Start
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      End
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Interview Status
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Live Status
                    </th>
                    <th className="text-right text-sm py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((interview) => (
                    <tr
                      key={interview.id}
                      className="border-b text-xs border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-xs text-gray-900 dark:text-gray-100">
                        {interview.guest?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {interview.host?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {interview.interview_date}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {formatTimeTo12Hour(interview.start_time)}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {formatTimeTo12Hour(interview.end_time)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getInterviewStatusClass(
                            interview.interview_status,
                          )}`}
                        >
                          {interview.interview_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getLiveStatusClass(
                            interview.live_status,
                          )}`}
                        >
                          {interview.live_status?.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(interview)}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="text-xl" />
                          </button>

                          <button
                            onClick={() => handleDeleteClick(interview)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Icon icon="mdi:delete" className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <DeleteModal<Interview>
        open={deleteModalOpen}
        item={interviewToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
