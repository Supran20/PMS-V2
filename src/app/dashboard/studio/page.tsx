"use client";

import React, { useEffect, useState, useMemo } from "react";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Icon } from "@iconify/react";
import { getStudios, deleteStudio, Studio } from "@/lib/api/studio";
import { toast } from "sonner";
import { AddButton } from "@/components/ui/AddButton";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";

export default function StudioPage() {
  const router = useRouter();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studioToDelete, setStudioToDelete] = useState<Studio | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { loading: authLoading, hasPermission } = useAuth();

  const fetchStudios = async () => {
    setLoading(true);
    try {
      const data = await getStudios();
      setStudios(data ?? []);
    } catch {
      toast.error("Failed to load studios");
      setStudios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!hasPermission("studio.view")) {
      router.replace("/dashboard");
      return;
    }

    fetchStudios();
  }, [authLoading, hasPermission, router]);

  const filteredStudios = useMemo(() => {
    if (!search.trim()) return studios;
    const q = search.toLowerCase();
    return studios.filter(
      (s) =>
        s.studio_name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.address?.toLowerCase().includes(q) ?? false),
    );
  }, [studios, search]);

  const handleEditClick = (studio: Studio) => {
    router.push(`/dashboard/studio/edit/${studio.id}`);
  };

  const handleDeleteClick = (studio: Studio) => {
    setStudioToDelete(studio);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setStudioToDelete(null);
  };

  const handleDeleteConfirm = async (studio: Studio) => {
    await deleteStudio(studio.id);
    fetchStudios();
  };

  const totalPages = Math.ceil(filteredStudios.length / itemsPerPage);

  const paginatedStudios = filteredStudios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredStudios, currentPage, totalPages]);

  if (authLoading || loading || !hasPermission("studio.view")) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Studio</h2>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Studio</h2>
        {hasPermission("studio.create") && (
          <AddButton href="/dashboard/studio/add" label="Add Studio" />
        )}
      </div>

      <Card className="shadow-lg bg-white border-none py-5 px-5 md:px-0">
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
                placeholder="Search by name, slug or address..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {filteredStudios.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">
              {search.trim()
                ? "No studios match your search"
                : "No studios found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Studio Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Slug
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Address
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudios.map((studio) => (
                    <tr
                      key={studio.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {studio.studio_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{studio.slug}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {studio.address ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission("studio.edit") && (
                            <button
                              onClick={() => handleEditClick(studio)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="text-xl" />
                            </button>
                          )}
                          {hasPermission("studio.delete") && (
                            <button
                              onClick={() => handleDeleteClick(studio)}
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

      <DeleteModal<Studio>
        open={deleteModalOpen}
        item={studioToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        titleKey="studio_name"
      />
    </div>
  );
}
