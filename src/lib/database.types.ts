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
