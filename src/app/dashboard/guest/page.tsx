import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function GuestPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Guest
      </h2>
      <Card>
        <CardHeader>Guest Management</CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Manage guest appearances and profiles. Content coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
