// Kept in the Supabase generated-types shape; replace with CLI output when a project exists.
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  profession: string | null;
  profession_id: string | null;
  phone: string | null;
  city: string | null;
  logo_url: string | null;
  default_profit_margin: number;
  minimum_profit_margin: number;
  currency: string;
  onboarding_step: OnboardingStep;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type OnboardingStep = 1 | 2 | 3 | 4;
export type CostCategory = "material" | "labor" | "transport" | "consumable" | "overhead" | "other";
export type CostUnit = "piece" | "liter" | "kilogram" | "meter" | "square_meter" | "hour" | "day" | "kilometer" | "fixed" | "percent";

export type Profession = {
  id: string; slug: string; name: string; description: string | null; icon: string | null;
  is_active: boolean; is_public: boolean; category: string; current_version: number | null;
  sort_order: number; created_at: string; updated_at: string;
};
export type ProfessionTemplateVersion = { id: string; profession_id: string; version: number;
  status: "draft" | "published" | "archived"; template: Record<string, unknown>;
  created_at: string; published_at: string | null; published_by: string | null };

export type ProfessionCostTemplate = {
  id: string; profession_id: string; key: string; name: string; description: string | null;
  category: CostCategory; unit: CostUnit; input_type: "currency" | "number" | "percent";
  default_value: number; is_required: boolean; is_active: boolean; sort_order: number;
  created_at: string; updated_at: string;
};

export type BusinessCostItem = {
  id: string; business_id: string; template_id: string | null; key: string; name: string;
  category: CostCategory; unit: CostUnit; unit_cost: number; metadata: Record<string, unknown>;
  is_active: boolean; sort_order: number; created_at: string; updated_at: string;
};

export type BusinessProfessionSettings = {
  id: string; business_id: string; profession_id: string; settings: Record<string, unknown>;
  created_at: string; updated_at: string;
};

