"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Icon } from "@iconify/react";
import { getUsers, deleteUser, User } from "@/lib/api/user";
import { toast } from "sonner";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { hasPermission, loading: authLoading } = useAuth();

  const ITEMS_PER_PAGE = 10;

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
    await deleteUser(user.id);
    fetchUsers();
  };

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [users]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Users
        </h2>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Users
        </h2>
        <AddButton href="/dashboard/users/add" label="Add User" />
      </div>

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">
              No users found
            </p>
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
                      Role
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
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
                      <td className="py-3 px-4 text-gray-900">
                        {user.full_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.roles?.[0]?.role_name}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="text-xl" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <DeleteModal<User>
        open={deleteModalOpen}
        item={userToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        titleKey="full_name"
      />
    </div>
  );
}

