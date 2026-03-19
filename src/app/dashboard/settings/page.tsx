"use client";

import React, { useEffect, useState } from "react";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { toast } from "sonner";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

import {
  getPermissionSettings,
  updatePermissionSetting,
} from "@/lib/api/permissionSettings";
import { getUsers, getAdminUser, User } from "@/lib/api/user";

const animatedComponents = makeAnimated();

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return value === index ? <Box sx={{ p: 3 }}>{children}</Box> : null;
}

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [permissionId, setPermissionId] = useState<string>("");

  const fetchData = async () => {
    const [usersData, permData] = await Promise.all([
      getUsers(),
      getPermissionSettings(),
    ]);

    setUsers(usersData);
    setPermissions(permData);

    const guestPerm = permData.find(
      (p) => p.permission_type === "guest_approver",
    );

    if (guestPerm) {
      setPermissionId(guestPerm.id);

      const mapped = guestPerm.users?.map((u: any) => ({
        value: u.id,
        label: u.full_name,
      }));

      setSelectedUsers(mapped || []);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.full_name,
  }));

  const handleUpdate = async () => {
    try {
      if (!permissionId) return;

      const user_ids = selectedUsers.map((u) => u.value);

      await updatePermissionSetting(permissionId, { user_ids });

      toast.success("Updated successfully");

      console.log("PermissionId:", permissionId);
      console.log("Selected Users", user_ids);
    } catch {
      toast.error("Error in Updating");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
      </div>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Permission Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tab} index={0}>
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold mb-3">
              Guest Approver Settings
            </h2>

            <Select
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              value={selectedUsers}
              onChange={(val) => setSelectedUsers(val as any)}
              options={userOptions}
            />

            <button
              onClick={handleUpdate}
              className="mt-4 bg-blue-600 cursor-pointer text-white px-4 py-2 rounded"
            >
              Update
            </button>
          </div>
        </TabPanel>
      </Box>
    </div>
  );
}
