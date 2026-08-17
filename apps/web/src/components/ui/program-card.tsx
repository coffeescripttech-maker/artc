"use client";

import { cn } from "@aratc/ui";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Progress } from "@/components/ui";
import { Button } from "@/components/ui";
import { BookOpen, Users, Star, Clock, CheckCircle, Play, ArrowRight } from "lucide-react";

interface ProgramCardProps {
  name: string;
  description: string;
  image?: string;
  icon?: string;
  stage: "basic" | "entrance" | "board" | "professional";
  level?: string;
  lessons?: number;
  students?: number;
  rating?: number;
  reviews?: number;
  price?: number;
  progress?: number;
  status?: "enrolled" | "completed" | "not-enrolled";
  className?: string;
  onEnroll?: () => void;
  onContinue?: () => void;
}

const stageConfig = {
  basic: {
    label: "Basic Education",
    bg: "bg-arc-navy-100",
    text: "text-arc-navy-700",
    gradient: "from-arc-navy-500 to-arc-navy-600",
  },
  entrance: {
    label: "Entrance Exam",
    bg: "bg-arc-purple-100",
    text: "text-arc-purple-700",
    gradient: "from-arc-purple-500 to-arc-purple-600",
  },
  board: {
    label: "Board Exam",
    bg: "bg-arc-orange-100",
    text: "text-arc-orange-700",
    gradient: "from-arc-orange-500 to-arc-orange-600",
  },
  professional: {
    label: "Professional",
    bg: "bg-arc-green-100",
    text: "text-arc-green-700",
    gradient: "from-arc-green-500 to-arc-green-600",
  },
};

export function ProgramCard({
  name,
  description,
  image,
  icon,
  stage,
  level,
  lessons,
  students,
  rating,
  reviews,
  price,
  progress,
  status = "not-enrolled",
  className,
  onEnroll,
  onContinue,
}: ProgramCardProps) {
  const config = stageConfig[stage];

  return (
    <Card className={cn("overflow-hidden hover:shadow-arc-lg transition-all group", className)}>
      {/* Header with gradient */}
      <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

      <div className="p-5">
        {/* Top section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {(image || icon) && (
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl text-white`}>
                {icon || "📚"}
              </div>
            )}
            <div>
              <Badge className={cn("mb-1", config.bg, config.text)}>{config.label}</Badge>
              {level && <p className="text-xs text-arc-slate-500">{level}</p>}
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-arc-navy-900 mb-1 group-hover:text-arc-orange-500 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-arc-slate-500 mb-4 line-clamp-2">{description}</p>

        {/* Stats */}
        {(lessons || students || rating) && (
          <div className="flex items-center gap-4 text-sm text-arc-slate-500 mb-4">
            {lessons && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {lessons} lessons
              </span>
            )}
            {students && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {students.toLocaleString()}
              </span>
            )}
            {rating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-arc-orange-400 fill-arc-orange-400" />
                {rating} ({reviews})
              </span>
            )}
          </div>
        )}

        {/* Progress (if enrolled) */}
        {status === "enrolled" && progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-arc-slate-500">Progress</span>
              <span className="font-semibold text-arc-navy-700">{progress}%</span>
            </div>
            <Progress value={progress} variant={progress >= 80 ? "mastery" : "learning"} size="sm" />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
          {status === "enrolled" ? (
            <>
              {progress !== undefined && progress >= 100 ? (
                <Badge variant="mastery" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                </Badge>
              ) : (
                <span className="text-sm text-arc-slate-500">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Continue learning
                </span>
              )}
              <Button
                variant={progress !== undefined && progress >= 100 ? "outline" : "accent"}
                size="sm"
                onClick={onContinue}
                className="gap-1"
              >
                {progress !== undefined && progress >= 100 ? (
                  <>
                    Review <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Continue
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {price !== undefined && (
                <span className="text-xl font-bold text-arc-navy-900">
                  ₱{price.toLocaleString()}
                </span>
              )}
              <Button variant="accent" size="sm" onClick={onEnroll} className="gap-1">
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
