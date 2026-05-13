export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          parent_id: string | null;
          head_id: string | null;
          name: string;
          sort_order: number;
          org_type: "global" | "country" | "region" | "store";
          country_code: string | null;
          currency_code: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["departments"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["departments"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          employee_no: string | null;
          full_name: string;
          email: string | null;
          department_id: string | null;
          manager_id: string | null;
          preferred_locale: "zh-CN" | "en" | null;
          status: "active" | "disabled";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; full_name: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      roles: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & { code: string; name: string };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
      };
      user_roles: {
        Row: {
          profile_id: string;
          role_id: string;
        };
        Insert: Database["public"]["Tables"]["user_roles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
      };
      shift_templates: {
        Row: {
          id: string;
          code: string;
          name: string;
          start_time: string | null;
          end_time: string | null;
          grace_minutes: number;
          crosses_day: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_templates"]["Row"]> & { code: string; name: string };
        Update: Partial<Database["public"]["Tables"]["shift_templates"]["Row"]>;
      };
      schedule_imports: {
        Row: {
          id: string;
          uploaded_by: string | null;
          file_name: string;
          target_month: string | null;
          duplicate_mode: "overwrite" | "skip";
          total_rows: number;
          success_rows: number;
          failed_rows: number;
          errors: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schedule_imports"]["Row"]> & {
          file_name: string;
          duplicate_mode: "overwrite" | "skip";
        };
        Update: Partial<Database["public"]["Tables"]["schedule_imports"]["Row"]>;
      };
      schedules: {
        Row: {
          id: string;
          profile_id: string;
          work_date: string;
          shift_template_id: string | null;
          schedule_type: "work" | "rest" | "leave" | "holiday";
          import_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schedules"]["Row"]> & { profile_id: string; work_date: string };
        Update: Partial<Database["public"]["Tables"]["schedules"]["Row"]>;
      };
      attendance_records: {
        Row: {
          id: string;
          profile_id: string;
          punch_time: string;
          punch_type: string;
          location: Json | null;
          device_info: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance_records"]["Row"]> & { profile_id: string; punch_time: string; punch_type: string };
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Row"]>;
      };
      attendance_daily_summaries: {
        Row: {
          id: string;
          profile_id: string;
          work_date: string;
          schedule_id: string | null;
          status: "normal" | "late" | "early_leave" | "missing_punch" | "absent" | "leave" | "overtime";
          first_in: string | null;
          last_out: string | null;
          minutes_late: number;
          minutes_early_leave: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance_daily_summaries"]["Row"]> & { profile_id: string; work_date: string; status: Database["public"]["Tables"]["attendance_daily_summaries"]["Row"]["status"] };
        Update: Partial<Database["public"]["Tables"]["attendance_daily_summaries"]["Row"]>;
      };
      approval_templates: {
        Row: {
          id: string;
          name: string;
          request_type: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_templates"]["Row"]> & { name: string; request_type: string };
        Update: Partial<Database["public"]["Tables"]["approval_templates"]["Row"]>;
      };
      approval_template_steps: {
        Row: {
          id: string;
          template_id: string;
          step_order: number;
          name: string;
          approver_type: "direct_manager" | "department_head" | "role" | "user";
          role_code: string | null;
          approver_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_template_steps"]["Row"]> & { template_id: string; step_order: number; name: string; approver_type: Database["public"]["Tables"]["approval_template_steps"]["Row"]["approver_type"] };
        Update: Partial<Database["public"]["Tables"]["approval_template_steps"]["Row"]>;
      };
      approval_requests: {
        Row: {
          id: string;
          requester_id: string;
          type: string;
          title: string;
          payload: Json;
          status: "draft" | "submitted" | "waiting" | "pending" | "approved" | "rejected" | "cancelled";
          submitted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_requests"]["Row"]> & { requester_id: string; type: string; title: string };
        Update: Partial<Database["public"]["Tables"]["approval_requests"]["Row"]>;
      };
      approval_steps: {
        Row: {
          id: string;
          request_id: string;
          template_step_id: string | null;
          approver_id: string | null;
          approver_type: "direct_manager" | "department_head" | "role" | "user";
          role_code: string | null;
          step_order: number;
          status: "draft" | "submitted" | "waiting" | "pending" | "approved" | "rejected" | "cancelled";
          comment: string | null;
          acted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_steps"]["Row"]> & { request_id: string; approver_type: Database["public"]["Tables"]["approval_steps"]["Row"]["approver_type"]; step_order: number };
        Update: Partial<Database["public"]["Tables"]["approval_steps"]["Row"]>;
      };
      admin_data_uploads: {
        Row: {
          id: string;
          dataset: "sales" | "customer" | "target" | "exchange";
          uploaded_by: string | null;
          file_name: string;
          total_rows: number;
          success_rows: number;
          failed_rows: number;
          errors: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_data_uploads"]["Row"]> & {
          dataset: "sales" | "customer" | "target" | "exchange";
          file_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_data_uploads"]["Row"]>;
      };
      sales_records: {
        Row: AdminBusinessRecordRow;
        Insert: AdminBusinessRecordInsert;
        Update: Partial<AdminBusinessRecordRow>;
      };
      customer_records: {
        Row: AdminCustomerRecordRow;
        Insert: AdminCustomerRecordInsert;
        Update: Partial<AdminCustomerRecordRow>;
      };
      store_daily_targets: {
        Row: StoreDailyTargetRow;
        Insert: StoreDailyTargetInsert;
        Update: Partial<StoreDailyTargetRow>;
      };
      exchange_rates: {
        Row: ExchangeRateRow;
        Insert: ExchangeRateInsert;
        Update: Partial<ExchangeRateRow>;
      };
      ops_tasks: {
        Row: OpsTaskRow;
        Insert: OpsTaskInsert;
        Update: Partial<OpsTaskRow>;
      };
      admin_view_configs: {
        Row: {
          id: string;
          dataset: "sales" | "customer" | "target";
          config: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_view_configs"]["Row"]> & {
          dataset: "sales" | "customer" | "target";
          config: Json;
        };
        Update: Partial<Database["public"]["Tables"]["admin_view_configs"]["Row"]>;
      };
      admin_report_configs: {
        Row: {
          id: string;
          dataset: "sales" | "customer" | "target";
          title: string;
          kind: "detail" | "aggregate";
          config: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_report_configs"]["Row"]> & {
          dataset: "sales" | "customer" | "target";
          title: string;
          kind: "detail" | "aggregate";
          config: Json;
        };
        Update: Partial<Database["public"]["Tables"]["admin_report_configs"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          title: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & { recipient_id: string; title: string; body: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
  };
};

export type AdminBusinessRecordRow = {
  id: string;
  record_date: string;
  org_unit: string | null;
  employee_no: string | null;
  person_name: string | null;
  amount: number;
  quantity: number | null;
  category: string | null;
  reference_no: string | null;
  remark: string | null;
  sale_type: string | null;
  sale_category: string | null;
  item_no: string | null;
  item_name: string | null;
  standard_price: number | null;
  receivable_amount: number | null;
  payment_method: string | null;
  payment_amount: number | null;
  cash_payment_amount: number | null;
  equity_payment_amount: number | null;
  related_equity: string | null;
  equity_book_change: number | null;
  book_unit: string | null;
  accounting_amount: number | null;
  equity_store: string | null;
  employee_name: string | null;
  actual_performance: number | null;
  assignment_type: string | null;
  service_role: string | null;
  employee_department: string | null;
  customer_name: string | null;
  customer_no: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  referrer: string | null;
  document_no: string | null;
  document_type: string | null;
  customer_gender: string | null;
  visit_channel: string | null;
  cashier: string | null;
  accounting_date: string | null;
  operation_time: string | null;
  currency_code: string | null;
  exchange_rate_to_cny: number | null;
  amount_cny: number | null;
  receivable_amount_cny: number | null;
  payment_amount_cny: number | null;
  equity_amount_cny: number | null;
  service_amount_cny: number | null;
  raw_data: Json;
  upload_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminBusinessRecordInsert = Partial<AdminBusinessRecordRow> & {
  record_date: string;
};

export type AdminCustomerRecordRow = {
  id: string;
  customer_name: string;
  customer_no: string | null;
  card_no: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  tags: string | null;
  channel: string | null;
  referrer: string | null;
  advisor: string | null;
  last_consumed_on: string | null;
  total_consumptions: number | null;
  created_on: string | null;
  source: string | null;
  org_unit: string | null;
  remark: string | null;
  raw_data: Json;
  upload_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminCustomerRecordInsert = Partial<AdminCustomerRecordRow> & {
  customer_name: string;
};

export type StoreDailyTargetRow = {
  id: string;
  target_date: string;
  org_unit: string;
  target_new_customers: number;
  target_equity_sales_amount: number;
  target_service_sales_amount: number;
  currency_code: string | null;
  exchange_rate_to_cny: number | null;
  target_equity_sales_amount_cny: number | null;
  target_service_sales_amount_cny: number | null;
  remark: string | null;
  raw_data: Json;
  upload_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreDailyTargetInsert = Partial<StoreDailyTargetRow> & {
  target_date: string;
  org_unit: string;
};

export type ExchangeRateRow = {
  id: string;
  period_month: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source_file: string | null;
  raw_data: Json;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExchangeRateInsert = Partial<ExchangeRateRow> & {
  period_month: string;
  from_currency: string;
  to_currency: string;
  rate: number;
};

export type OpsTaskRow = {
  id: string;
  task_date: string;
  org_unit: string;
  task_type: "sales_alert" | "new_customer_alert" | "equity_sales_alert" | "service_sales_alert";
  title: string;
  summary: string;
  reason_snapshot: Json;
  assignee_profile_id: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  due_at: string | null;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OpsTaskInsert = Partial<OpsTaskRow> & {
  task_date: string;
  org_unit: string;
  task_type: OpsTaskRow["task_type"];
  title: string;
  summary: string;
};
