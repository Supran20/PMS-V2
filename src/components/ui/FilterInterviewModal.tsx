"use client";

import Select from "react-select";
import { useState, useEffect } from "react";

interface Host {
  id: string;
  full_name: string;
}

interface Guest {
  id: string;
  full_name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;

  guests: Guest[];
  hosts: Host[];

  selectedGuests: string[];
  selectedHosts: string[];
  selectedStatuses: string[];
  dateFrom: string;
  dateTo: string;

  onApply: (filters: {
    guests: string[];
    hosts: string[];
    statuses: string[];
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export default function FilterInterviewModal({
  open,
  onClose,
  guests,
  hosts,
  selectedGuests,
  selectedHosts,
  selectedStatuses,
  dateFrom,
  dateTo,
  onApply,
}: Props) {
  const [guestsSelected, setGuestsSelected] = useState<string[]>([]);
  const [hostsSelected, setHostsSelected] = useState<string[]>([]);
  const [statusesSelected, setStatusesSelected] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuestsSelected(selectedGuests);
      setHostsSelected(selectedHosts);
      setStatusesSelected(selectedStatuses);
      setFrom(dateFrom);
      setTo(dateTo);
    }
  }, [open, selectedGuests, selectedHosts, dateFrom, dateTo]);

  /**
   * Convert Guests → React Select options
   */
  const guestOptions = guests.map((g) => ({
    value: g.id,
    label: g.full_name,
  }));

  /**
   * Convert Hosts → React Select options
   */
  const hostOptions = hosts.map((h) => ({
    value: h.id,
    label: h.full_name,
  }));

  /**
   * ESC key close
   */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const statusOptions = [
    { value: "scheduled", label: "Scheduled" },
    { value: "postponed", label: "Postponed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "recorded", label: "Recorded" },
    { value: "editing", label: "Editing" },
    { value: "post_editing", label: "Post Editing" },
    { value: "published", label: "Published" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-[420px] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Filter Interviews</h3>

        {/* Guest Filter */}
        <div>
          <label className="text-sm font-medium mb-1 block">Guest</label>
          <Select
            options={guestOptions}
            placeholder="Select Guests"
            isMulti
            value={guestOptions.filter((o) => guestsSelected.includes(o.value))}
            onChange={(options) =>
              setGuestsSelected(options ? options.map((o) => o.value) : [])
            }
          />
        </div>

        {/* Host Filter */}
        <div>
          <label className="text-sm font-medium mb-1 block">Hosts</label>
          <Select
            options={hostOptions}
            placeholder="Select Hosts"
            isMulti
            value={hostOptions.filter((o) => hostsSelected.includes(o.value))}
            onChange={(options) =>
              setHostsSelected(options ? options.map((o) => o.value) : [])
            }
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select
            options={statusOptions}
            placeholder="Select Status"
            isMulti
            value={statusOptions.filter((o) =>
              statusesSelected.includes(o.value),
            )}
            onChange={(options) =>
              setStatusesSelected(options ? options.map((o) => o.value) : [])
            }
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-white text-gray-600 cursor-pointer transition text-xs rounded-md border hover:scale-[0.96]"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onApply({
                guests: guestsSelected,
                hosts: hostsSelected,
                statuses: statusesSelected,
                dateFrom: from,
                dateTo: to,
              });

              onClose();
            }}
            className="px-4 py-1 bg-blue-600 text-white cursor-pointer transition text-xs rounded-md hover:bg-blue-700 hover:scale-[0.96]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
