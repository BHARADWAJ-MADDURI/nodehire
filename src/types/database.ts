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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
