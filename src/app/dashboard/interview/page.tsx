"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

import {
  getInterviews,
  deleteInterview,
  reorderInterviews,
  Interview,
} from "@/lib/api/interview";

import { DeleteModal } from "@/components/ui/DeleteModal";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";
import SortableItem from "@/components/sortable/SortableItem";
import SortableList from "@/components/sortable/SortableList";
import { listeners } from "process";

export default function InterviewsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const canAddInterview = hasPermission("interview.create");
  const canEditInterview = hasPermission("interview.update");
  const canDeleteInterview = hasPermission("interview.delete");

  const ITEMS_PER_PAGE = 10;

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
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleReorder = async (items: Interview[]) => {
    try {
      const orderedIds = items.map((i) => i.id);
      await reorderInterviews(orderedIds);
    } catch {
      toast.error("Failed to update order");
      throw new Error("Reorder failed");
    }
  };

  /**
   * Live Status Badge Colors
   */
  const getLiveStatusClass = (status?: string | null) => {
    switch (status) {
      case "live":
        return "bg-red-100 text-red-700";
      case "recorded":
        return "bg-purple-100 text-purple-700";
      case "not_live":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  const totalPages = Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE);

  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredInterviews, currentPage, totalPages]);

  /**
   * ------------------------------
   * Loading State
   * ------------------------------
   */
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Interviews</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Interviews</h2>
        {canAddInterview && (
          <AddButton
            href="/dashboard/interview/add"
            label="Schedule Interview"
          />
        )}
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
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          {filteredInterviews.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">
              {search.trim()
                ? "No interviews match your search"
                : "No interviews found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      Guest
                    </th>

                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      Host
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      Interview Time
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      End
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      Interview Status
                    </th>
                    <th className="text-left text-sm py-3 px-4 font-medium text-gray-700">
                      Live Status
                    </th>
                    <th className="text-right text-sm py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="p-0">
                      <SortableList
                        items={paginatedInterviews}
                        getId={(i) => i.id}
                        onChange={(newItems) => {
                          // update only current page slice
                          const start = (currentPage - 1) * ITEMS_PER_PAGE;
                          const updated = [...interviews];
                          updated.splice(start, newItems.length, ...newItems);
                          setInterviews(updated);
                        }}
                        onReorder={handleReorder}
                      >
                        {(interview) => (
                          <SortableItem id={interview.id}>
                            <div className="grid grid-cols-8 items-center border-b text-xs border-gray-100 hover:bg-gray-50/50">
                              <div className="py-3 px-4 text-gray-900">
                                {interview.guest?.full_name ?? "-"}
                              </div>
                              <div className="py-3 px-4 text-gray-600">
                                {interview.host?.full_name ?? "-"}
                              </div>
                              <div className="py-3 px-4 text-gray-600">
                                {interview.interview_date}
                              </div>
                              <div className="py-3 px-4 text-gray-600">
                                {formatTimeTo12Hour(interview.start_time)}
                              </div>
                              <div className="py-3 px-4 text-gray-600">
                                {formatTimeTo12Hour(interview.end_time)}
                              </div>
                              <div className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getInterviewStatusClass(
                                    interview.interview_status,
                                  )}`}
                                >
                                  {interview.interview_status}
                                </span>
                              </div>
                              <div className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getLiveStatusClass(
                                    interview.live_status,
                                  )}`}
                                >
                                  {interview.live_status?.replace("_", " ")}
                                </span>
                              </div>
                              <div className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {canEditInterview && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(interview);
                                      }}
                                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <Icon
                                        icon="mdi:pencil"
                                        className="text-xl"
                                      />
                                    </button>
                                  )}

                                  {canDeleteInterview && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(interview);
                                      }}
                                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Icon
                                        icon="mdi:delete"
                                        className="text-xl"
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </SortableItem>
                        )}
                      </SortableList>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
