"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Icon } from "@iconify/react";
import { getUsers, deleteUser, User } from "@/lib/api/user";
import { getMediaUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordModal } from "@/components/ui/ChangePasswordModal";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(
    null,
  );
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { user: currentUser, hasPermission, loading: authLoading } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data ?? []);
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!hasPermission("user.manage")) {
      router.replace("/dashboard");
      return;
    }

    fetchUsers();
  }, [authLoading]);

  const handleEditClick = (user: User) => {
    router.push(`/dashboard/users/edit/${user.id}`);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = async (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    await deleteUser(user.id);
    fetchUsers();
  };

  const handlePasswordClick = (user: User) => {
    setUserToChangePassword(user);
    setPasswordModalOpen(true);
  };

  const handlePasswordClose = () => {
    setPasswordModalOpen(false);
    setUserToChangePassword(null);
  };

  function StatusBadge({ status }: { status: string }) {
    const isActive = status?.toLowerCase() === "active";

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  }

  const totalPages = Math.ceil(users.length / itemsPerPage);

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [users]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        <AddButton href="/dashboard/users/add" label="Add User" />
      </div>

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Full Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900 flex items-center gap-2">
                        {/* User Profile Image */}
                        {user.profileImage?.path ? (
                          <img
                            src={getMediaUrl(user.profileImage.path)}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                            {getInitials(user.full_name)}
                          </div>
                        )}

                        {user.full_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={user.status} />
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        {user.roles?.[0]?.role_name}
                      </td>
                      <td className="py-3 px-4 ">
                        <div className="flex items-center justify-start gap-2">
                          {hasPermission("user.manage") && ( // Only Admin sees password icon
                            <button
                              onClick={() => handlePasswordClick(user)}
                              className="p-2 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                              title="Change Password"
                            >
                              <Icon icon="mdi:key" className="text-xl" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="text-xl" />
                          </button>
                          {hasPermission("user.manage") &&
                            currentUser?.id !== user.id && (
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />

      <DeleteModal<User>
        open={deleteModalOpen}
        item={userToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        titleKey="full_name"
      />

      <ChangePasswordModal
        open={passwordModalOpen}
        userId={userToChangePassword?.id ?? null}
        onClose={handlePasswordClose}
      />
    </div>
  );
}
