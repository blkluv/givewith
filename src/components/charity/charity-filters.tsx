"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHARITY_CAUSES, CAUSE_LABELS, REGIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CharityFiltersProps {
  selectedCause: string | null;
  selectedRegion: string | null;
  selectedSort: string;
  onCauseChange: (cause: string | null) => void;
  onRegionChange: (region: string | null) => void;
  onSortChange: (sort: string) => void;
}

export function CharityFilters({
  selectedCause,
  selectedRegion,
  selectedSort,
  onCauseChange,
  onRegionChange,
  onSortChange,
}: CharityFiltersProps) {
  const chipClass = (active: boolean) =>
    cn(
      "border px-3 py-1.5 type-caption transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={chipClass(selectedCause === null)}
          onClick={() => onCauseChange(null)}
        >
          All causes
        </button>
        {CHARITY_CAUSES.map((cause) => (
          <button
            key={cause}
            type="button"
            className={chipClass(selectedCause === cause)}
            onClick={() =>
              onCauseChange(selectedCause === cause ? null : cause)
            }
          >
            {CAUSE_LABELS[cause]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={selectedRegion || "all"}
          onValueChange={(v: string | null) =>
            onRegionChange(!v || v === "all" ? null : v)
          }
        >
          <SelectTrigger className="h-9 w-[180px] border-border bg-card text-xs">
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSort}
          onValueChange={(v: string | null) => {
            if (v) onSortChange(v);
          }}
        >
          <SelectTrigger className="h-9 w-[180px] border-border bg-card text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="impactScore">Impact score</SelectItem>
            <SelectItem value="overheadRatio">Lowest overhead</SelectItem>
            <SelectItem value="fundingRaised">Most funded</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
