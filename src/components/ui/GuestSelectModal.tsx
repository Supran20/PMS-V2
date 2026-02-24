"use client";

import { useMemo, useState } from "react";
import { Guest } from "@/lib/api/guest";

type Props = {
  open: boolean;
  guests: Guest[];
  onClose: () => void;
  onSelect: (guest: Guest) => void;
};

const GuestSelectModal = ({ open, guests, onClose, onSelect }: Props) => {
  const [search, setSearch] = useState("");

  const filteredGuests = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.full_name.toLowerCase().includes(q) ||
        g.designation?.toLowerCase().includes(q),
    );
  }, [guests, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select Guest</h3>
          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y">
          {filteredGuests.map((guest) => (
            <div
              key={guest.id}
              onClick={() => onSelect(guest)}
              className="p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{guest.full_name}</p>
                <p className="text-xs text-gray-500">
                  {guest.designation || "-"}
                </p>
              </div>

              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${
                  guest.approved === true
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {guest.approved ? "Approved" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuestSelectModal;

