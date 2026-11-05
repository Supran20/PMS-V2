export interface SidebarTab {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}

export const INTERVIEW_TAB_HREF = "/dashboard/interview";

export const INTERVIEW_STATUS_MENU = [
  { label: "All", value: "" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Recorded", value: "recorded" },
  { label: "Edited", value: "editing" },
  { label: "Post Editing", value: "post_editing" },
  { label: "Published", value: "published" },
  { label: "Postponed", value: "postponed" },
  { label: "Cancelled", value: "cancelled" },
];

export const CHANNEL_SIDEBAR_TABS: SidebarTab[] = [
  { label: "Overview", href: "/dashboard", icon: "mdi:view-dashboard" },
  { label: "Guest", href: "/dashboard/guest", icon: "mdi:account-voice" },
  {
    label: "Interview",
    href: INTERVIEW_TAB_HREF,
    icon: "mdi:chat-question",
    permission: "interviews.view",
  },
];

export const PLATFORM_ADMIN_SIDEBAR_TABS: SidebarTab[] = [
  {
    label: "Channels",
    href: "/dashboard/platform-admin/channels",
    icon: "mdi:domain",
  },
  {
    label: "Subscription Plans",
    href: "/dashboard/platform-admin/plans",
    icon: "mdi:credit-card-outline",
  },
  {
    label: "Platform Admins",
    href: "/dashboard/platform-admin/admins",
    icon: "mdi:shield-account",
  },
];
