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
import PostponeModal from "@/components/ui/PostPoneModal";
import PublishModal from "@/components/ui/PublishModal";
import PostEditModal from "@/components/ui/PostEditModal";
import { getInitials } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getMediaUrl } from "@/lib/utils";

import { getInterviews, updateInterview, Interview } from "@/lib/api/interview";

import { getGuests } from "@/lib/api/guest";

import { getHostUser } from "@/lib/api/user";

import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";

import { useSearchParams } from "next/navigation";
import { useInterview } from "@/context/InterviewContext";

export default function InterviewsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const { interviews, setInterviews } = useInterview();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);

  const canAddInterview = hasPermission("interview.create");
  const canEditInterview = hasPermission("interview.update");

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
  const [postEditModalOpen, setPostEditModalOpen] = useState(false);
  const [interviewToPostEdit, setInterviewToPostEdit] =
    useState<Interview | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [interviewToPublish, setInterviewToPublish] =
    useState<Interview | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const tabParam = searchParams.get("tab");
  const showTabs = !statusParam;

  useEffect(() => {
    if (!tabParam) return;

    if (tabParam === "upcoming") setTabValue(1);
    else if (tabParam === "today") setTabValue(2);
    else setTabValue(0);
  }, [tabParam]);

  const getPageTitle = () => {
    if (!statusParam) return "Interviews";

    const map: Record<string, string> = {
      scheduled: "Scheduled",
      recorded: "Recorded",
      editing: "Edited",
      post_editing: "Post Editing",
      published: "Published",
      postponed: "Postponed",
      cancelled: "Cancelled",
    };

    return `Interviews : ${map[statusParam] || statusParam}`;
  };

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

  //Modal Opening

  const handlePostponeClick = (interview: Interview) => {
    setInterviewToPostpone(interview);
    setPostponeModalOpen(true);
  };

  const handlePostEditClick = (interview: Interview) => {
    setInterviewToPostEdit(interview);
    setPostEditModalOpen(true);
  };

  const handlePublishClick = (interview: Interview) => {
    setInterviewToPublish(interview);
    setPublishModalOpen(true);
  };

  const today = new Date().toISOString().split("T")[0];

  function sortByDateTime(a: Interview, b: Interview) {
    const aDate = new Date(`${a.interview_date}T${a.start_time ?? "00:00"}`);
    const bDate = new Date(`${b.interview_date}T${b.start_time ?? "00:00"}`);

    return aDate.getTime() - bDate.getTime(); // earliest first
  }

  const todayInterviews = useMemo(
    () =>
      interviews
        .filter((i) => i.interview_date && i.interview_date === today)
        .sort(sortByDateTime),
    [interviews, today],
  );

  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter((i) => i.interview_date && i.interview_date > today)
        .sort(sortByDateTime),
    [interviews, today],
  );

  const tabInterviews = useMemo(() => {
    if (statusParam) return interviews;

    if (tabParam === "upcoming") return upcomingInterviews;
    if (tabParam === "today") return todayInterviews;

    if (tabValue === 1) return upcomingInterviews;
    if (tabValue === 2) return todayInterviews;

    return interviews;
  }, [
    statusParam,
    tabParam,
    tabValue,
    todayInterviews,
    upcomingInterviews,
    interviews,
  ]);

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
    setSelectedStatuses(filters.statuses ?? []);
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

    if (selectedStatuses.length > 0) {
      data = data.filter(
        (i) =>
          i.status &&
          selectedStatuses.some(
            (status) => status.toLowerCase() === i.status.toLowerCase(),
          ),
      );
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
  }, [
    tabInterviews,
    search,
    selectedGuests,
    selectedHosts,
    dateFrom,
    dateTo,
    selectedStatuses,
  ]);

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

  useEffect(() => {
    const status = searchParams.get("status");

    if (status) {
      setSelectedStatuses([status]);
    } else {
      setSelectedStatuses([]);
    }
  }, [searchParams]);

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

  const handlePostponeSubmit = async (
    id: string,
    date: string,
    start_time: string,
  ) => {
    try {
      await updateInterview(id, {
        interview_date: date,
        start_time,
        status: "postponed",
      });

      toast.success("Interview updated");

      setPostponeModalOpen(false);
      setInterviewToPostpone(null);

      fetchInterviews();
    } catch {
      toast.error("Failed to update interview");
    }
  };

  const handlePostEditSubmit = async (
    id: string,
    google_drive_link: string,
  ) => {
    try {
      await updateInterview(id, {
        google_drive_link,
        status: "editing",
      });

      toast.success("Drive link updated");

      setPostEditModalOpen(false);
      setInterviewToPostEdit(null);

      fetchInterviews();
    } catch {
      toast.error("Failed to update drive link");
    }
  };

  const getYoutubeWatchUrl = (url: string) => {
    try {
      const u = new URL(url);

      if (
        u.hostname.includes("youtube.com") &&
        u.pathname.includes("/embed/")
      ) {
        const id = u.pathname.split("/embed/")[1];
        return `https://www.youtube.com/watch?v=${id}`;
      }

      if (u.hostname === "youtu.be") {
        return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
      }

      return url;
    } catch {
      return url;
    }
  };

  // fallback profile image

  const handlePublishSubmit = async (id: string, youtube_link: string) => {
    try {
      await updateInterview(id, {
        youtube_link,
        status: "published",
      });

      toast.success("YouTube link updated");

      setPublishModalOpen(false);
      setInterviewToPublish(null);

      fetchInterviews();
    } catch {
      toast.error("Failed to update YouTube link");
    }
  };

  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);

  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
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
        <h2 className="text-xl font-semibold text-gray-900">Interviews </h2>
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
        <h2 className="text-xl font-semibold text-gray-900">
          {getPageTitle()}
        </h2>
        {canAddInterview && (
          <AddButton
            href="/dashboard/interview/add"
            label="Schedule Interview"
          />
        )}
      </div>
      {showTabs && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="interview tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label={`All Interviews(${interviews.length})`} />
            <Tab label={`Upcoming(${upcomingInterviews.length})`} />
            <Tab label={`Today(${todayInterviews.length})`} />
          </Tabs>
        </Box>
      )}
      {/* Search + Table */}
      <Card className="shadow-sm bg-white border-none min-w-[950px] lg:w-auto  px-5 sm:px-0 py-5">
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
              <div className="overflow-visible">
                <div className="bg-white rounded-xl shadow-sm min-w-[900px]">
                  <div className="grid grid-cols-12 lg:grid-cols-12 gap-2 lg:gap-4 bg-gray-100 text-gray-600 text-[12px] lg:text-vxs uppercase tracking-wider px-3 lg:px-6 py-3 lg:py-4 font-medium">
                    <div className="text-left text-vxs font-medium col-span-1 lg:col-span-1 text-gray-700">
                      Episode
                    </div>
                    <div className="text-center   text-vxs col-span-2 font-medium text-gray-700">
                      Guest
                    </div>
                    <div className="text-center text-vxs col-span-2 font-medium text-gray-700">
                      Host
                    </div>
                    <div className="text-center text-vxs col-span-2 font-medium  text-gray-700">
                      Date
                    </div>
                    <div className="text-center text-vxs col-span-1 font-medium text-gray-700">
                      Interview Time
                    </div>

                    <div className="text-center text-vxs col-span-2  font-medium text-gray-700">
                      Status
                    </div>

                    <div className="text-left text-vxs col-span-2  font-medium text-gray-700">
                      Actions
                    </div>
                  </div>
                  <div>
                    {paginatedInterviews.map((interview) => (
                      <div key={interview.id} id={interview.id}>
                        <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center border-t hover:bg-gray-50 transition">
                          {/* Episode */}
                          <div className="text-vxs col-span-1 text-gray-600">
                            #{interview.episode ?? "-"}
                          </div>
                          <div className="text-vxs flex items-center justify-left col-span-2 text-gray-600">
                            {interview.guest ? (
                              <Link
                                href={`/dashboard/guest/view/${interview.guest.slug}`}
                                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Guest Profile Image */}
                                {interview.guest.profileImage?.path ? (
                                  <img
                                    src={getMediaUrl(
                                      interview.guest.profileImage.path,
                                    )}
                                    alt={interview.guest.full_name}
                                    className="w-8 h-8 rounded-full object-cover border"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                    {getInitials(interview.guest.full_name)}
                                  </div>
                                )}

                                {/* Guest Name */}
                                <span>{interview.guest.full_name}</span>
                              </Link>
                            ) : (
                              "-"
                            )}
                          </div>

                          {/* Host Profile Image */}
                          <div className="text-vxs flex items-center justify-left col-span-2 text-gray-600">
                            {interview.host ? (
                              <div className="flex items-center gap-2">
                                {interview.host.profileImage?.path ? (
                                  <img
                                    src={getMediaUrl(
                                      interview.host.profileImage.path,
                                    )}
                                    alt={interview.host.full_name}
                                    className="w-8 h-8 rounded-full object-cover border"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                    {getInitials(interview.host.full_name)}
                                  </div>
                                )}

                                <span>{interview.host.full_name}</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </div>
                          <div className=" text-vxs col-span-2 text-gray-600 text-center">
                            {" "}
                            {formatDate(interview.interview_date)}
                          </div>
                          <div className=" text-vxs col-span-1 text-gray-600 text-center">
                            {formatTimeTo12Hour(interview.start_time)}
                          </div>

                          <div className="text-center col-span-2">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${getStatusClass(
                                interview.status,
                              )}`}
                            >
                              {getDisplayStatus(interview.status)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center justify-start gap-3">
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
                                  className="rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors p-1"
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
                                              if (status === "editing") {
                                                handlePostEditClick(interview);
                                              } else if (
                                                status === "published"
                                              ) {
                                                handlePublishClick(interview);
                                              } else {
                                                handleStatusChange(
                                                  interview.id,
                                                  status as Interview["status"],
                                                );
                                              }

                                              setOpenStatusId(null);
                                            }}
                                            className="flex justify-between items-center w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span>
                                                {getDisplayStatus(status)}
                                              </span>

                                              {interview.status === status && (
                                                <Icon
                                                  icon="mdi:check-circle"
                                                  className="text-green-600 text-sm"
                                                />
                                              )}
                                            </div>

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
                                                        if (
                                                          subStatus ===
                                                          "postponed"
                                                        ) {
                                                          handlePostponeClick(
                                                            interview,
                                                          );
                                                        } else {
                                                          handleStatusChange(
                                                            interview.id,
                                                            "cancelled",
                                                          );
                                                        }

                                                        setOpenStatusId(null);
                                                      }}
                                                      className="flex justify-between items-center w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize"
                                                    >
                                                      {subStatus}
                                                      {interview.status ===
                                                        subStatus && (
                                                        <Icon
                                                          icon="mdi:check-circle"
                                                          className="text-green-600 text-sm"
                                                        />
                                                      )}
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
                                  className=" rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                  <Icon icon="mdi:pencil" className="text-xl" />
                                </button>
                              )}
                              {/* Google Drive Link */}
                              {interview.google_drive_link && (
                                <a
                                  href={interview.google_drive_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-600 hover:text-blue-600 transition"
                                >
                                  <Icon
                                    icon="logos:google-drive"
                                    className="text-xm"
                                  />
                                </a>
                              )}

                              {/* YouTube Link */}
                              {interview.youtube_link && (
                                <a
                                  href={getYoutubeWatchUrl(
                                    interview.youtube_link,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-600 hover:text-red-600 transition"
                                >
                                  <Icon
                                    icon="logos:youtube-icon"
                                    className="text-xm"
                                  />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />
      <FilterInterviewModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        guests={guests}
        hosts={hosts}
        selectedGuests={selectedGuests}
        selectedHosts={selectedHosts}
        selectedStatuses={selectedStatuses}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onApply={handleApplyFilters}
      />
      <PostponeModal
        open={postponeModalOpen}
        onClose={() => setPostponeModalOpen(false)}
        interview={interviewToPostpone}
        onSubmit={handlePostponeSubmit}
      />
      <PostEditModal
        open={postEditModalOpen}
        onClose={() => setPostEditModalOpen(false)}
        interview={interviewToPostEdit}
        onSubmit={handlePostEditSubmit}
      />
      <PublishModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        interview={interviewToPublish}
        onSubmit={handlePublishSubmit}
      />
    </div>
  );
}
