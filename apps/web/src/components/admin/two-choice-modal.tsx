"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui";
import { X } from "lucide-react";

interface Choice {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconBg?: string;
}

interface TwoChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  choices: Choice[];
  onSelect: (choiceId: string) => void;
}

export function TwoChoiceModal({
  isOpen,
  onClose,
  title,
  choices,
  onSelect,
}: TwoChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200">
          <h2 className="text-lg font-bold text-arc-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-arc-slate-500" />
          </button>
        </div>

        {/* Choices */}
        <div className="p-6 grid gap-4">
          {choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onSelect(choice.id)}
              className="p-6 rounded-xl border-2 border-arc-slate-200 hover:border-arc-orange-300 hover:bg-arc-orange-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    choice.iconBg || "bg-arc-orange-100"
                  }`}
                >
                  {choice.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-arc-navy-900 group-hover:text-arc-orange-600 transition-colors">
                    {choice.title}
                  </h3>
                  <p className="text-sm text-arc-slate-500 mt-1">
                    {choice.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TwoChoiceModal;
