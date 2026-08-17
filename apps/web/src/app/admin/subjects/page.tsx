"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@aratc/ui";

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Subjects</h1>

      <Card>
        <CardHeader>
          <CardTitle>Subject Management</CardTitle>
          <CardDescription>
            Manage subjects within each program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subject management will be implemented in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
