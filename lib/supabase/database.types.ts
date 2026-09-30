// Skrevet i samme format som `supabase gen types typescript`.
// Generér igen efter skemaændringer:
//   npx supabase gen types typescript --project-id <projekt-id> --schema public > lib/supabase/database.types.ts

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
      sets: {
        Row: {
          created_at: string;
          exercise_name: string;
          id: string;
          performed_on: string;
          reps: number;
          user_id: string;
          weight_kg: number;
          wger_exercise_id: number | null;
        };
        Insert: {
          created_at?: string;
          exercise_name: string;
          id?: string;
          performed_on?: string;
          reps: number;
          user_id?: string | null;
          weight_kg: number;
          wger_exercise_id?: number | null;
        };
        Update: {
          created_at?: string;
          exercise_name?: string;
          id?: string;
          performed_on?: string;
          reps?: number;
          user_id?: string | null;
          weight_kg?: number;
          wger_exercise_id?: number | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type SetRow = Database["public"]["Tables"]["sets"]["Row"];
export type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];
