
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ingredient_lots": {
                  Row: {
                    "created_at": string,"expires_on": string | null,"id": string,"ingredient_id": string,"purchase_item_id": string | null,"qty_initial": number,"qty_remaining": number,"received_on": string,"unit_cost": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_on"?: string | null,"id"?: string,"ingredient_id": string,"purchase_item_id"?: string | null,"qty_initial": number,"qty_remaining": number,"received_on"?: string,"unit_cost": number
                  }
                  Update: {
                    "created_at"?: string,"expires_on"?: string | null,"id"?: string,"ingredient_id"?: string,"purchase_item_id"?: string | null,"qty_initial"?: number,"qty_remaining"?: number,"received_on"?: string,"unit_cost"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredient_lots_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ingredient_lots_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_expiring_lots"
      referencedColumns: ["ingredient_id"]
    },{
      foreignKeyName: "ingredient_lots_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_ingredient_status"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ingredient_lots_purchase_item_id_fkey"
      columns: ["purchase_item_id"]
isOneToOne: false
      referencedRelation: "purchase_items"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredients": {
                  Row: {
                    "active": boolean,"avg_cost": number,"base_unit": Database["public"]['Enums']["base_unit"],"conversion_factor": number,"created_at": string,"current_stock": number,"id": string,"is_perishable": boolean,"min_stock": number,"name": string,"notes": string | null,"purchase_unit": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"avg_cost"?: number,"base_unit": Database["public"]['Enums']["base_unit"],"conversion_factor"?: number,"created_at"?: string,"current_stock"?: number,"id"?: string,"is_perishable"?: boolean,"min_stock"?: number,"name": string,"notes"?: string | null,"purchase_unit"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"avg_cost"?: number,"base_unit"?: Database["public"]['Enums']["base_unit"],"conversion_factor"?: number,"created_at"?: string,"current_stock"?: number,"id"?: string,"is_perishable"?: boolean,"min_stock"?: number,"name"?: string,"notes"?: string | null,"purchase_unit"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"inventory_movements": {
                  Row: {
                    "created_at": string,"created_by": string,"id": number,"ingredient_id": string,"lot_id": string | null,"note": string | null,"quantity": number,"reason": string | null,"ref_id": string | null,"ref_type": string | null,"type": Database["public"]['Enums']["movement_type"],"unit_cost": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"id"?: never,"ingredient_id": string,"lot_id"?: string | null,"note"?: string | null,"quantity": number,"reason"?: string | null,"ref_id"?: string | null,"ref_type"?: string | null,"type": Database["public"]['Enums']["movement_type"],"unit_cost"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: never,"ingredient_id"?: string,"lot_id"?: string | null,"note"?: string | null,"quantity"?: number,"reason"?: string | null,"ref_id"?: string | null,"ref_type"?: string | null,"type"?: Database["public"]['Enums']["movement_type"],"unit_cost"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_movements_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_expiring_lots"
      referencedColumns: ["ingredient_id"]
    },{
      foreignKeyName: "inventory_movements_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_ingredient_status"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_lot_id_fkey"
      columns: ["lot_id"]
isOneToOne: false
      referencedRelation: "ingredient_lots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_lot_id_fkey"
      columns: ["lot_id"]
isOneToOne: false
      referencedRelation: "v_expiring_lots"
      referencedColumns: ["lot_id"]
    }
                  ]
                },"product_categories": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"product_movements": {
                  Row: {
                    "created_at": string,"created_by": string,"id": number,"note": string | null,"product_id": string,"quantity": number,"ref_id": string | null,"ref_type": string | null,"type": Database["public"]['Enums']["movement_type"],"unit_cost": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"id"?: never,"note"?: string | null,"product_id": string,"quantity": number,"ref_id"?: string | null,"ref_type"?: string | null,"type": Database["public"]['Enums']["movement_type"],"unit_cost"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: never,"note"?: string | null,"product_id"?: string,"quantity"?: number,"ref_id"?: string | null,"ref_type"?: string | null,"type"?: Database["public"]['Enums']["movement_type"],"unit_cost"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_movements_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_movements_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "v_product_costing"
      referencedColumns: ["product_id"]
    }
                  ]
                },"production_batches": {
                  Row: {
                    "created_by": string,"id": string,"note": string | null,"portions": number,"produced_at": string,"product_id": string,"recipe_id": string,"total_cost": number,"unit_cost": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_by"?: string,"id"?: string,"note"?: string | null,"portions": number,"produced_at"?: string,"product_id": string,"recipe_id": string,"total_cost": number,"unit_cost": number
                  }
                  Update: {
                    "created_by"?: string,"id"?: string,"note"?: string | null,"portions"?: number,"produced_at"?: string,"product_id"?: string,"recipe_id"?: string,"total_cost"?: number,"unit_cost"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "production_batches_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "production_batches_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "v_product_costing"
      referencedColumns: ["product_id"]
    },{
      foreignKeyName: "production_batches_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "active": boolean,"avg_cost": number,"category_id": string | null,"created_at": string,"current_stock": number,"description": string | null,"fulfillment": Database["public"]['Enums']["fulfillment_mode"],"id": string,"image_path": string | null,"min_stock": number,"name": string,"sale_price": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"avg_cost"?: number,"category_id"?: string | null,"created_at"?: string,"current_stock"?: number,"description"?: string | null,"fulfillment"?: Database["public"]['Enums']["fulfillment_mode"],"id"?: string,"image_path"?: string | null,"min_stock"?: number,"name": string,"sale_price"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"avg_cost"?: number,"category_id"?: string | null,"created_at"?: string,"current_stock"?: number,"description"?: string | null,"fulfillment"?: Database["public"]['Enums']["fulfillment_mode"],"id"?: string,"image_path"?: string | null,"min_stock"?: number,"name"?: string,"sale_price"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "product_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "active": boolean,"created_at": string,"full_name": string,"id": string,"permissions": string[],"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"full_name"?: string,"id": string,"permissions"?: string[],"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"full_name"?: string,"id"?: string,"permissions"?: string[],"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"purchase_items": {
                  Row: {
                    "expires_on": string | null,"id": string,"ingredient_id": string,"purchase_id": string,"quantity": number,"total_cost": number
                  }
                  ComputedFields: never
                  Insert: {
                    "expires_on"?: string | null,"id"?: string,"ingredient_id": string,"purchase_id": string,"quantity": number,"total_cost": number
                  }
                  Update: {
                    "expires_on"?: string | null,"id"?: string,"ingredient_id"?: string,"purchase_id"?: string,"quantity"?: number,"total_cost"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchase_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_expiring_lots"
      referencedColumns: ["ingredient_id"]
    },{
      foreignKeyName: "purchase_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_ingredient_status"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_items_purchase_id_fkey"
      columns: ["purchase_id"]
isOneToOne: false
      referencedRelation: "purchases"
      referencedColumns: ["id"]
    }
                  ]
                },"purchases": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"invoice_number": string | null,"note": string | null,"purchased_on": string,"supplier_id": string | null,"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"invoice_number"?: string | null,"note"?: string | null,"purchased_on"?: string,"supplier_id"?: string | null,"total"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"invoice_number"?: string | null,"note"?: string | null,"purchased_on"?: string,"supplier_id"?: string | null,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchases_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"recipe_items": {
                  Row: {
                    "id": string,"ingredient_id": string,"quantity": number,"recipe_id": string,"waste_pct": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"ingredient_id": string,"quantity": number,"recipe_id": string,"waste_pct"?: number
                  }
                  Update: {
                    "id"?: string,"ingredient_id"?: string,"quantity"?: number,"recipe_id"?: string,"waste_pct"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipe_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_expiring_lots"
      referencedColumns: ["ingredient_id"]
    },{
      foreignKeyName: "recipe_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "v_ingredient_status"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipe_items_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"recipes": {
                  Row: {
                    "created_at": string,"id": string,"notes": string | null,"product_id": string,"updated_at": string,"yield_portions": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"notes"?: string | null,"product_id": string,"updated_at"?: string,"yield_portions": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"notes"?: string | null,"product_id"?: string,"updated_at"?: string,"yield_portions"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipes_product_id_fkey"
      columns: ["product_id"]
isOneToOne: true
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipes_product_id_fkey"
      columns: ["product_id"]
isOneToOne: true
      referencedRelation: "v_product_costing"
      referencedColumns: ["product_id"]
    }
                  ]
                },"sale_items": {
                  Row: {
                    "extras": NonNullable<Json>,"id": string,"product_id": string,"quantity": number,"sale_id": string,"unit_cost": number,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "extras"?: NonNullable<Json>,"id"?: string,"product_id": string,"quantity": number,"sale_id": string,"unit_cost"?: number,"unit_price": number
                  }
                  Update: {
                    "extras"?: NonNullable<Json>,"id"?: string,"product_id"?: string,"quantity"?: number,"sale_id"?: string,"unit_cost"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sale_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sale_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "v_product_costing"
      referencedColumns: ["product_id"]
    },{
      foreignKeyName: "sale_items_sale_id_fkey"
      columns: ["sale_id"]
isOneToOne: false
      referencedRelation: "sales"
      referencedColumns: ["id"]
    }
                  ]
                },"sales": {
                  Row: {
                    "cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"channel": string,"created_by": string,"customer_name": string | null,"customer_nit": string | null,"customer_nrc": string | null,"id": string,"invoice_doc_number": string | null,"invoice_doc_type": Database["public"]['Enums']["invoice_type"],"note": string | null,"payment_method": string,"sold_at": string,"status": Database["public"]['Enums']["sale_status"],"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"channel"?: string,"created_by"?: string,"customer_name"?: string | null,"customer_nit"?: string | null,"customer_nrc"?: string | null,"id"?: string,"invoice_doc_number"?: string | null,"invoice_doc_type"?: Database["public"]['Enums']["invoice_type"],"note"?: string | null,"payment_method"?: string,"sold_at"?: string,"status"?: Database["public"]['Enums']["sale_status"],"total"?: number
                  }
                  Update: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"channel"?: string,"created_by"?: string,"customer_name"?: string | null,"customer_nit"?: string | null,"customer_nrc"?: string | null,"id"?: string,"invoice_doc_number"?: string | null,"invoice_doc_type"?: Database["public"]['Enums']["invoice_type"],"note"?: string | null,"payment_method"?: string,"sold_at"?: string,"status"?: Database["public"]['Enums']["sale_status"],"total"?: number
                  }
                  Relationships: [
                    
                  ]
                },"business_settings": {
                  Row: {
                    "business_name": string,"currency_symbol": string,"enabled_modules": Json,"id": boolean,"logo_url": string,"tagline": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name"?: string,"currency_symbol"?: string,"enabled_modules"?: Json,"id"?: boolean,"logo_url"?: string,"tagline"?: string,"updated_at"?: string
                  }
                  Update: {
                    "business_name"?: string,"currency_symbol"?: string,"enabled_modules"?: Json,"id"?: boolean,"logo_url"?: string,"tagline"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cash_closings": {
                  Row: {
                    "business_date": string,"card_sales": number,"cash_counted": number,"cash_sales": number,"closed_at": string,"closed_by": string,"difference": number,"expected_cash": number,"id": string,"note": string | null,"opening_float": number,"transfer_sales": number
                  }
                  ComputedFields: never
                  Insert: {
                    "business_date": string,"card_sales": number,"cash_counted": number,"cash_sales": number,"closed_at"?: string,"closed_by"?: string,"difference": number,"expected_cash": number,"id"?: string,"note"?: string | null,"opening_float": number,"transfer_sales": number
                  }
                  Update: {
                    "business_date"?: string,"card_sales"?: number,"cash_counted"?: number,"cash_sales"?: number,"closed_at"?: string,"closed_by"?: string,"difference"?: number,"expected_cash"?: number,"id"?: string,"note"?: string | null,"opening_float"?: number,"transfer_sales"?: number
                  }
                  Relationships: [
                    
                  ]
                },"sale_channels": {
                  Row: {
                    "active": boolean,"code": string,"created_at": string,"label": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"created_at"?: string,"label": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"created_at"?: string,"label"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"suppliers": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string,"notes": string | null,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "v_expiring_lots": {
                  Row: {
                    "base_unit": Database["public"]['Enums']["base_unit"] | null,"days_left": number | null,"expires_on": string | null,"ingredient_id": string | null,"lot_id": string | null,"name": string | null,"qty_remaining": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_ingredient_status": {
                  Row: {
                    "avg_cost": number | null,"base_unit": Database["public"]['Enums']["base_unit"] | null,"conversion_factor": number | null,"current_stock": number | null,"id": string | null,"is_low": boolean | null,"min_stock": number | null,"name": string | null,"next_expiry": string | null,"purchase_unit": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "avg_cost"?: number | null,"base_unit"?: Database["public"]['Enums']["base_unit"] | null,"conversion_factor"?: number | null,"current_stock"?: number | null,"id"?: string | null,"is_low"?: never,"min_stock"?: number | null,"name"?: string | null,"next_expiry"?: never,"purchase_unit"?: string | null
                         }
                        Update: {
                           "avg_cost"?: number | null,"base_unit"?: Database["public"]['Enums']["base_unit"] | null,"conversion_factor"?: number | null,"current_stock"?: number | null,"id"?: string | null,"is_low"?: never,"min_stock"?: number | null,"name"?: string | null,"next_expiry"?: never,"purchase_unit"?: string | null
                         }
                        Relationships: [
                    
                  ]
                },"v_product_costing": {
                  Row: {
                    "margin_pct": number | null,"name": string | null,"product_id": string | null,"sale_price": number | null,"unit_cost": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "_consume_ingredient":
{ Args: { "p_ingredient": string,"p_note": string,"p_qty": number,"p_reason": string,"p_ref_id": string,"p_ref_type": string,"p_type": Database["public"]['Enums']["movement_type"] }; Returns: number
                           },
"_consume_recipe":
{ Args: { "p_note": string,"p_portions": number,"p_product_id": string,"p_ref_id": string,"p_ref_type": string,"p_type": Database["public"]['Enums']["movement_type"] }; Returns: number
                           },
"adjust_ingredient":
{ Args: { "p_delta": number,"p_ingredient_id": string,"p_note"?: string,"p_reason"?: string,"p_reason_code"?: string,"p_type": Database["public"]['Enums']["movement_type"] }; Returns: undefined
                           },
"cancel_sale":
{ Args: { "p_reason": string,"p_sale_id": string }; Returns: undefined
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_owner":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"receive_purchase":
{ Args: { "p_invoice": string,"p_items": Json,"p_note": string,"p_purchased_on": string,"p_supplier_id": string }; Returns: string
                           },
"register_production":
{ Args: { "p_note"?: string,"p_portions": number,"p_product_id": string }; Returns: string
                           },
"register_sale":
{ Args: { "p_channel": string,"p_customer_name": string,"p_customer_nit"?: string,"p_customer_nrc"?: string,"p_invoice_doc_number"?: string,"p_invoice_doc_type"?: Database["public"]['Enums']["invoice_type"],"p_items": Json,"p_note": string,"p_payment_method"?: string,"p_tax_details"?: Json }; Returns: string
                           },
"cash_day_summary":
{ Args: { "p_date": string }; Returns: { cancelled_count: number,card_sales: number,cash_sales: number,sales_count: number,transfer_sales: number }[]
                           },
"register_cash_closing":
{ Args: { "p_cash_counted": number,"p_date": string,"p_note"?: string,"p_opening_float": number }; Returns: string
                           }
          }
          Enums: {
            "base_unit": "g"|"ml"|"unit","fulfillment_mode": "made_to_stock"|"made_to_order","invoice_type": "ticket"|"fcf"|"ccf"|"export","movement_type": "purchase"|"production"|"sale"|"waste"|"adjustment"|"reversal","sale_status": "completed"|"cancelled","user_role": "owner"|"staff"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "base_unit": ["g", "ml", "unit"],"fulfillment_mode": ["made_to_stock", "made_to_order"],"invoice_type": ["ticket", "fcf", "ccf", "export"],"movement_type": ["purchase", "production", "sale", "waste", "adjustment", "reversal"],"sale_channel": ["local", "whatsapp", "instagram", "other"],"sale_status": ["completed", "cancelled"],"user_role": ["owner", "staff"]
          }
        }
} as const
