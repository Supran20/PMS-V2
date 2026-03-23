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
  createPermissionSetting,
} from "@/lib/api/permissionSettings";
import { getSettingsByType } from "@/lib/api/settings";
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

  const [guestUsers, setGuestUsers] = useState<any[]>([]);
  const [guestPermissionId, setGuestPermissionId] = useState<string>("");

  const [interviewUsers, setInterviewUsers] = useState<any[]>([]);
  const [interviewPermissionId, setInterviewPermissionId] =
    useState<string>("");
  const [settingsId, setSettingsId] = useState<string>("");

  const fetchData = async () => {
    const [usersData, permData, settingsData] = await Promise.all([
      getUsers(),
      getPermissionSettings(),
      getSettingsByType("permission_settings"), // 🔥 new
    ]);

    setUsers(usersData);
    setPermissions(permData);

    // ✅ set dynamic settingsId
    setSettingsId(settingsData.id);

    const guestPerm = permData.find(
      (p) => p.permission_type === "guest_approver",
    );

    const interviewPerm = permData.find(
      (p) => p.permission_type === "interview_cc",
    );

    // Guest
    if (guestPerm) {
      setGuestPermissionId(guestPerm.id);

      const mapped = guestPerm.users?.map((u: any) => ({
        value: u.id,
        label: u.full_name,
      }));

      setGuestUsers(mapped || []);
    }

    // Interview
    if (interviewPerm) {
      setInterviewPermissionId(interviewPerm.id);

      const mapped = interviewPerm.users?.map((u: any) => ({
        value: u.id,
        label: u.full_name,
      }));

      setInterviewUsers(mapped || []);
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

  if (!settingsId) {
    toast.error("Settings not loaded");
    return;
  }

  const handleSaveAll = async () => {
    try {
      console.log("Save button clicked");

      const updates = [];

      // Guest
      const guest_ids = guestUsers.map((u) => u.value);
      if (guestPermissionId) {
        updates.push(
          updatePermissionSetting(guestPermissionId, { user_ids: guest_ids }),
        );
      } else {
        // create new record if not exists
        updates.push(
          createPermissionSetting({
            settings_id: settingsId,
            permission_type: "guest_approver",
            user_ids: guest_ids,
          }),
        );
      }

      // Interview
      const interview_ids = interviewUsers.map((u) => u.value);
      if (interviewPermissionId) {
        updates.push(
          updatePermissionSetting(interviewPermissionId, {
            user_ids: interview_ids,
          }),
        );
      } else {
        // create new record if not exists
        updates.push(
          createPermissionSetting({
            settings_id: settingsId,
            permission_type: "interview_cc",
            user_ids: interview_ids,
          }),
        );
      }

      await Promise.all(updates);

      toast.success("Permissions updated");
    } catch (err) {
      console.error(err);
      toast.error("Error updating permissions");
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
          <div className="flex flex-col gap-5">
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold mb-3">
                Guest Approver Settings
              </h2>

              <Select
                closeMenuOnSelect={false}
                components={animatedComponents}
                isMulti
                value={guestUsers}
                onChange={(val) => setGuestUsers(val as any)}
                options={userOptions}
              />
            </div>
            {/* Interview CC */}
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold mb-3">
                Interview CC Settings
              </h2>

              <Select
                isMulti
                components={animatedComponents}
                value={interviewUsers}
                onChange={(val) => setInterviewUsers(val as any)}
                options={userOptions}
              />
            </div>
          </div>
        </TabPanel>
        <div className="mt-6">
          <button
            onClick={handleSaveAll}
            className="bg-blue-600 text-white px-6 py-2 rounded cursor-pointer"
          >
            Save
          </button>
        </div>
      </Box>
    </div>
  );
}
