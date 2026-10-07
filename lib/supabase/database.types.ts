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
      food_units: {
        Row: {
          created_at: string;
          food_id: string;
          grams: number;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          grams: number;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          grams?: number;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      food_logs: {
        Row: {
          unit_name: string | null;
          quantity: number | null;
          carbs_g: number;
          created_at: string;
          eaten_on: string;
          fat_g: number;
          food_id: string | null;
          food_name: string;
          grams: number;
          id: string;
          kcal: number;
          meal: string;
          protein_g: number;
          user_id: string;
        };
        Insert: {
          unit_name?: string | null;
          quantity?: number | null;
          carbs_g: number;
          created_at?: string;
          eaten_on?: string;
          fat_g: number;
          food_id?: string | null;
          food_name: string;
          grams: number;
          id?: string;
          kcal: number;
          meal: string;
          protein_g: number;
          user_id?: string;
        };
        Update: {
          unit_name?: string | null;
          quantity?: number | null;
          carbs_g?: number;
          created_at?: string;
          eaten_on?: string;
          fat_g?: number;
          food_id?: string | null;
          food_name?: string;
          grams?: number;
          id?: string;
          kcal?: number;
          meal?: string;
          protein_g?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      foods: {
        Row: {
          barcode: string | null;
          brand: string | null;
          carbs_100g: number;
          created_at: string;
          created_by: string | null;
          fat_100g: number;
          id: string;
          kcal_100g: number;
          name: string;
          protein_100g: number;
          serving_g: number | null;
          source: string;
          updated_at: string;
        };
        Insert: {
          barcode?: string | null;
          brand?: string | null;
          carbs_100g: number;
          created_at?: string;
          created_by?: string | null;
          fat_100g: number;
          id?: string;
          kcal_100g: number;
          name: string;
          protein_100g: number;
          serving_g?: number | null;
          source: string;
          updated_at?: string;
        };
        Update: {
          barcode?: string | null;
          brand?: string | null;
          carbs_100g?: number;
          created_at?: string;
          created_by?: string | null;
          fat_100g?: number;
          id?: string;
          kcal_100g?: number;
          name?: string;
          protein_100g?: number;
          serving_g?: number | null;
          source?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          carbs_g: number | null;
          created_at: string;
          fat_g: number | null;
          goal_weight_kg: number | null;
          height_cm: number | null;
          kcal_target: number | null;
          onboarding_completed_at: string | null;
          protein_g: number | null;
          sex: string | null;
          training_per_week: string | null;
          updated_at: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          birth_date?: string | null;
          carbs_g?: number | null;
          created_at?: string;
          fat_g?: number | null;
          goal_weight_kg?: number | null;
          height_cm?: number | null;
          kcal_target?: number | null;
          onboarding_completed_at?: string | null;
          protein_g?: number | null;
          sex?: string | null;
          training_per_week?: string | null;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Update: {
          birth_date?: string | null;
          carbs_g?: number | null;
          created_at?: string;
          fat_g?: number | null;
          goal_weight_kg?: number | null;
          height_cm?: number | null;
          kcal_target?: number | null;
          onboarding_completed_at?: string | null;
          protein_g?: number | null;
          sex?: string | null;
          training_per_week?: string | null;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
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
export type FoodRow = Database["public"]["Tables"]["foods"]["Row"];
export type FoodUnitRow = Database["public"]["Tables"]["food_units"]["Row"];
export type FoodLogRow = Database["public"]["Tables"]["food_logs"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];
