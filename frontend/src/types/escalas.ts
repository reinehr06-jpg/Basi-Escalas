/**
 * Contratos do domínio de escalas. Espelham a API Laravel/MongoDB:
 * todo documento volta com `id` e `_id` iguais.
 */

export interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  from?: number;
  to?: number;
}

export interface Saved<T> {
  message: string;
  item: T;
}

export interface BaseDoc {
  id: string;
  _id: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

/* ── 01 Ministérios ─────────────────────────────────────────── */

export interface MinistrySettings {
  confirmation_deadline_hours?: number | null;
  min_rest_days?: number | null;
  max_per_month?: number | null;
}

export interface Ministry extends BaseDoc {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  leader_ids?: string[];
  status: "active" | "inactive";
  settings?: MinistrySettings | null;
}

export type MinistryPayload = Partial<Omit<Ministry, keyof BaseDoc>> & { name: string };

/* ── 02 Funções ─────────────────────────────────────────────── */

export interface MinistryFunction extends BaseDoc {
  ministry_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  required_skill_ids?: string[];
  default_quantity: number;
  min_quantity?: number;
  max_quantity?: number | null;
  is_leadership: boolean;
  order: number;
  status: "active" | "inactive";
}

export type FunctionPayload = Partial<Omit<MinistryFunction, keyof BaseDoc>> & {
  ministry_id: string;
  name: string;
};

/* ── 03 Voluntários ─────────────────────────────────────────── */

export type VolunteerStatus = "active" | "inactive" | "on_leave";

export interface Membership {
  ministry_id: string;
  function_ids: string[];
  is_leader?: boolean;
  since?: string | null;
}

export interface VolunteerSkill {
  skill_id: string;
  level?: string | null;
  certified_at?: string | null;
  expires_at?: string | null;
  evaluated_by?: string | null;
  training_id?: string | null;
}

export interface VolunteerPreferences {
  max_per_month?: number | null;
  min_rest_days?: number | null;
  preferred_weekdays?: number[];
}

export interface Volunteer extends BaseDoc {
  name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: "male" | "female" | "other" | null;
  photo_url?: string | null;
  status: VolunteerStatus;
  joined_at?: string | null;
  notes?: string | null;
  external_ref?: { source?: string; id?: string | null; synced_at?: string } | null;
  memberships?: Membership[];
  skills?: VolunteerSkill[];
  preferences?: VolunteerPreferences | null;
}

export type VolunteerPayload = Partial<Omit<Volunteer, keyof BaseDoc>> & { name: string };

export interface VolunteerStats {
  total: number;
  upcoming: number;
  confirmed: number;
  declined: number;
  present: number;
  absent: number;
  last_served_at?: string | null;
}

/* ── 04 Calendário ──────────────────────────────────────────── */

export type EventType = "service" | "rehearsal" | "event" | "meeting" | "other";
export type EventStatus = "planned" | "confirmed" | "cancelled" | "done";

export interface Recurrence {
  frequency: "none" | "daily" | "weekly" | "monthly";
  interval?: number;
  weekdays?: number[];
  count?: number;
  until?: string | null;
}

export interface CalendarEvent extends BaseDoc {
  series_id?: string | null;
  title: string;
  description?: string | null;
  type: EventType;
  starts_at: string;
  ends_at?: string | null;
  all_day?: boolean;
  location?: string | null;
  color?: string | null;
  ministry_ids?: string[];
  recurrence?: Recurrence | null;
  status: EventStatus;
  cancellation_reason?: string | null;
}

export type EventPayload = Partial<Omit<CalendarEvent, keyof BaseDoc>> & {
  title: string;
  starts_at: string;
};

/* ── 05 Escalas ─────────────────────────────────────────────── */

export type ScheduleStatus = "draft" | "published" | "closed" | "cancelled";

export interface ScheduleSlotInput {
  function_id: string;
  needed: number;
}

export interface Schedule extends BaseDoc {
  event_id: string;
  ministry_id: string;
  name: string;
  notes?: string | null;
  status: ScheduleStatus;
  slots?: ScheduleSlotInput[];
  confirmation_deadline_at?: string | null;
  published_at?: string | null;
  closed_at?: string | null;
}

export type AssignmentStatus = "pending" | "confirmed" | "declined" | "replaced" | "cancelled";
export type AttendanceStatus = "pending" | "present" | "late" | "absent" | "justified";

export interface SlotAssignment {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  volunteer_photo_url?: string | null;
  volunteer_phone?: string | null;
  status: AssignmentStatus;
  attendance_status: AttendanceStatus;
  confirmed_at?: string | null;
  declined_at?: string | null;
  decline_reason?: string | null;
  checked_in_at?: string | null;
  notes?: string | null;
}

export interface ScheduleSlot {
  function_id: string;
  function_name: string;
  function_color?: string | null;
  is_leadership: boolean;
  needed: number;
  filled: number;
  missing: number;
  assignments: SlotAssignment[];
}

export interface ScheduleSummary {
  needed: number;
  filled: number;
  missing: number;
  completion: number;
}

export interface ScheduleDetail {
  message?: string;
  item: Schedule;
  event: CalendarEvent | null;
  ministry: Ministry | null;
  slots: ScheduleSlot[];
  summary: ScheduleSummary;
  created?: number;
  unfilled?: { function_id: string; function_name: string; missing: number }[];
}

export interface CandidateFlag {
  code: string;
  message: string;
}

export interface Candidate {
  volunteer: {
    id: string;
    name: string;
    photo_url?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string;
  };
  eligible: boolean;
  blockers: CandidateFlag[];
  warnings: CandidateFlag[];
  load_30d: number;
  load_month: number;
  last_served_at?: string | null;
  score: number;
}

export interface Assignment extends BaseDoc {
  schedule_id: string;
  event_id: string;
  ministry_id: string;
  function_id: string;
  volunteer_id: string;
  starts_at: string;
  status: AssignmentStatus;
  attendance_status: AttendanceStatus;
  notes?: string | null;
  confirmed_at?: string | null;
  declined_at?: string | null;
  decline_reason?: string | null;
  checked_in_at?: string | null;
  attendance_note?: string | null;
}

/** Linha de escalação já com os nomes resolvidos pela API. */
export interface AssignmentRow extends Assignment {
  volunteer_name?: string | null;
  volunteer_photo_url?: string | null;
  volunteer_phone?: string | null;
  event_title?: string | null;
  event_location?: string | null;
  event_starts_at?: string | null;
  ministry_name?: string | null;
  ministry_color?: string | null;
  function_name?: string | null;
}

/* ── 07 Disponibilidade e ausências ─────────────────────────── */

export interface Availability extends BaseDoc {
  volunteer_id: string;
  weekday: number;
  start_time?: string | null;
  end_time?: string | null;
  is_available: boolean;
  ministry_id?: string | null;
  note?: string | null;
}

export type AbsenceStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Absence extends BaseDoc {
  volunteer_id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
  type: "personal" | "health" | "travel" | "study" | "work" | "other";
  status: AbsenceStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
}

export interface AbsenceRow extends Absence {
  volunteer_name?: string | null;
  volunteer_photo_url?: string | null;
}

/* ── 09 Trocas ──────────────────────────────────────────────── */

export type SwapStatus = "open" | "accepted" | "approved" | "rejected" | "cancelled" | "expired";

export interface SwapRequest extends BaseDoc {
  assignment_id: string;
  event_id: string;
  ministry_id: string;
  requester_volunteer_id: string;
  target_volunteer_id?: string | null;
  target_assignment_id?: string | null;
  type: "swap" | "replacement";
  status: SwapStatus;
  reason: string;
  responses?: { volunteer_id: string; answer: "accepted" | "declined"; at: string }[];
  accepted_volunteer_id?: string | null;
  accepted_at?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  expires_at?: string | null;
}

/** Pedido de troca já com os nomes resolvidos pela API. */
export interface SwapRow extends SwapRequest {
  requester_name?: string | null;
  accepted_name?: string | null;
  event_title?: string | null;
  event_starts_at?: string | null;
  ministry_name?: string | null;
  ministry_color?: string | null;
}

/* ── 13 Habilidades e capacitação ───────────────────────────── */

export interface Skill extends BaseDoc {
  name: string;
  description?: string | null;
  category?: string | null;
  ministry_id?: string | null;
  levels?: string[];
  requires_certification: boolean;
  validity_months?: number | null;
  status: "active" | "inactive";
}

export interface TrainingParticipant {
  volunteer_id: string;
  status: "enrolled" | "completed" | "failed" | "absent";
  score?: number | null;
  level?: string | null;
  completed_at?: string | null;
}

export interface Training extends BaseDoc {
  name: string;
  description?: string | null;
  ministry_id?: string | null;
  skill_ids?: string[];
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  instructor?: string | null;
  capacity?: number | null;
  participants?: TrainingParticipant[];
  status: "scheduled" | "running" | "completed" | "cancelled";
}

/* ── 06 / 14 / 15 Indicadores ───────────────────────────────── */

export interface DashboardSummary {
  period: { from: string; to: string };
  cards: {
    events: number;
    schedules: number;
    drafts: number;
    volunteers_active: number;
    ministries: number;
    open_swaps: number;
    pending_absences: number;
  };
  coverage: { needed: number; filled: number; missing: number; rate: number };
  confirmation: { confirmed: number; pending: number; declined: number; rate: number };
  attendance: { present: number; absent: number; rate: number };
  by_ministry: {
    ministry_id: string;
    name: string;
    color: string;
    schedules: number;
    needed: number;
    filled: number;
    missing: number;
    confirmed: number;
    rate: number;
  }[];
  upcoming: {
    id: string;
    title: string;
    type: EventType;
    starts_at: string;
    location?: string | null;
    needed: number;
    filled: number;
    missing: number;
  }[];
  attention: {
    schedule_id: string;
    name: string;
    status: ScheduleStatus;
    event_title?: string | null;
    starts_at?: string | null;
    needed: number;
    filled: number;
    missing: number;
  }[];
}

export interface MyAssignment {
  id: string;
  status: AssignmentStatus;
  attendance_status: AttendanceStatus;
  starts_at: string;
  event_id: string;
  event_title?: string | null;
  event_location?: string | null;
  ministry_name?: string | null;
  ministry_color?: string | null;
  function_name?: string | null;
  schedule_status?: ScheduleStatus | null;
  confirmation_deadline_at?: string | null;
  can_confirm: boolean;
}

export interface MyDashboard {
  volunteer: Volunteer | null;
  ministries: Ministry[];
  next_assignments: MyAssignment[];
  pending_confirmations: number;
  open_swaps: number;
  swaps_open_to_me: number;
  absences: Absence[];
  availabilities: Availability[];
  stats: { served_total: number; this_year: number; upcoming: number };
}

/* ── 16 Configurações ───────────────────────────────────────── */

export interface SettingRow {
  key: string;
  group: string;
  value: unknown;
  default: unknown;
  is_custom: boolean;
}

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
