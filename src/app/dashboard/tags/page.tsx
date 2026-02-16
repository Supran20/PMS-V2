import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Tags
      </h2>
      <Card>
        <CardHeader>Tag Management</CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your podcast content with tags. Content coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
