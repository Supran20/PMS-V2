"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import FilterInterviewModal from "@/components/ui/FilterInterviewModal";

import {
  getInterviews,
  deleteInterview,
  updateInterview,
  reorderInterviews,
  Interview,
} from "@/lib/api/interview";

import { getGuests } from "@/lib/api/guest";

import { getHostUser } from "@/lib/api/user";

import { DeleteModal } from "@/components/ui/DeleteModal";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";
import SortableItem from "@/components/sortable/SortableItem";
import SortableList from "@/components/sortable/SortableList";

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
  const [tabValue, setTabValue] = useState(0);

  const canAddInterview = hasPermission("interview.create");
  const canEditInterview = hasPermission("interview.update");
  const canDeleteInterview = hasPermission("interview.delete");

  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guests, setGuests] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">(
    "down",
  );
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [interviewToPostpone, setInterviewToPostpone] =
    useState<Interview | null>(null);

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
   * Status Badge Colors
   */
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const today = new Date().toISOString().split("T")[0];

  const todayInterviews = useMemo(
    () =>
      interviews.filter((i) => i.interview_date && i.interview_date === today),
    [interviews, today],
  );

  const upcomingInterviews = useMemo(
    () =>
      interviews.filter((i) => i.interview_date && i.interview_date > today),
    [interviews, today],
  );

  const tabInterviews = useMemo(() => {
    if (tabValue === 0) return interviews;
    if (tabValue === 1) return upcomingInterviews;
    return todayInterviews;
  }, [tabValue, todayInterviews, upcomingInterviews, interviews]);

  const handleReorder = async (items: Interview[]) => {
    try {
      const orderedIds = items.map((i) => i.id);
      await reorderInterviews(orderedIds);
    } catch {
      toast.error("Failed to update order");
      throw new Error("Reorder failed");
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterOpen(false);
      }
    };

    if (filterOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [filterOpen]);

  useEffect(() => {
    const fetchData = async () => {
      const g = await getGuests();
      const h = await getHostUser();

      setGuests(g);
      setHosts(h);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenStatusId(null);
      setHoveredSubmenu(null);
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleApplyFilters = (filters: any) => {
    setSelectedGuests(filters.guests ?? []);
    setSelectedHosts(filters.hosts ?? []);
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
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
    let data = tabInterviews;

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter(
        (i) =>
          i.guest?.full_name.toLowerCase().includes(q) ||
          i.host?.full_name.toLowerCase().includes(q) ||
          i.status?.toLowerCase().includes(q),
      );
    }

    if (selectedGuests.length > 0) {
      data = data.filter((i) => i.guest && selectedGuests.includes(i.guest.id));
    }

    if (selectedHosts.length > 0) {
      data = data.filter((i) => i.host && selectedHosts.includes(i.host.id));
    }

    if (dateFrom) {
      data = data.filter(
        (i) => i.interview_date && i.interview_date >= dateFrom,
      );
    }

    if (dateTo) {
      data = data.filter((i) => i.interview_date && i.interview_date <= dateTo);
    }

    return data;
  }, [tabInterviews, search, selectedGuests, selectedHosts, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGuests, selectedHosts, dateFrom, dateTo]);

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

  const handleStatusChange = async (id: string, value: Interview["status"]) => {
    try {
      setInterviews((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: value } : i)),
      );

      await updateInterview(id, { status: value });

      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
      fetchInterviews();
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

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="interview tabs"
        >
          <Tab label="All Interviews" />
          <Tab label="Upcoming" />
          <Tab label="Today" />
        </Tabs>
      </Box>

      {/* Search + Table */}
      <Card className="shadow-sm bg-white border-none py-5">
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex gap-3 items-center justify-between">
            <div className="relative max-w-sm">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-0 focus:border-gray-300 "
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="px-4 py-2 text-gray-600 text-md bg-gray-50 border border-gray-300 cursor-pointer hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <Icon icon="mdi:filter-variant" className="text-lg" />
              Filter
            </button>
          </div>

          {/* Table */}
          {filteredInterviews.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">
              {search.trim()
                ? "No interviews match your search"
                : "No interviews found"}
            </p>
          ) : (
            <div className=" ">
              <div>
                <div className="bg-white rounded-xl shadow-sm overflow-visible">
                  <div className="grid grid-cols-6 gap-4 bg-gray-100 text-gray-600 text-xs uppercase tracking-wider px-6 py-4 font-medium">
                    <div className="text-left  text-vxs font-medium text-gray-700">
                      Guest
                    </div>
                    <div className="text-center text-vxs  font-medium text-gray-700">
                      Host
                    </div>
                    <div className="text-center text-vxs  font-medium  text-gray-700">
                      Date
                    </div>
                    <div className="text-center text-vxs  font-medium text-gray-700">
                      Interview Time
                    </div>

                    <div className="text-center text-vxs  font-medium text-gray-700">
                      Status
                    </div>

                    <div className="text-left text-vxs  font-medium text-gray-700">
                      Actions
                    </div>
                  </div>
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
                        <div className="grid grid-cols-6 gap-4 px-6 py-5 items-center border-t hover:bg-gray-50 transition">
                          <div className="text-vxs text-gray-600">
                            {interview.guest ? (
                              <Link
                                href={`/dashboard/guest/view/${interview.guest.slug}`}
                                className=" hover:text-blue-600  text-center transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {interview.guest.full_name}
                              </Link>
                            ) : (
                              "-"
                            )}
                          </div>
                          <div className=" text-vxs  text-gray-600">
                            {interview.host?.full_name ?? "-"}
                          </div>
                          <div className=" text-vxs text-gray-600 text-center">
                            {" "}
                            {interview.interview_date ?? "-"}
                          </div>
                          <div className=" text-vxs text-gray-600 text-center">
                            {formatTimeTo12Hour(interview.start_time)}
                          </div>

                          <div className="text-center">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${getStatusClass(
                                interview.status,
                              )}`}
                            >
                              {interview.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="">
                            <div className="flex items-center justify-start gap-2">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    const rect = (
                                      e.currentTarget as HTMLElement
                                    ).getBoundingClientRect();
                                    const spaceBelow =
                                      window.innerHeight - rect.bottom;

                                    if (spaceBelow < 230) {
                                      setDropdownDirection("up");
                                    } else {
                                      setDropdownDirection("down");
                                    }

                                    setOpenStatusId((prev) =>
                                      prev === interview.id
                                        ? null
                                        : interview.id,
                                    );
                                  }}
                                  className="rounded-lg text-gray-600 hover:bg-gray-100 transition-colors p-1"
                                >
                                  <Icon
                                    icon="mdi:progress-clock"
                                    className="text-xl"
                                  />
                                </button>

                                {openStatusId === interview.id && (
                                  <div
                                    className={`absolute right-0 bg-white border rounded-lg shadow-lg z-[100] w-40 overflow-visible ${
                                      dropdownDirection === "down"
                                        ? "mt-2 top-full"
                                        : "bottom-full mb-2"
                                    }`}
                                  >
                                    {[
                                      "scheduled",
                                      "recorded",
                                      "editing",
                                      "post_editing",
                                      "published",
                                    ].map((status) => {
                                      return (
                                        <div
                                          key={status}
                                          className="relative"
                                          onMouseEnter={() =>
                                            setHoveredSubmenu(status)
                                          }
                                          onMouseLeave={() =>
                                            setHoveredSubmenu(null)
                                          }
                                        >
                                          <button
                                            onClick={() => {
                                              if (status !== "") {
                                                handleStatusChange(
                                                  interview.id,
                                                  status as Interview["status"],
                                                );
                                                setOpenStatusId(null);
                                              }
                                            }}
                                            className="flex justify-between items-center w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize"
                                          >
                                            {status.replace("_", " ")}

                                            {status === "scheduled" && (
                                              <Icon
                                                icon="mdi:chevron-right"
                                                className="text-gray-400"
                                              />
                                            )}
                                          </button>

                                          {status === "scheduled" &&
                                            hoveredSubmenu === "scheduled" && (
                                              <div className="absolute top-0 left-full ml-1 bg-white border rounded-lg shadow-lg w-40 z-[200]">
                                                {["postponed", "cancelled"].map(
                                                  (subStatus) => (
                                                    <button
                                                      key={subStatus}
                                                      onClick={() => {
                                                        handleStatusChange(
                                                          interview.id,
                                                          subStatus as Interview["status"],
                                                        );
                                                        setOpenStatusId(null);
                                                      }}
                                                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize"
                                                    >
                                                      {subStatus}
                                                    </button>
                                                  ),
                                                )}
                                              </div>
                                            )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              {canEditInterview && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(interview);
                                  }}
                                  className=" rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <Icon icon="mdi:pencil" className="text-xl" />
                                </button>
                              )}

                              {canDeleteInterview && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(interview);
                                  }}
                                  className=" rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Icon icon="mdi:delete" className="text-xl" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </SortableItem>
                    )}
                  </SortableList>
                </div>
              </div>
              <br />
              {/* <hr /> */}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <FilterInterviewModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        guests={guests}
        hosts={hosts}
        selectedGuests={selectedGuests}
        selectedHosts={selectedHosts}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onApply={handleApplyFilters}
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
