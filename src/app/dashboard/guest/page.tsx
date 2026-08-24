"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

import { DeleteModal } from "@/components/ui/DeleteModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { Icon } from "@iconify/react";
import {
  getGuests,
  deleteGuest,
  approveGuest,
  rejectGuest,
  updateGuestBySlug,
  Guest,
  updateGuestStatus,
} from "@/lib/api/guest";
import {
  getReapprovalRequests,
  approveReapprovalRequest,
  rejectReapprovalRequest,
  GuestReapprovalRequest,
} from "@/lib/api/guestReapproval";
import { getPermissionSettings } from "@/lib/api/permissionSettings";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { getMediaUrl } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

export default function GuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [guestToApprove, setGuestToApprove] = useState<Guest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [guestToReject, setGuestToReject] = useState<Guest | null>(null);
  const [guestApprovers, setGuestApprovers] = useState<string[]>([]);

  // --------------------------------
  // Reapproval requests (separate source of truth from Guest.approved —
  // needed to distinguish "brand new, never reviewed" guests from
  // "previously approved, now under reapproval review" guests, since
  // both look identical as `approved: false` on the Guest record alone)
  // --------------------------------
  const [reapprovalRequests, setReapprovalRequests] = useState<
    GuestReapprovalRequest[]
  >([]);
  const [reapprovalLoading, setReapprovalLoading] = useState(true);
  const [reapprovalApproveOpen, setReapprovalApproveOpen] = useState(false);
  const [reapprovalToApprove, setReapprovalToApprove] =
    useState<GuestReapprovalRequest | null>(null);
  const [reapprovalRejectOpen, setReapprovalRejectOpen] = useState(false);
  const [reapprovalToReject, setReapprovalToReject] =
    useState<GuestReapprovalRequest | null>(null);

  // const { hasPermission } = useAuth();
  // const canApproveGuest = hasPermission("guest.auto_approve");

  // const canAddGuest = hasPermission("guest.create");
  // const canEditGuest = hasPermission("guest.update");
  // const canDeleteGuest = hasPermission("guest.delete");
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const { user } = useAuth();

  const canApproveGuest = useMemo(() => {
    if (!user) return false;
    return guestApprovers.includes(user.id);
  }, [user, guestApprovers]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const data = await getGuests();
      setGuests(data ?? []);
    } catch {
      toast.error("Failed to load guests");
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReapprovalRequests = async () => {
    setReapprovalLoading(true);
    try {
      const data = await getReapprovalRequests("pending");
      setReapprovalRequests(data ?? []);
    } catch {
      // Non-fatal — approvers-only data; a normal Host/Staff user will
      // 403 here, which is expected and shouldn't surface an error toast.
      setReapprovalRequests([]);
    } finally {
      setReapprovalLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchReapprovalRequests();
  }, []);

  useEffect(() => {
    if (tabFromUrl === "pending") setTabValue(1);
    if (tabFromUrl === "reapproval") setTabValue(4);
  }, [tabFromUrl]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await getPermissionSettings();

        const approver = data.find(
          (p) => p.permission_type === "guest_approver",
        );

        setGuestApprovers(approver?.user_ids || []);
      } catch (err) {
        console.error("Failed to fetch permissions", err);
      }
    };

    fetchPermissions();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  // Guest ids that currently have an open reapproval request — used to
  // keep "Potential" limited to genuinely-new, never-reviewed guests,
  // and to badge those same guests distinctly wherever else they appear
  // (e.g. the "All Guests" tab).
  const pendingReapprovalGuestIds = useMemo(
    () => new Set(reapprovalRequests.map((r) => r.guest_id)),
    [reapprovalRequests],
  );

  const pendingGuests = useMemo(
    () =>
      guests.filter(
        (g) =>
          !g.approved && !g.rejected && !pendingReapprovalGuestIds.has(g.id),
      ),
    [guests, pendingReapprovalGuestIds],
  );

  const approvedGuests = useMemo(
    () => guests.filter((g) => g.approved),
    [guests],
  );

  const rejectedGuests = useMemo(
    () => guests.filter((g) => g.rejected),
    [guests],
  );

  const tabGuests = useMemo(() => {
    if (tabValue === 0) return guests;
    if (tabValue === 1) return pendingGuests;
    if (tabValue === 2) return approvedGuests;
    if (tabValue === 3) return rejectedGuests;

    return guests;
  }, [tabValue, pendingGuests, approvedGuests, rejectedGuests, guests]);

  const filteredGuests = useMemo(() => {
    if (!search.trim()) return tabGuests;

    const q = search.toLowerCase();

    return tabGuests.filter(
      (g) =>
        g.full_name.toLowerCase().includes(q) ||
        (g.designation?.toLowerCase().includes(q) ?? false) ||
        (g.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [tabGuests, search]);

  const filteredReapprovalRequests = useMemo(() => {
    if (!search.trim()) return reapprovalRequests;

    const q = search.toLowerCase();

    return reapprovalRequests.filter(
      (r) =>
        r.guest?.full_name?.toLowerCase().includes(q) ||
        r.requester?.full_name?.toLowerCase().includes(q) ||
        r.proposedHost?.full_name?.toLowerCase().includes(q),
    );
  }, [reapprovalRequests, search]);

  const handleApproveConfirm = async (guest: Guest) => {
    try {
      await approveGuest(guest.id);
      toast.success("Guest approved successfully");
      fetchGuests();
    } catch {
      toast.error("Failed to approve guest");
    } finally {
      setApproveModalOpen(false);
      setGuestToApprove(null);
    }
  };

  const handleRejectConfirm = async (guest: Guest) => {
    try {
      await rejectGuest(guest.id);
      toast.success("Guest rejected successfully");
      fetchGuests();
    } catch {
      toast.error("Failed to reject guest");
    } finally {
      setRejectModalOpen(false);
      setGuestToReject(null);
    }
  };

  const handleRejectClick = (guest: Guest) => {
    setGuestToReject(guest);
    setRejectModalOpen(true);
  };

  const handleEditClick = (guest: Guest) => {
    router.push(`/dashboard/guest/edit/${guest.slug}`);
  };

  const handleDeleteClick = (guest: Guest) => {
    setGuestToDelete(guest);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setGuestToDelete(null);
  };

  const handleDeleteConfirm = async (guest: Guest) => {
    try {
      await deleteGuest(guest.id);
      fetchGuests();
    } catch {
      toast.error("Failed to delete guest");
    } finally {
      handleDeleteClose();
    }
  };

  const handleApproveClick = (guest: Guest) => {
    setGuestToApprove(guest);
    setApproveModalOpen(true);
  };

  // --------------------------------
  // Reapproval request actions — these go through the request-specific
  // endpoints (not approveGuest/rejectGuest), since only these also
  // reassign host_id to proposed_host_id and close out the request row.
  // --------------------------------
  const handleReapprovalApproveClick = (request: GuestReapprovalRequest) => {
    setReapprovalToApprove(request);
    setReapprovalApproveOpen(true);
  };

  const handleReapprovalRejectClick = (request: GuestReapprovalRequest) => {
    setReapprovalToReject(request);
    setReapprovalRejectOpen(true);
  };

  const handleReapprovalApproveConfirm = async (
    request: GuestReapprovalRequest,
  ) => {
    try {
      await approveReapprovalRequest(request.id);
      toast.success("Reapproval request approved");
      fetchGuests();
      fetchReapprovalRequests();
    } catch {
      toast.error("Failed to approve reapproval request");
    } finally {
      setReapprovalApproveOpen(false);
      setReapprovalToApprove(null);
    }
  };

  const handleReapprovalRejectConfirm = async (
    request: GuestReapprovalRequest,
  ) => {
    try {
      await rejectReapprovalRequest(request.id);
      toast.success("Reapproval request rejected");
      fetchGuests();
      fetchReapprovalRequests();
    } catch {
      toast.error("Failed to reject reapproval request");
    } finally {
      setReapprovalRejectOpen(false);
      setReapprovalToReject(null);
    }
  };

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const reapprovalTotalPages = Math.ceil(
    filteredReapprovalRequests.length / itemsPerPage,
  );

  const paginatedReapprovalRequests = filteredReapprovalRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const isImage = (type?: string | null) =>
    type ? type.startsWith("image/") : false;

  useEffect(() => {
    const pages = tabValue === 4 ? reapprovalTotalPages : totalPages;
    if (currentPage > pages) {
      setCurrentPage(pages || 1);
    }
  }, [
    filteredGuests,
    filteredReapprovalRequests,
    currentPage,
    totalPages,
    reapprovalTotalPages,
    tabValue,
  ]);

  const handleStatusChange = async (
    slug: string,
    status: "not_started" | "contacted" | "follow_up" | "confirmed",
  ) => {
    try {
      setGuests((prev) =>
        prev.map((g) => (g.slug === slug ? { ...g, status } : g)),
      );

      await updateGuestStatus(slug, status);

      toast.success("Guest status updated");
    } catch {
      toast.error("Failed to update status");
      fetchGuests();
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case "contacted":
        return "bg-blue-100 text-blue-700";
      case "follow_up":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const triggerSourceLabel = (
    source: GuestReapprovalRequest["trigger_source"],
  ) =>
    source === "duplicate_guest_attempt"
      ? "Duplicate attempt"
      : "Repeat booking";

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Guests</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Guests</h2>
        <AddButton href="/dashboard/guest/add" label="Add Guest" />
      </div>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="guest tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab
            label={
              <span>
                <span className="">{`All Guests (${guests.length})`} </span>
              </span>
            }
          />
          <Tab label={`Potential (${pendingGuests.length})`} />
          <Tab label={`Approved (${approvedGuests.length})`} />
          <Tab label={`Rejected (${rejectedGuests.length})`} />
          <Tab label={`Re-approval (${reapprovalRequests.length})`} />
        </Tabs>
      </Box>

      {/* Search */}
      <Card className="shadow-lg bg-white border-none py-5 px-5">
        {/* <CardHeader>Guest Management</CardHeader> */}

        <CardContent>
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
                placeholder={
                  tabValue === 4
                    ? "Search by guest, requester or proposed host..."
                    : "Search by name, designation or phone..."
                }
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {tabValue === 4 ? (
            // --------------------------------
            // Re-approval tab: driven by GuestReapprovalRequest, not
            // Guest — a list layout since the important fields here are
            // relational (requester, proposed host, trigger source)
            // rather than the guest-card visuals used elsewhere.
            // --------------------------------
            reapprovalLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            ) : filteredReapprovalRequests.length === 0 ? (
              <p className="text-gray-600 py-12 text-center">
                No pending reapproval requests
              </p>
            ) : (
              <div className="space-y-3">
                {paginatedReapprovalRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {request.guest?.profileImage &&
                        isImage(request.guest.profileImage.type) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getMediaUrl(request.guest.profileImage.path)}
                            alt={request.guest.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon
                            icon="mdi:account"
                            className="text-2xl text-gray-500"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/guest/view/${request.guest?.slug ?? ""}`}
                          className="font-semibold text-gray-900 text-sm truncate block hover:underline"
                        >
                          {request.guest?.full_name ?? "Unknown guest"}
                        </Link>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-700">
                            {triggerSourceLabel(request.trigger_source)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Requested by{" "}
                            {request.requester?.full_name ?? "Unknown"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Proposed host:{" "}
                          {request.proposedHost?.full_name ?? "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        disabled={!canApproveGuest}
                        onClick={() => handleReapprovalApproveClick(request)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          canApproveGuest
                            ? "bg-white text-gray-600 hover:text-green-500 border border-gray-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        }`}
                        title={
                          canApproveGuest
                            ? "Approve Request"
                            : "You are not allowed to approve"
                        }
                      >
                        <Icon
                          icon="mdi:check-circle-outline"
                          className="text-lg"
                        />
                      </button>

                      <button
                        disabled={!canApproveGuest}
                        onClick={() => handleReapprovalRejectClick(request)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          canApproveGuest
                            ? "bg-white text-gray-600 hover:text-red-500 border border-gray-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        }`}
                        title={
                          canApproveGuest
                            ? "Reject Request"
                            : "You are not allowed to reject"
                        }
                      >
                        <Icon
                          icon="mdi:close-circle-outline"
                          className="text-lg"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredGuests.length === 0 ? (
            <p className="text-gray-600 py-12 text-center">No guests found</p>
          ) : (
            <div className="grid grid-cols-1  sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {paginatedGuests.map((guest) => {
                const underReview = pendingReapprovalGuestIds.has(guest.id);

                return (
                  <div
                    key={guest.id}
                    className="group relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div className="sm:aspect-square h-50 sm:h-auto  relative ">
                      <Link href={`/dashboard/guest/view/${guest.slug}`}>
                        {guest.profileImage &&
                        isImage(guest.profileImage.type) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getMediaUrl(guest.profileImage.path)}
                            alt={guest.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Icon
                              icon="mdi:account"
                              className="text-4xl text-gray-500"
                            />
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Name + Designation */}
                    <div className="p-3 flex items-start justify-between gap-2">
                      {/* Name + Designation */}
                      <div className="min-w-0">
                        <Link href={`/dashboard/guest/view/${guest.slug}`}>
                          <p className="text-vxs font-semibold text-gray-900 ">
                            {guest.full_name}
                          </p>
                          <p className="text-vxs text-gray-500 truncate">
                            {guest.designation ?? "—"}
                          </p>
                        </Link>

                        {!guest.rejected && (
                          <div
                            className={`inline-block mt-2 px-2 py-1 rounded-sm text-xs font-medium capitalize ${getStatusClass(
                              guest.status,
                            )}`}
                          >
                            <select
                              value={guest.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  guest.slug,
                                  e.target.value as
                                    | "not_started"
                                    | "contacted"
                                    | "follow_up"
                                    | "confirmed",
                                )
                              }
                              className="bg-transparent border-none focus:outline-none text-vxs font-medium capitalize cursor-pointer"
                            >
                              <option
                                className="bg-gray-100 text-gray-700"
                                value="not_started"
                              >
                                Not Started
                              </option>
                              <option
                                className="bg-gray-100 text-gray-700"
                                value="contacted"
                              >
                                Contacted
                              </option>
                              <option
                                className="bg-gray-100 text-gray-700"
                                value="follow_up"
                              >
                                Follow Up
                              </option>
                              <option
                                className="bg-gray-100 text-gray-700"
                                value="confirmed"
                              >
                                Confirmed
                              </option>
                            </select>
                          </div>
                        )}

                        {underReview && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setTabValue(4);
                              setCurrentPage(1);
                            }}
                            className="inline-block mt-2 px-2 py-1 rounded-sm text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                            title="View in Re-approval tab"
                          >
                            Under Review
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        {/* Already Approved */}
                        {guest.approved ? (
                          <div
                            className="p-2 rounded-lg text-green-500"
                            title="Approved"
                          >
                            <Icon icon="mdi:check-circle" className="text-lg" />
                          </div>
                        ) : guest.rejected ? (
                          <div
                            className="p-2 rounded-lg text-red-500"
                            title="Rejected"
                          >
                            <Icon icon="mdi:close-circle" className="text-lg" />
                          </div>
                        ) : underReview ? (
                          // Guest is not brand-new — it's under an open
                          // reapproval request. Route review to the
                          // Re-approval tab instead of the plain
                          // approveGuest/rejectGuest actions, which
                          // don't know about the request row and would
                          // leave it dangling.
                          <div
                            className="p-2 rounded-lg text-amber-500"
                            title="Awaiting reapproval review"
                          >
                            <Icon
                              icon="mdi:clock-alert-outline"
                              className="text-lg"
                            />
                          </div>
                        ) : (
                          <>
                            {/* Approve Button */}
                            <button
                              disabled={!canApproveGuest}
                              onClick={() => handleApproveClick(guest)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                canApproveGuest
                                  ? "bg-gray-100 text-gray-600 hover:text-green-500"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              title={
                                canApproveGuest
                                  ? "Approve Guest"
                                  : "You are not allowed to approve"
                              }
                            >
                              <Icon
                                icon="mdi:check-circle-outline"
                                className="text-lg"
                              />
                            </button>

                            {/* Reject Button */}
                            <button
                              disabled={!canApproveGuest}
                              onClick={() => handleRejectClick(guest)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                canApproveGuest
                                  ? "bg-gray-100 text-gray-600 hover:text-red-500"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              title={
                                canApproveGuest
                                  ? "Reject Guest"
                                  : "You are not allowed to reject"
                              }
                            >
                              <Icon
                                icon="mdi:close-circle-outline"
                                className="text-lg"
                              />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={tabValue === 4 ? reapprovalTotalPages : totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />

      {/* Delete Modal */}
      <DeleteModal<Guest>
        open={deleteModalOpen}
        item={guestToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        titleKey="full_name"
      />
      <ConfirmModal<Guest>
        open={approveModalOpen}
        item={guestToApprove}
        onClose={() => {
          setApproveModalOpen(false);
          setGuestToApprove(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Guest"
        description={`Are you sure you want to approve ${guestToApprove?.full_name}?`}
        confirmText="Approve"
        confirmVariant="primary"
      />
      <ConfirmModal<Guest>
        open={rejectModalOpen}
        item={guestToReject}
        onClose={() => {
          setRejectModalOpen(false);
          setGuestToReject(null);
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Guest"
        description={`Are you sure you want to reject ${guestToReject?.full_name}?`}
        confirmText="Reject"
        confirmVariant="danger"
      />

      {/* Reapproval Request Modals */}
      <ConfirmModal<GuestReapprovalRequest>
        open={reapprovalApproveOpen}
        item={reapprovalToApprove}
        onClose={() => {
          setReapprovalApproveOpen(false);
          setReapprovalToApprove(null);
        }}
        onConfirm={handleReapprovalApproveConfirm}
        title="Approve Reapproval Request"
        description={`Are you sure you want to approve reapproval for ${reapprovalToApprove?.guest?.full_name ?? "this guest"}? ${
          reapprovalToApprove?.proposedHost
            ? `The guest will be reassigned to ${reapprovalToApprove.proposedHost.full_name}.`
            : ""
        }`}
        confirmText="Approve"
        confirmVariant="primary"
      />
      <ConfirmModal<GuestReapprovalRequest>
        open={reapprovalRejectOpen}
        item={reapprovalToReject}
        onClose={() => {
          setReapprovalRejectOpen(false);
          setReapprovalToReject(null);
        }}
        onConfirm={handleReapprovalRejectConfirm}
        title="Reject Reapproval Request"
        description={`Are you sure you want to reject reapproval for ${reapprovalToReject?.guest?.full_name ?? "this guest"}?`}
        confirmText="Reject"
        confirmVariant="danger"
      />
    </div>
  );
}
