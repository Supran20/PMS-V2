"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUsers } from "@/lib/api/user";
import { getGuests } from "@/lib/api/guest";
import { getInterviews } from "@/lib/api/interview";

const DASHBOARD_SECTIONS = [
  {
    title: "Users",
    description: "Manage podcast users and permissions",
    href: "/dashboard/users",
    requiredPermission: "user.manage",
    icon: "mdi:account-group",
  },
  {
    title: "Media",
    description: "Upload and manage podcast episodes",
    href: "/dashboard/media",
    icon: "mdi:video",
  },
  {
    title: "Tags",
    description: "Organize content with tags",
    href: "/dashboard/tags",
    icon: "mdi:tag-multiple",
  },
  {
    title: "Studio",
    description: "Manage recording studios",
    href: "/dashboard/studio",
    icon: "mdi:microphone",
  },
  {
    title: "Guest",
    description: "Manage guest appearances",
    href: "/dashboard/guest",
    icon: "mdi:account-voice",
  },
  {
    title: "Interview",
    description: "Schedule and track interviews",
    href: "/dashboard/interview",
    icon: "mdi:chat-question",
  },
];

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [hostCount, setHostCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        setLoadingStats(true);

        const [users, guests, interviews] = await Promise.all([
          getUsers(),
          getGuests(),
          getInterviews(),
        ]);

        // Count Hosts (role_name === "Host")
        const hosts = users.filter((user) =>
          user.roles?.some((role) => role.role_name === "Host"),
        );

        setHostCount(hosts.length);
        setGuestCount(guests.length);
        setInterviewCount(interviews.length);
      } catch (error) {
        console.error("Failed to load overview stats", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchOverviewStats();
  }, []);

  const displayName = user?.full_name || user?.email || "User";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {displayName}
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your podcast content from the dashboard
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Hosts */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Hosts
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingStats ? "—" : hostCount}
              </h3>
            </div>
            <Icon
              icon="mdi:account-tie"
              className="text-3xl text-blue-600 dark:text-blue-400"
            />
          </CardContent>
        </Card>

        {/* Guests */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Guests
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingStats ? "—" : guestCount}
              </h3>
            </div>
            <Icon
              icon="mdi:account-voice"
              className="text-3xl text-green-600 dark:text-green-400"
            />
          </CardContent>
        </Card>

        {/* Interviews */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Interviews
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingStats ? "—" : interviewCount}
              </h3>
            </div>
            <Icon
              icon="mdi:microphone"
              className="text-3xl text-purple-600 dark:text-purple-400"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_SECTIONS.filter((tab) => {
          if (!tab.requiredPermission) return true;
          return hasPermission(tab.requiredPermission);
        }).map((section) => (
          <Link key={section.href} href={section.href}>
            <Card
              variant="elevated"
              className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-gray-200 dark:border-gray-700"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-blue-900/30">
                    <Icon
                      icon={section.icon}
                      className="text-2xl text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Go to {section.title}
                  <Icon icon="mdi:chevron-right" className="text-lg" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