export type CustomerSource = "referral" | "instagram" | "google" | "whatsapp" | "existing_customer" | "other";
export type Customer = {
  id: string; business_id: string; name: string; phone: string | null; email: string | null;
  company_name: string | null; address: string | null; district: string | null; city: string | null;
  notes: string | null; source: CustomerSource | null; is_archived: boolean;
  created_at: string; updated_at: string;
};
export type CustomerInsert = {
  business_id: string; name: string; phone?: string | null; email?: string | null;
  company_name?: string | null; address?: string | null; district?: string | null; city?: string | null;
  notes?: string | null; source?: CustomerSource | null; is_archived?: boolean;
};
export type CustomerUpdate = Omit<Partial<CustomerInsert>, "business_id"> & { is_archived?: boolean };
export type JobStatus = "draft" | "calculated" | "quoted" | "accepted" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type PricingStatus = "target" | "acceptable" | "below_minimum" | "loss";
export type Job = {
  id: string; business_id: string; customer_id: string | null; profession_id: string; title: string;
  description: string | null; status: JobStatus; estimated_cost: number; actual_cost: number | null;
  currency: string; calculated_at: string | null; created_at: string; updated_at: string;
  target_profit_margin: number | null; minimum_profit_margin: number | null;
  recommended_sale_price_exact: number | null; recommended_sale_price: number | null;
  minimum_sale_price_exact: number | null; minimum_sale_price: number | null;
  selected_sale_price: number | null; selected_price_mode: "recommended" | "custom" | null;
  estimated_profit: number | null; estimated_profit_margin: number | null;
  pricing_status: PricingStatus | null; priced_at: string | null; pricing_cost_changed: boolean;
  accepted_quote_id: string | null; started_at: string | null; completed_at: string | null;
  actual_profit: number | null; actual_profit_margin: number | null; completion_notes: string | null;
  input_data: Record<string, unknown>; profession_template_version: number | null;
  template_snapshot: Record<string, unknown> | null; calculation_snapshot: Record<string, unknown> | null;
  settings_snapshot: Record<string, unknown> | null;
};
export type PainterJobDetail = {
  id: string; job_id: string; wall_area: number; ceiling_area: number; wall_coats: number;
  ceiling_coats: number; primer_required: boolean; primer_coats: number; putty_required: boolean;
  putty_area: number; days: number; master_count: number; helper_count: number;
  include_consumables: boolean; include_transport: boolean; waste_percentage: number; notes: string | null;
  technical_settings_snapshot: Record<string, unknown>; extra_costs: Array<Record<string, unknown>>;
  created_at: string; updated_at: string;
};
export type JobCostBreakdown = {
  id: string; job_id: string; cost_item_id: string | null; name: string; category: CostCategory;
  unit: CostUnit; quantity: number; unit_cost: number; total_cost: number;
  source_type: "material" | "labor" | "fixed" | "extra";
  metadata: Record<string, unknown>; created_at: string;
};
export type ActualJobCost = {
  id: string; job_id: string; estimated_breakdown_id: string | null; name: string; category: CostCategory;
  unit: CostUnit; quantity: number; unit_cost: number; total_cost: number; notes: string | null;
  created_at: string; updated_at: string;
};
export type QuoteStatus = "draft" | "ready" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "cancelled";
export type Quote = {
  id: string; business_id: string; job_id: string; customer_id: string | null; quote_number: string;
  status: QuoteStatus; title: string; description: string | null; sale_price: number;
  estimated_cost_snapshot: number; estimated_profit_snapshot: number; profit_margin_snapshot: number | null;
  target_margin_snapshot: number; minimum_margin_snapshot: number;
  currency: string; valid_until: string; estimated_duration_text: string | null;
  payment_terms: string | null; notes: string | null; public_token: string;
  revision_number: number; parent_quote_id: string | null;
  sent_at: string | null; viewed_at: string | null; accepted_at: string | null; rejected_at: string | null;
  view_count: number; last_viewed_at: string | null;
  rejection_reason: string | null; rejection_note: string | null; accepted_via: string | null;
  created_at: string; updated_at: string;
};
export type QuoteItem = {
  id: string; quote_id: string; name: string; description: string | null;
  quantity: number | null; unit: string | null; unit_price: number | null; total_price: number | null;
  is_optional: boolean; sort_order: number; created_at: string; updated_at: string;
};
export type QuoteExclusion = { id: string; quote_id: string; text: string; sort_order: number; created_at: string };
export type PlanId = "free" | "usta" | "pro";
export type PlanFeature = "public_quotes" | "pdf" | "whatsapp" | "actual_profit" | "advanced_reports" | "remove_branding" | "business_logo";
export type PlanLimit = "monthly_quotes" | "active_customers" | "businesses" | "users";
export type Plan = { id: PlanId; name: string; description: string; monthly_price_kurus: number; yearly_price_kurus: number; currency: "TRY"; features: Record<PlanFeature, boolean>; limits: Record<PlanLimit, number | null>; sort_order: number; is_active: boolean; created_at: string; updated_at: string };
export type SubscriptionStatus = "free" | "trialing" | "active" | "past_due" | "cancelled" | "expired" | "incomplete";
export type Subscription = { id: string; business_id: string; plan_id: PlanId; status: SubscriptionStatus; billing_interval: "monthly" | "yearly" | null; provider: string | null; provider_customer_id: string | null; provider_subscription_id: string | null; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; pending_plan_id: PlanId | null; last_provider_event_at: string | null; created_at: string; updated_at: string };
export type BillingEvent = { id: string; provider: string; provider_event_id: string; business_id: string | null; event_type: string; payload_hash: string; occurred_at: string; processed_at: string; created_at: string };

