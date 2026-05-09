-- ============================================
-- Koda MVP — Supabase Schema with RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  family_name TEXT,
  location TEXT,
  preferred_store TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  cooking_preferences JSONB DEFAULT NULL,
  grocery_preferences JSONB DEFAULT NULL,
  shopping_style TEXT CHECK (shopping_style IN ('deal_hunter', 'convenience', 'pickup_only', 'delivery_preferred', 'flexible')),
  preferred_delivery_service TEXT CHECK (preferred_delivery_service IN ('instacart', 'doordash', 'walmart_plus', 'amazon_fresh', 'other')),
  preferred_stores TEXT[] DEFAULT '{}',
  store_category_assignments JSONB DEFAULT '{}',
  location_state TEXT,
  dashboard_sections JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
-- SECURITY DEFINER is required here because this trigger runs on auth.users
-- (owned by supabase_auth_admin), and needs to INSERT into public.profiles
-- which is protected by RLS. The function only inserts the new user's own
-- row using NEW.id, so it cannot be abused to write arbitrary rows.
-- Reviewed: 2026-05-07.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Family Members
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('infant', 'toddler', 'child', 'teen', 'adult')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own family" ON family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own family" ON family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own family" ON family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own family" ON family_members FOR DELETE USING (auth.uid() = user_id);


-- 3. Dietary Restrictions
CREATE TABLE dietary_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restriction TEXT NOT NULL,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dietary_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own restrictions" ON dietary_restrictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own restrictions" ON dietary_restrictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own restrictions" ON dietary_restrictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own restrictions" ON dietary_restrictions FOR DELETE USING (auth.uid() = user_id);


-- 4. Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions TEXT,
  prep_time_minutes SMALLINT,
  cook_time_minutes SMALLINT,
  servings SMALLINT,
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  image_url TEXT,
  ingredient_store_assignments JSONB DEFAULT NULL,
  nutrition JSONB DEFAULT NULL,
  nutrition_is_estimated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);


-- 5. Meal Plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meal plans" ON meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own meal plans" ON meal_plans FOR DELETE USING (auth.uid() = user_id);


-- 6. Meal Slots
CREATE TABLE meal_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  meal_type TEXT NOT NULL CHECK (meal_type IN (
    'breakfast', 'lunch', 'dinner',
    'sides', 'sides2', 'sides3', 'sides4',
    'breakfast_side', 'lunch_side', 'dinner_dessert'
  )),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meal_plan_id, day_of_week, meal_type)
);

ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own meal slots" ON meal_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meal slots" ON meal_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meal slots" ON meal_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own meal slots" ON meal_slots FOR DELETE USING (auth.uid() = user_id);


-- 7. Grocery Lists
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id),
  store TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'sent', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own grocery lists" ON grocery_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own grocery lists" ON grocery_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own grocery lists" ON grocery_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own grocery lists" ON grocery_lists FOR DELETE USING (auth.uid() = user_id);


-- 8. Grocery Items
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  in_pantry BOOLEAN DEFAULT FALSE,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own grocery items" ON grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own grocery items" ON grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own grocery items" ON grocery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own grocery items" ON grocery_items FOR DELETE USING (auth.uid() = user_id);


-- 9. Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'custom' CHECK (event_type IN ('birthday', 'pta', 'sports', 'holiday', 'custom')),
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  supplies JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  signups JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own events" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON events FOR DELETE USING (auth.uid() = user_id);


-- 10. Store Connections
CREATE TABLE store_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_location TEXT,
  is_preferred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE store_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own store connections" ON store_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own store connections" ON store_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own store connections" ON store_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own store connections" ON store_connections FOR DELETE USING (auth.uid() = user_id);


-- 11. Pantry Items
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  freshness TEXT DEFAULT 'fresh' CHECK (freshness IN ('fresh', 'expiring', 'low')),
  days_left INTEGER,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own pantry items" ON pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pantry items" ON pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pantry items" ON pantry_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pantry items" ON pantry_items FOR DELETE USING (auth.uid() = user_id);

-- 11b. Pantry Scans (tracks scan history for weekly re-scan prompts)
CREATE TABLE pantry_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items_detected INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pantry_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own pantry scans" ON pantry_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pantry scans" ON pantry_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pantry scans" ON pantry_scans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pantry scans" ON pantry_scans FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pantry_scans_user ON pantry_scans(user_id);

-- 12. Pantry Scans (storage bucket)
-- Run this separately in Supabase Storage settings:
-- CREATE BUCKET 'pantry-scans' (public: false)
-- Storage policies (apply ALL four):
--   SELECT: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]
--   INSERT: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]
--   UPDATE: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]

