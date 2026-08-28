"use client";

import { Card, CardHeader, CardTitle, CardContent, Avatar, AvatarFallback } from "@/components/ui";
import {
  Users,
  FileText,
  Trophy,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { EmptyState } from "@/components/branding";
import type { AdminActivityItem } from "@/lib/api/client";
import { formatDistanceToNow } from "@/lib/utils/date";

interface RecentActivityProps {
  activity: AdminActivityItem[];
}

const kindIcons = {
  user: <Users className="h-4 w-4 text-arc-blue-600" />,
  question: <HelpCircle className="h-4 w-4 text-arc-purple-600" />,
  attempt: <Trophy className="h-4 w-4 text-arc-orange-600" />,
  program: <BookOpen className="h-4 w-4 text-arc-navy-700" />,
};

function getAvatarForKind(kind: string, title: string): string {
  const words = title.split(" ").filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getIconColor(kind: string): string {
  switch (kind) {
    case "user":
      return "from-arc-blue-500 to-arc-blue-600";
    case "question":
      return "from-arc-purple-500 to-arc-purple-600";
    case "attempt":
      return "from-arc-orange-500 to-arc-orange-600";
    case "program":
      return "from-arc-navy-700 to-arc-navy-800";
    default:
      return "from-arc-slate-500 to-arc-slate-600";
  }
}

export function RecentActivity({ activity }: RecentActivityProps) {
  if (!activity || activity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-arc-purple-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-arc-purple-600" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon="bell"
            title="No recent activity"
            description="Activity will appear here as users interact with the platform."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-arc-purple-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-arc-purple-600" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activity.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ item }: { item: AdminActivityItem }) {
  const avatar = getAvatarForKind(item.kind, item.title);
  const iconColor = getIconColor(item.kind);
  const icon = kindIcons[item.kind as keyof typeof kindIcons] ?? (
    <AlertCircle className="h-4 w-4 text-arc-slate-600" />
  );

  return (
    <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-arc-slate-50 transition-colors">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback
          className={`bg-gradient-to-br ${iconColor} text-white font-semibold text-sm`}
        >
          {avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-arc-navy-900 leading-tight">
          {item.title}
        </p>
        {item.detail && (
          <p className="text-xs text-arc-slate-500 mt-0.5 line-clamp-1">
            {item.detail}
          </p>
        )}
        <p className="text-xs text-arc-slate-400 mt-1">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex-shrink-0 ml-2">
        {icon}
      </div>
    </div>
  );
}
