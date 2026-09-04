"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

// ---------------------------------------------------------------------------
// AdminPagination — shared pagination control used across admin list pages.
// Follows the ARC visual language used by /admin/programs (spacing, borders,
// focus rings, typography) so every admin table reads as the same system.
// ---------------------------------------------------------------------------

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = "items",
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const first = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const last = Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-arc-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-arc-slate-500">
        Showing{" "}
        <span className="font-semibold text-arc-navy-900">
          {total === 0 ? 0 : first}–{last}
        </span>{" "}
        of <span className="font-semibold text-arc-navy-900">{total}</span>{" "}
        {itemLabel}
      </p>

      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-9 rounded-lg border border-arc-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 px-2 text-center text-sm text-arc-slate-500 tabular-nums">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}