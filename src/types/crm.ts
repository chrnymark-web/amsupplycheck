export interface CrmPipelineStage {
  id: string;
  name: string;
  slug: string;
  position: number;
  color: string;
  is_win: boolean;
  is_loss: boolean;
  created_at: string;
}

export interface CrmLabel {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  quote_request_id: string | null;
  stage_id: string;
  title: string;
  contact_name: string;
  contact_email: string;
  technology: string | null;
  material: string | null;
  volume: string | null;
  project_description: string | null;
  supplier_context: string | null;
  source_page: string | null;
  assigned_to: string | null;
  due_date: string | null;
  deal_value: number | null;
  position: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  labels?: CrmLabel[];
  stage?: CrmPipelineStage;
}

export interface CrmComment {
  id: string;
  deal_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  // Joined
  user_email?: string;
}

export interface CrmActivityLog {
  id: string;
  deal_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}

export interface CrmFilters {
  search?: string;
  technology?: string;
  material?: string;
  labelIds?: string[];
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}
