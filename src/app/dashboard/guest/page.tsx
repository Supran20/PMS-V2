"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

import { DeleteModal } from "@/components/ui/DeleteModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { Icon } from "@iconify/react";
import { getGuests, deleteGuest, approveGuest, Guest } from "@/lib/api/guest";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { getMediaUrl } from "@/lib/utils";

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

  const ITEMS_PER_PAGE = 10;

  const { hasPermission } = useAuth();
  const canApproveGuest = hasPermission("guest.auto_approve");

  const canAddGuest = hasPermission("guest.create");
  const canEditGuest = hasPermission("guest.update");
  const canDeleteGuest = hasPermission("guest.delete");

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

  const filteredGuests = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.full_name.toLowerCase().includes(q) ||
        (g.designation?.toLowerCase().includes(q) ?? false) ||
        (g.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [guests, search]);

  const handleApproveConfirm = async (guest: Guest) => {
    try {
      await approveGuest(guest.id);
      toast.success("Guest approved successfully");
      fetchGuests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve guest");
    } finally {
      setApproveModalOpen(false);
      setGuestToApprove(null);
    }
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

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);

  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const isImage = (type?: string | null) =>
    type ? type.startsWith("image/") : false;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredGuests, currentPage, totalPages]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Guests
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
          Guests
        </h2>
        {canAddGuest && (
          <AddButton href="/dashboard/guest/add" label="Add Guest" />
        )}
      </div>

      {/* Search */}
      <Card className="shadow-lg bg-white border-none py-5">
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
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          {filteredGuests.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-12 text-center">
              No guests found
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {paginatedGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    {guest.profileImage && isImage(guest.profileImage.type) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMediaUrl(guest.profileImage.path)}
                        alt={guest.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <Icon
                          icon="mdi:account"
                          className="text-4xl text-gray-500"
                        />
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {/* Edit */}
                      {canEditGuest && (
                        <button
                          onClick={() => handleEditClick(guest)}
                          className="p-2 rounded-lg bg-white text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Icon icon="mdi:pencil" className="text-xl" />
                        </button>
                      )}

                      {/* Delete */}
                      {canDeleteGuest && (
                        <button
                          onClick={() => handleDeleteClick(guest)}
                          className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <Icon icon="mdi:delete" className="text-xl" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Name + Designation */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    {/* Name + Designation */}
                    <div className="min-w-0">
                      <p className="text-vxs font-semibold text-gray-900 dark:text-gray-100 ">
                        {guest.full_name}
                      </p>
                      <p className="text-vxs text-gray-500 dark:text-gray-400 truncate">
                        {guest.designation ?? "—"}
                      </p>
                    </div>

                    <div>
                      {guest.approved ? (
                        <div
                          className="p-2 rounded-lg text-green-500"
                          title="Approved"
                        >
                          <Icon icon="mdi:check-circle" className="text-lg" />
                        </div>
                      ) : canApproveGuest ? (
                        <button
                          onClick={() => handleApproveClick(guest)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors"
                          title="Approve Guest"
                        >
                          <Icon
                            icon="mdi:check-circle-outline"
                            className="text-lg"
                          />
                        </button>
                      ) : (
                        <div
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                          title="Not approved"
                        >
                          <Icon
                            icon="mdi:check-circle-outline"
                            className="text-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
