"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export function useSortableList<T extends Record<string, any>>(
  data: T[],
  defaultKey: keyof T & string
) {
  const [sortKey, setSortKey] = useState<keyof T & string>(defaultKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const toggleSort = (key: string) => {
    const typedKey = key as keyof T & string;
    if (typedKey === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(typedKey);
      setSortDirection("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR", {
          numeric: true,
          sensitivity: "base",
        });
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [data, sortKey, sortDirection]);

  return { sorted, sortKey, sortDirection, toggleSort };
}
