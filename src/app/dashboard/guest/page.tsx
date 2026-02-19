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
            <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
              {search.trim()
                ? "No guests match your search"
                : "No guests found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Designation
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Approved
                    </th>

                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {guest.full_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {guest.designation ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {guest.phone ?? "-"}
                      </td>
                      <td className="py-3 px-4">
                        {guest.approved ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            No
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Button */}
                          {!guest.approved && canApproveGuest && (
                            <button
                              onClick={() => handleApproveClick(guest)}
                              className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title="Approve"
                            >
                              <Icon
                                icon="mdi:check-circle"
                                className="text-xl"
                              />
                            </button>
                          )}

                          {canEditGuest && (
                            <button
                              onClick={() => handleEditClick(guest)}
                              className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="text-xl" />
                            </button>
                          )}

                          {canDeleteGuest && (
                            <button
                              onClick={() => handleDeleteClick(guest)}
                              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Icon icon="mdi:delete" className="text-xl" />
                            </button>
                          )}
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
