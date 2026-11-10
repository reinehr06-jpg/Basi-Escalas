import { api } from "@/lib/api";
import { qs } from "@/lib/queryString";

export interface ReportPeriod {
  from?: string;
  to?: string;
  ministry_id?: string;
}

export interface VolunteerReportRow {
  volunteer_id: string;
  name: string;
  photo_url?: string | null;
  scheduled: number;
  confirmed: number;
  declined: number;
  present: number;
  absent: number;
  confirmation_rate: number;
  attendance_rate: number;
  last_served_at?: string | null;
}

export interface MinistryReportRow {
  ministry_id: string;
  name: string;
  color?: string | null;
  volunteers: number;
  functions: number;
  schedules: number;
  needed: number;
  filled: number;
  missing: number;
  coverage_rate: number;
  confirmed: number;
  declined: number;
  present: number;
  absent: number;
  attendance_rate: number;
}

export interface AttendanceReportRow {
  event_id: string;
  title: string;
  type: string;
  starts_at: string;
  scheduled: number;
  confirmed: number;
  present: number;
  late: number;
  absent: number;
  attendance_rate: number | null;
}

export const EscalasReportsService = {
  volunteers: (params?: ReportPeriod) =>
    api.get<{ period: { from: string; to: string }; data: VolunteerReportRow[]; totals: Record<string, number> }>(
      `/reports/volunteers${qs(params)}`,
    ),

  ministries: (params?: ReportPeriod) =>
    api.get<{ period: { from: string; to: string }; data: MinistryReportRow[] }>(
      `/reports/ministries${qs(params)}`,
    ),

  attendance: (params?: ReportPeriod) =>
    api.get<{ period: { from: string; to: string }; data: AttendanceReportRow[] }>(
      `/reports/attendance${qs(params)}`,
    ),

  swaps: (params?: ReportPeriod) =>
    api.get<{
      period: { from: string; to: string };
      totals: Record<string, number>;
      by_ministry: { ministry_id: string; name: string; total: number }[];
      top_requesters: { volunteer_id: string; name: string; total: number }[];
    }>(`/reports/swaps${qs(params)}`),
};
