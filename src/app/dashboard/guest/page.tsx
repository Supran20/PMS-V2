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

  const { hasPermission } = useAuth();
  // const canApproveGuest = hasPermission("guest.auto_approve");

  const canAddGuest = hasPermission("guest.create");
  const canEditGuest = hasPermission("guest.update");
  const canDeleteGuest = hasPermission("guest.delete");
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

  useEffect(() => {
    fetchGuests();
  }, []);

  useEffect(() => {
    if (tabFromUrl === "pending") setTabValue(1);
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

  const pendingGuests = useMemo(
    () => guests.filter((g) => !g.approved && !g.rejected),
    [guests],
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

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const isImage = (type?: string | null) =>
    type ? type.startsWith("image/") : false;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredGuests, currentPage, totalPages]);

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
        {canAddGuest && (
          <AddButton href="/dashboard/guest/add" label="Add Guest" />
        )}
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
                placeholder="Search by name, designation or phone..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          {filteredGuests.length === 0 ? (
            <p className="text-gray-600 py-12 text-center">No guests found</p>
          ) : (
            <div className="grid grid-cols-1  sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {paginatedGuests.map((guest) => (
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

                    {/* Overlay Actions */}
                    {/* <div className="absolute inset-0 md:bg-black/50 bg-black/25 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(guest)}
                        className="p-2 rounded-lg bg-white text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Icon icon="mdi:pencil" className="text-xl" />
                      </button>

                      {canDeleteGuest && (
                        <button
                          onClick={() => handleDeleteClick(guest)}
                          className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <Icon icon="mdi:delete" className="text-xl" />
                        </button>
                      )}
                    </div> */}
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
                    </div>
                    {/* </Link> */}

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
                  {/* </Link> */}
                </div>
              ))}
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
    </div>
  );
}
