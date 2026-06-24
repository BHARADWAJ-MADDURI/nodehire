export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      anonymous_sessions: {
        Row: {
          claimed_by: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          last_seen_at: string;
          token_hash: string;
        };
        Insert: {
          claimed_by?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          last_seen_at?: string;
          token_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["anonymous_sessions"]["Insert"]>;
        Relationships: [];
      };
      prep_contexts: {
        Row: {
          anonymous_session_id: string | null;
          company: string;
          created_at: string;
          id: string;
          interview_date: string | null;
          job_description: string;
          notes: string | null;
          role: string;
          seniority: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          anonymous_session_id?: string | null;
          company: string;
          id?: string;
          interview_date?: string | null;
          job_description: string;
          notes?: string | null;
          role: string;
          seniority?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prep_contexts"]["Insert"]>;
        Relationships: [];
      };
      ontology_skills: {
        Row: {
          created_at: string;
          description: string;
          domain: string;
          id: string;
          name: string;
          parent_id: string | null;
        };
        Insert: {
          description: string;
          domain: string;
          id: string;
          name: string;
          parent_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ontology_skills"]["Insert"]>;
        Relationships: [];
      };
      topic_trees: {
        Row: {
          created_at: string;
          generated_by: string;
          id: string;
          prep_context_id: string;
          recommended_path: string[];
          signal_summary: Json;
          tree: Json;
          updated_at: string;
        };
        Insert: {
          generated_by?: string;
          id?: string;
          prep_context_id: string;
          recommended_path?: string[];
          signal_summary?: Json;
          tree: Json;
        };
        Update: Partial<Database["public"]["Tables"]["topic_trees"]["Insert"]>;
        Relationships: [];
      };
      topic_skill_mappings: {
        Row: {
          created_at: string;
          id: string;
          ontology_leaf_id: string;
          rationale: string;
          selected: boolean;
          topic_key: string;
          topic_tree_id: string;
          weight: number;
        };
        Insert: {
          id?: string;
          ontology_leaf_id: string;
          rationale: string;
          selected?: boolean;
          topic_key: string;
          topic_tree_id: string;
          weight: number;
        };
        Update: Partial<Database["public"]["Tables"]["topic_skill_mappings"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          display_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          display_name?: string | null;
        };
        Relationships: [];
      };
      question_bank: {
        Row: {
          created_at: string;
          difficulty: string;
          evaluation_rubric: Json;
          follow_up_hints: Json;
          hit_count: number;
          id: string;
          mode: string;
          ontology_leaf_id: string;
          question_text: string;
          source: string;
          updated_at: string;
        };
        Insert: {
          difficulty: string;
          evaluation_rubric?: Json;
          follow_up_hints?: Json;
          id?: string;
          mode: string;
          ontology_leaf_id: string;
          question_text: string;
          source?: string;
        };
        Update: Partial<Database["public"]["Tables"]["question_bank"]["Insert"]> & { hit_count?: number };
        Relationships: [];
      };
      practice_sessions: {
        Row: { id: string; prep_context_id: string; user_id: string | null; anonymous_session_id: string | null; mode: string; status: string; difficulty: string; created_at: string; completed_at: string | null };
        Insert: { id?: string; prep_context_id: string; user_id?: string | null; anonymous_session_id?: string | null; mode?: string; status?: string; difficulty?: string; completed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["practice_sessions"]["Insert"]>;
        Relationships: [];
      };
      session_questions: {
        Row: { id: string; session_id: string; question_id: string; ontology_leaf_id: string; sequence_number: number; answer_text: string | null; prompt_override: string | null; score: number | null; evaluation: Json | null; is_follow_up: boolean; created_at: string; answered_at: string | null };
        Insert: { id?: string; session_id: string; question_id: string; ontology_leaf_id: string; sequence_number: number; answer_text?: string | null; prompt_override?: string | null; score?: number | null; evaluation?: Json | null; is_follow_up?: boolean; answered_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["session_questions"]["Insert"]>;
        Relationships: [];
      };
      skill_mastery: {
        Row: { id: string; user_id: string | null; anonymous_session_id: string | null; ontology_leaf_id: string; mastery_score: number; evidence_count: number; updated_at: string };
        Insert: { id?: string; user_id?: string | null; anonymous_session_id?: string | null; ontology_leaf_id: string; mastery_score?: number; evidence_count?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["skill_mastery"]["Insert"]>;
        Relationships: [];
      };
      weakness_profiles: {
        Row: { id: string; user_id: string | null; anonymous_session_id: string | null; ontology_leaf_id: string; weakness_score: number; evidence_count: number; updated_at: string };
        Insert: { id?: string; user_id?: string | null; anonymous_session_id?: string | null; ontology_leaf_id: string; weakness_score?: number; evidence_count?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["weakness_profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