-- 12b. Recipe Images (storage bucket)
-- Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (food photos are non-sensitive)
CREATE POLICY "Public read recipe images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

-- Only the owning user can upload to their folder
CREATE POLICY "Users upload own recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only the owning user can update their images
CREATE POLICY "Users update own recipe images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only the owning user can delete their images
CREATE POLICY "Users delete own recipe images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- 14. Pantry (managed pantry items with quantities and expiry dates)
CREATE TABLE pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10,2),
  unit TEXT,
  purchase_date DATE,
  expiry_date DATE,
  category TEXT DEFAULT 'Other' CHECK (category IN ('Produce', 'Meat', 'Dairy', 'Pantry', 'Frozen', 'Bakery', 'Beverage', 'Condiment', 'Snack', 'Other')),
  is_depleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pantry ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'scan'));

ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own pantry" ON pantry FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pantry" ON pantry FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pantry" ON pantry FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pantry" ON pantry FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dietary_restrictions_user ON dietary_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON meal_plans(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_meal_slots_plan ON meal_slots(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_slots_user ON meal_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user ON grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list ON grocery_items(grocery_list_id);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_user_expiry ON pantry(user_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_store_connections_user ON store_connections(user_id);


-- 13. AI Conversations (rolling chat history, last 5 messages per context)
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  context TEXT NOT NULL DEFAULT 'general',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, context)
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own AI conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own AI conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own AI conversations" ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own AI conversations" ON ai_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_conversations_user_context ON ai_conversations(user_id, context);

-- ── User taste profile (AI-learned preferences) ──────────────────────────────

CREATE TABLE IF NOT EXISTS user_taste_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cuisine_types TEXT[] NOT NULL DEFAULT '{}',
  cooking_styles TEXT[] NOT NULL DEFAULT '{}',
  protein_preferences TEXT[] NOT NULL DEFAULT '{}',
  flavor_profiles TEXT[] NOT NULL DEFAULT '{}',
  avoided_ingredients TEXT[] NOT NULL DEFAULT '{}',
  favorite_recipes UUID[] NOT NULL DEFAULT '{}',
  source_websites TEXT[] NOT NULL DEFAULT '{}',
  recipe_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_taste_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own taste profile" ON user_taste_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own taste profile" ON user_taste_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own taste profile" ON user_taste_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own taste profile" ON user_taste_profiles FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Onboarding: new profile columns
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_mode TEXT CHECK (onboarding_mode IN ('manual', 'voice'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS household_size INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS household_type TEXT CHECK (household_type IN ('includes_kids', 'adults_only', 'varies'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cook_time_preference TEXT CHECK (cook_time_preference IN ('under_20', '20_to_40', 'up_to_60', 'depends'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_plan_days JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_prep_days JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS adventurousness TEXT CHECK (adventurousness IN ('familiar', 'mix_it_up', 'surprise_me'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_prep_style TEXT CHECK (meal_prep_style IN ('meal_prep', 'cook_fresh', 'mix'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cooking_frustrations JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health_goals JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS track_macros BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_priorities JSONB DEFAULT '[]';

-- Shopping style & store preferences (add-on)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shopping_style TEXT CHECK (shopping_style IN ('deal_hunter', 'convenience', 'pickup_only', 'delivery_preferred', 'flexible'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_delivery_service TEXT CHECK (preferred_delivery_service IN ('instacart', 'doordash', 'walmart_plus', 'amazon_fresh', 'other'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_stores TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_category_assignments JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_state TEXT;


-- ============================================
-- Onboarding: household_members table
-- ============================================

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  is_picky_eater BOOLEAN DEFAULT FALSE,
  picky_issues TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own household members" ON household_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own household members" ON household_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own household members" ON household_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own household members" ON household_members FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);


-- ============================================
-- Onboarding: invites table
-- ============================================

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own invites" ON invites FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "Users insert own invites" ON invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users update own invites" ON invites FOR UPDATE USING (auth.uid() = inviter_id);
CREATE POLICY "Users delete own invites" ON invites FOR DELETE USING (auth.uid() = inviter_id);

CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);


-- ============================================
-- Onboarding: household_permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS household_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  can_view_meal_plan BOOLEAN DEFAULT TRUE,
  can_edit_meal_plan BOOLEAN DEFAULT TRUE,
  can_add_recipes BOOLEAN DEFAULT TRUE,
  can_edit_recipes BOOLEAN DEFAULT FALSE,
  can_delete_recipes BOOLEAN DEFAULT FALSE,
  can_add_to_grocery_list BOOLEAN DEFAULT TRUE,
  can_send_grocery_list BOOLEAN DEFAULT FALSE,
  can_view_pantry BOOLEAN DEFAULT TRUE,
  can_edit_pantry BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE household_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own household permissions" ON household_permissions FOR SELECT USING (auth.uid() = household_owner_id);
CREATE POLICY "Users insert own household permissions" ON household_permissions FOR INSERT WITH CHECK (auth.uid() = household_owner_id);
CREATE POLICY "Users update own household permissions" ON household_permissions FOR UPDATE USING (auth.uid() = household_owner_id);
CREATE POLICY "Users delete own household permissions" ON household_permissions FOR DELETE USING (auth.uid() = household_owner_id);

CREATE INDEX IF NOT EXISTS idx_household_permissions_owner ON household_permissions(household_owner_id);


-- Migration: add imported_from and imported_at to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS imported_from TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Migration: add dinner_dessert to meal_slots.meal_type constraint
ALTER TABLE meal_slots DROP CONSTRAINT IF EXISTS meal_slots_meal_type_check;
ALTER TABLE meal_slots ADD CONSTRAINT meal_slots_meal_type_check
  CHECK (meal_type IN (
    'breakfast', 'lunch', 'dinner',
    'sides', 'sides2', 'sides3', 'sides4',
    'breakfast_side', 'lunch_side', 'dinner_dessert'
  ));

-- ============================================
-- Migration: Faith-based dietary practices
-- ============================================

-- Recipe card display settings (stored on profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recipe_card_settings JSONB DEFAULT NULL;
-- Shape: { show_photo, show_description, show_cook_time, show_servings,
--   show_categories, show_macros, show_rating, show_review_count,
--   show_difficulty, show_source, show_calories, show_protein, show_carbs,
--   show_fat, card_layout: 'grid'|'list', photo_position: 'right'|'top' }

-- Household-level faith practices (stored on profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faith_practices JSONB DEFAULT NULL;
-- Shape: { follows_faith_based_diet, household_faith_practices[], kosher_level,
--   halal_level, hindu_level, jain_level, buddhist_level, adventist_level,
--   orthodox_fasting, orthodox_fasting_calendar, catholic_lenten, ital_level,
--   is_lds, lds_no_coffee, lds_no_alcohol, lds_no_black_tea, custom_practice }

-- Individual member faith practices (stored on household_members)
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS individual_faith_practices JSONB DEFAULT NULL;
-- Shape: { follows_individual_faith_diet, individual_faith_practices[], ...same level fields }

-- ============================================
-- Migration: Voice settings
-- ============================================

-- Voice preferences (stored on profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{"voice_responses_enabled": false}';
-- Shape: { voice_responses_enabled: boolean }


-- ============================================
-- Migration: Photo macro logging
-- ============================================

-- Per-member toggle for photo macro logging
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS allow_photo_macro_logging BOOLEAN DEFAULT TRUE;

-- Macro tracking columns (if not already present)
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS track_macros BOOLEAN DEFAULT FALSE;
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS macro_calories INTEGER;
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS macro_protein_g NUMERIC;
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS macro_carbs_g NUMERIC;
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS macro_fat_g NUMERIC;

-- Extra food items logged via photo/manual entry (standalone from meal plan)
CREATE TABLE IF NOT EXISTS macro_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TEXT NOT NULL CHECK (meal_time IN (
    'breakfast_addition', 'morning_snack', 'lunch_addition', 'afternoon_snack', 'evening_snack'
  )),
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  photo_url TEXT,
  label_found BOOLEAN DEFAULT FALSE,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  gemini_notes TEXT,
  edited_by_user BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE macro_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own macro extras" ON macro_extras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own macro extras" ON macro_extras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own macro extras" ON macro_extras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own macro extras" ON macro_extras FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_macro_extras_member_date ON macro_extras(member_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_macro_extras_user ON macro_extras(user_id);

-- ── Collections ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '',
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own collections" ON collections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own collections" ON collections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own collections" ON collections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own collections" ON collections FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);

-- ── Recipe-Collection junction ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_collections (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (recipe_id, collection_id)
);

ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recipe_collections" ON recipe_collections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own recipe_collections" ON recipe_collections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own recipe_collections" ON recipe_collections FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_recipe_collections_collection ON recipe_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user ON recipe_collections(user_id);
