import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function StudioPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Studio
      </h2>
      <Card>
        <CardHeader>Studio Management</CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Manage recording studios and equipment. Content coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
