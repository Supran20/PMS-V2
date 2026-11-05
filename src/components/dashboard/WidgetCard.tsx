import React from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface WidgetCardProps {
  title: string;
  count: number;
  icon: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function WidgetCard({
  title,
  count,
  icon,
  onClick,
  children,
}: WidgetCardProps) {
  return (
    <Card className="border-gray-200 cursor-pointer hover:shadow-lg transition">
      <CardHeader>
        <div className="flex justify-between">
          <h3 className="font-semibold">
            {title} ({count})
          </h3>
          <div className="text-2xl">
            <Icon icon={icon} />
          </div>
        </div>
      </CardHeader>
      <CardContent onClick={onClick}>{children}</CardContent>
    </Card>
  );
}