export type Database = {
  public: {
    Tables: {
      feedback: { Row: { id: string; business_id: string | null; user_id: string | null; type: "bug" | "idea" | "general"; message: string; page: string; created_at: string };
        Insert: { id?: string; business_id: string; user_id: string; type: "bug" | "idea" | "general"; message: string; page: string; created_at?: string };
        Update: never; Relationships: [] };
      plans: { Row: Plan; Insert: Plan; Update: Partial<Plan>; Relationships: [] };
      subscriptions: { Row: Subscription; Insert: Subscription; Update: Partial<Subscription>; Relationships: [] };
      billing_events: { Row: BillingEvent; Insert: BillingEvent; Update: Partial<BillingEvent>; Relationships: [] };
      profiles: {
        Row: Profile;
        Insert: { id: string; first_name?: string; last_name?: string; email: string; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { first_name?: string; last_name?: string; email?: string; avatar_url?: string | null; updated_at?: string };
        Relationships: [];
      };
      businesses: {
        Row: Business;
        Insert: { id?: string; owner_id: string; name: string; profession?: string | null; profession_id?: string | null; phone?: string | null; city?: string | null; logo_url?: string | null; default_profit_margin?: number; minimum_profit_margin?: number; currency?: string; onboarding_step?: OnboardingStep; onboarding_completed?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; profession?: string | null; profession_id?: string | null; phone?: string | null; city?: string | null; logo_url?: string | null; default_profit_margin?: number; minimum_profit_margin?: number; currency?: string; onboarding_step?: OnboardingStep; onboarding_completed?: boolean; updated_at?: string };
        Relationships: [{ foreignKeyName: "businesses_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      professions: {
        Row: Profession;
        Insert: { id?: string; slug: string; name: string; description?: string | null; icon?: string | null; category?: string; current_version?: number | null; is_public?: boolean; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { slug?: string; name?: string; description?: string | null; icon?: string | null; category?: string; current_version?: number | null; is_public?: boolean; is_active?: boolean; sort_order?: number; updated_at?: string };
        Relationships: [];
      };
      profession_template_versions: { Row: ProfessionTemplateVersion;
        Insert: { id?: string; profession_id: string; version: number; status: ProfessionTemplateVersion["status"]; template: Record<string, unknown>; created_at?: string; published_at?: string | null; published_by?: string | null };
        Update: Partial<Pick<ProfessionTemplateVersion, "status" | "template" | "published_at" | "published_by">>;
        Relationships: [] };
      platform_admins: { Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string }; Update: never; Relationships: [] };
      profession_cost_templates: {
        Row: ProfessionCostTemplate;
        Insert: { id?: string; profession_id: string; key: string; name: string; description?: string | null; category: CostCategory; unit: CostUnit; input_type?: "currency" | "number" | "percent"; default_value?: number; is_required?: boolean; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { key?: string; name?: string; description?: string | null; category?: CostCategory; unit?: CostUnit; input_type?: "currency" | "number" | "percent"; default_value?: number; is_required?: boolean; is_active?: boolean; sort_order?: number; updated_at?: string };
        Relationships: [{ foreignKeyName: "profession_cost_templates_profession_id_fkey"; columns: ["profession_id"]; isOneToOne: false; referencedRelation: "professions"; referencedColumns: ["id"] }];
      };
      business_cost_items: {
        Row: BusinessCostItem;
        Insert: { id?: string; business_id: string; template_id?: string | null; key: string; name: string; category: CostCategory; unit: CostUnit; unit_cost?: number; metadata?: Record<string, unknown>; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { template_id?: string | null; key?: string; name?: string; category?: CostCategory; unit?: CostUnit; unit_cost?: number; metadata?: Record<string, unknown>; is_active?: boolean; sort_order?: number; updated_at?: string };
        Relationships: [{ foreignKeyName: "business_cost_items_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }, { foreignKeyName: "business_cost_items_template_id_fkey"; columns: ["template_id"]; isOneToOne: false; referencedRelation: "profession_cost_templates"; referencedColumns: ["id"] }];
      };
      business_profession_settings: {
        Row: BusinessProfessionSettings;
        Insert: { id?: string; business_id: string; profession_id: string; settings?: Record<string, unknown>; created_at?: string; updated_at?: string };
        Update: { settings?: Record<string, unknown>; updated_at?: string };
        Relationships: [{ foreignKeyName: "business_profession_settings_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }, { foreignKeyName: "business_profession_settings_profession_id_fkey"; columns: ["profession_id"]; isOneToOne: false; referencedRelation: "professions"; referencedColumns: ["id"] }];
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert & { id?: string; created_at?: string; updated_at?: string };
        Update: CustomerUpdate & { updated_at?: string };
        Relationships: [{ foreignKeyName: "customers_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }];
      };
      jobs: {
        Row: Job;
        Insert: { id?: string; business_id: string; customer_id?: string | null; profession_id: string; title: string; description?: string | null; status?: JobStatus; estimated_cost?: number; actual_cost?: number | null; currency?: string; calculated_at?: string | null; created_at?: string; updated_at?: string } & Partial<Pick<Job, "target_profit_margin" | "minimum_profit_margin" | "recommended_sale_price_exact" | "recommended_sale_price" | "minimum_sale_price_exact" | "minimum_sale_price" | "selected_sale_price" | "selected_price_mode" | "estimated_profit" | "estimated_profit_margin" | "pricing_status" | "priced_at" | "pricing_cost_changed" | "input_data" | "profession_template_version" | "template_snapshot" | "calculation_snapshot" | "settings_snapshot">>;
        Update: { customer_id?: string | null; title?: string; description?: string | null; status?: JobStatus; estimated_cost?: number; actual_cost?: number | null; currency?: string; calculated_at?: string | null; updated_at?: string } & Partial<Pick<Job, "target_profit_margin" | "minimum_profit_margin" | "recommended_sale_price_exact" | "recommended_sale_price" | "minimum_sale_price_exact" | "minimum_sale_price" | "selected_sale_price" | "selected_price_mode" | "estimated_profit" | "estimated_profit_margin" | "pricing_status" | "priced_at" | "pricing_cost_changed" | "input_data" | "profession_template_version" | "template_snapshot" | "calculation_snapshot" | "settings_snapshot">>;
        Relationships: [{ foreignKeyName: "jobs_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }, { foreignKeyName: "jobs_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }];
      };
      painter_job_details: {
        Row: PainterJobDetail;
        Insert: Omit<PainterJobDetail, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<PainterJobDetail, "id" | "job_id" | "created_at">>;
        Relationships: [{ foreignKeyName: "painter_job_details_job_id_fkey"; columns: ["job_id"]; isOneToOne: true; referencedRelation: "jobs"; referencedColumns: ["id"] }];
      };
      job_cost_breakdown: {
        Row: JobCostBreakdown;
        Insert: Omit<JobCostBreakdown, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<JobCostBreakdown, "id" | "job_id" | "created_at">>;
        Relationships: [{ foreignKeyName: "job_cost_breakdown_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "jobs"; referencedColumns: ["id"] }, { foreignKeyName: "job_cost_breakdown_cost_item_id_fkey"; columns: ["cost_item_id"]; isOneToOne: false; referencedRelation: "business_cost_items"; referencedColumns: ["id"] }];
      };
      actual_job_costs: {
        Row: ActualJobCost;
        Insert: Omit<ActualJobCost, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ActualJobCost, "id" | "job_id" | "created_at">>;
        Relationships: [{ foreignKeyName: "actual_job_costs_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "jobs"; referencedColumns: ["id"] }];
      };
      quotes: {
        Row: Quote;
        Insert: Omit<Quote, "id" | "public_token" | "revision_number" | "parent_quote_id" | "sent_at" | "viewed_at" | "accepted_at" | "rejected_at" | "view_count" | "last_viewed_at" | "rejection_reason" | "rejection_note" | "accepted_via" | "created_at" | "updated_at"> & Partial<Pick<Quote, "id" | "public_token" | "revision_number" | "parent_quote_id" | "sent_at" | "viewed_at" | "accepted_at" | "rejected_at" | "view_count" | "last_viewed_at" | "rejection_reason" | "rejection_note" | "accepted_via" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Quote, "id" | "business_id" | "job_id" | "created_at">>;
        Relationships: [{ foreignKeyName: "quotes_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] }, { foreignKeyName: "quotes_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "jobs"; referencedColumns: ["id"] }, { foreignKeyName: "quotes_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }];
      };
      quote_items: {
        Row: QuoteItem;
        Insert: Omit<QuoteItem, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<QuoteItem, "id" | "quote_id" | "created_at">>;
        Relationships: [{ foreignKeyName: "quote_items_quote_id_fkey"; columns: ["quote_id"]; isOneToOne: false; referencedRelation: "quotes"; referencedColumns: ["id"] }];
      };
      quote_exclusions: {
        Row: QuoteExclusion;
        Insert: Omit<QuoteExclusion, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<QuoteExclusion, "id" | "quote_id" | "created_at">>;
        Relationships: [{ foreignKeyName: "quote_exclusions_quote_id_fkey"; columns: ["quote_id"]; isOneToOne: false; referencedRelation: "quotes"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consume_rate_limit: { Args: { p_scope: string; p_identity_hash: string; p_window_seconds: number; p_limit: number }; Returns: boolean };
      record_aggregate_event: { Args: { p_event: string; p_path: string; p_channel: string }; Returns: undefined };
      publish_profession_template: { Args: { p_admin_id: string; p_profession_id: string; p_version: number; p_template: Record<string, unknown> }; Returns: undefined };
      save_generic_job: { Args: { p_user_id: string; p_business_id: string; p_job_id: string | null; p_customer_id: string | null; p_title: string; p_description: string | null; p_profession_id: string; p_version: number; p_input_data: Record<string, unknown>; p_template_snapshot: Record<string, unknown>; p_settings_snapshot: Record<string, number>; p_calculation_snapshot: Record<string, unknown>; p_lines: Array<Record<string, unknown>>; p_total: number }; Returns: string };
      apply_verified_billing_event: { Args: { p_provider: string; p_event_id: string; p_event_type: string; p_payload_hash: string; p_occurred_at: string; p_business_id: string; p_plan_id: string; p_status: string; p_interval: string; p_customer_id: string | null; p_subscription_id: string; p_period_start: string; p_period_end: string; p_cancel_at_period_end: boolean }; Returns: boolean };
      ensure_my_cost_defaults: { Args: Record<string, never>; Returns: undefined };
      save_painter_job: { Args: { p_job_id: string | null; p_customer_id: string | null; p_title: string; p_description: string | null; p_details: Record<string, unknown>; p_extra_costs: Array<Record<string, unknown>> }; Returns: string };
      save_quote: { Args: { p_quote_id: string | null; p_job_id: string; p_status: "draft" | "ready"; p_title: string; p_description: string | null; p_items: Array<Record<string, unknown>>; p_exclusions: string[]; p_duration: string | null; p_payment_terms: string | null; p_valid_until: string; p_notes: string | null; p_sale_price: number | null; p_acknowledge_risk: boolean }; Returns: string };
      get_public_quote: { Args: { p_token: string }; Returns: Record<string, unknown> | null };
      mark_quote_sent: { Args: { p_quote_id: string }; Returns: undefined };
      mark_quote_viewed: { Args: { p_token: string; p_event_id: string }; Returns: boolean };
      respond_to_quote: { Args: { p_token: string; p_action: "accept" | "reject"; p_reason: string | null; p_note: string | null }; Returns: "accepted" | "rejected" };
      start_job: { Args: { p_job_id: string }; Returns: undefined };
      save_actual_job_costs: { Args: { p_job_id: string; p_lines: Array<Record<string, unknown>>; p_notes: string | null }; Returns: undefined };
      get_dashboard_overview: { Args: { p_start_date: string; p_end_date: string }; Returns: Record<string, unknown> };
      save_job_pricing: { Args: { p_job_id: string; p_target_margin: number; p_minimum_margin: number; p_selected_sale_price: number; p_acknowledge_risk: boolean }; Returns: undefined };
      update_my_settings: {
        Args: { p_first_name: string; p_last_name: string; p_business_name: string; p_phone: string; p_city: string; p_profession: string; p_default_profit_margin: number; p_minimum_profit_margin: number };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
