export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "EV Car data": {
        Row: {
          Accel: string | null
          BodyStyle: string | null
          Brand: string | null
          Efficiency: string | null
          FastCharge: string | null
          Model: string | null
          PlugType: string | null
          PowerTrain: string | null
          PriceEuro: number | null
          Range: string | null
          RapidCharge: string | null
          Seats: number | null
          Segment: string | null
          TopSpeed: string | null
        }
        Insert: {
          Accel?: string | null
          BodyStyle?: string | null
          Brand?: string | null
          Efficiency?: string | null
          FastCharge?: string | null
          Model?: string | null
          PlugType?: string | null
          PowerTrain?: string | null
          PriceEuro?: number | null
          Range?: string | null
          RapidCharge?: string | null
          Seats?: number | null
          Segment?: string | null
          TopSpeed?: string | null
        }
        Update: {
          Accel?: string | null
          BodyStyle?: string | null
          Brand?: string | null
          Efficiency?: string | null
          FastCharge?: string | null
          Model?: string | null
          PlugType?: string | null
          PowerTrain?: string | null
          PriceEuro?: number | null
          Range?: string | null
          RapidCharge?: string | null
          Seats?: number | null
          Segment?: string | null
          TopSpeed?: string | null
        }
        Relationships: []
      }
      "EV Route Charging stations": {
        Row: {
          address: string | null
          city: string | null
          lattitude: string | null
          longitude: number | null
          name: string | null
          state: string | null
          type: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          lattitude?: string | null
          longitude?: number | null
          name?: string | null
          state?: string | null
          type?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          lattitude?: string | null
          longitude?: number | null
          name?: string | null
          state?: string | null
          type?: number | null
        }
        Relationships: []
      }
      user_cars: {
        Row: {
          car_brand: string
          car_model: string
          created_at: string | null
          id: string
          range_km: number
          user_id: string | null
        }
        Insert: {
          car_brand: string
          car_model: string
          created_at?: string | null
          id?: string
          range_km: number
          user_id?: string | null
        }
        Update: {
          car_brand?: string
          car_model?: string
          created_at?: string | null
          id?: string
          range_km?: number
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
