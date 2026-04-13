"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CharityCard, type CharityData } from "./charity-card";
import { CharityFilters } from "./charity-filters";

export function CharityGrid() {
  const [charities, setCharities] = useState<CharityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cause, setCause] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [sort, setSort] = useState("impactScore");

  useEffect(() => {
    const fetchCharities = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (cause) params.set("cause", cause);
      if (region) params.set("region", region);
      params.set("sort", sort);

      try {
        const res = await fetch(`/api/charities?${params}`);
        const data = await res.json();
        setCharities(data.charities || []);
      } catch (error) {
        console.error("Failed to fetch charities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharities();
  }, [cause, region, sort]);

  return (
    <div className="space-y-8">
      <CharityFilters
        selectedCause={cause}
        selectedRegion={region}
        selectedSort={sort}
        onCauseChange={setCause}
        onRegionChange={setRegion}
        onSortChange={setSort}
      />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[360px] animate-pulse border border-border bg-secondary"
            />
          ))}
        </div>
      ) : charities.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="type-body text-muted-foreground">
            No charities found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.04 } },
          }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {charities.map((charity) => (
            <CharityCard key={charity.id} charity={charity} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
