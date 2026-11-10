"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BackButton({
  href = "/settings",
  title = "Voltar",
  className = "",
}: {
  href?: string;
  title?: string;
  className?: string;
}) {
  const defaultClasses = "w-[42px] h-[42px] md:w-[44px] md:h-[44px] rounded-[14px] bg-white border border-white text-[#6D28D9] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-[#F4EEFF] hover:scale-[1.02] transition-all duration-200 active:scale-[0.97] cursor-pointer";

  return (
    <Link
      href={href}
      className={className ? `${defaultClasses} ${className}` : defaultClasses}
      title={title}
      aria-label={title}
    >
      <ChevronLeft className="w-5 h-5 text-[#6D28D9]" strokeWidth={2.4} />
    </Link>
  );
}
