"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FunctionForm from "@/components/forms/escalas/FunctionForm";

function NewFunctionContent() {
  const params = useSearchParams();
  return <FunctionForm defaultMinistryId={params.get("ministry_id") ?? undefined} />;
}

export default function NewFunctionPage() {
  return (
    <Suspense fallback={<main className="p-6 flex-1" />}>
      <NewFunctionContent />
    </Suspense>
  );
}
