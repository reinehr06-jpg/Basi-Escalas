export interface ReportFilterRule {
  field: string;
  operator: string;
  value: any;
  valueEnd?: any;
}

export interface ReportFilterOption {
  attribute: string;
  type: string;
}

export interface ReportExportableField {
  value: string;
  label: string;
  type: "string" | "date" | "number" | "boolean" | "expand" | "array_join" | "datetime";
  fields?: string[];
}

export interface ReportModelsResponse {
  models: string[];
}

export interface ReportFieldsResponse {
  fields: Record<string, ReportExportableField>;
  filters: ReportFilterOption[];
}

export interface ReportCountPayload {
  model: string;
  startDate?: string;
  endDate?: string;
  filters?: ReportFilterRule[];
}

export interface ReportCountResponse {
  total: number;
}

export interface ReportExportPayload {
  model: string;
  columns: string[];
  startDate?: string;
  endDate?: string;
  filters?: ReportFilterRule[];
  page?: number;
  limit?: number;
  all?: boolean;
}

export interface ReportExportResponse {
  data: Record<string, any>[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface SavedReportItem {
  id: string;
  name: string;
  description: string;
  module: string;
  generatedBy: string;
  dateTime: string;
  format: "Excel" | "PDF" | "CSV" | "Web";
  status: "Completed" | "Processing" | "Error";
  totalRecords: number;
  payload?: {
    model: string;
    columns: string[];
    startDate?: string;
    endDate?: string;
    filters?: ReportFilterRule[];
  };
}

