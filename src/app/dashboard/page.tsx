"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import Link from "next/link";

const DASHBOARD_SECTIONS = [
  {
    title: "Users",
    description: "Manage podcast users and permissions",
    href: "/dashboard/users",
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
  const { user } = useAuth();
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_SECTIONS.map((section) => (
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
