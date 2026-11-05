import React from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="border-gray-200">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <Icon icon={icon} className={`text-3xl ${color}`} />
      </CardContent>
    </Card>
  );
}
