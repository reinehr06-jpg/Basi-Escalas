"use client";

import React from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Cor derivada do nome: estável entre telas, sem precisar guardar nada. */
function tint(name: string) {
  const palette = ["#6D28D9", "#0EA5E9", "#F59E0B", "#EC4899", "#10B981", "#6366F1"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export default function VolunteerAvatar({
  name,
  photoUrl,
  size = 28,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const color = tint(name || "?");

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0 border border-[#E5E7EB]"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
      title={name}
      aria-hidden
    >
      {initials(name || "?")}
    </span>
  );
}
