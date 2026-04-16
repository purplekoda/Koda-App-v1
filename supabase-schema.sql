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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
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
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
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
  quantity TEXT,
  freshness TEXT DEFAULT 'green' CHECK (freshness IN ('green', 'amber', 'coral')),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own pantry items" ON pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pantry items" ON pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pantry items" ON pantry_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pantry items" ON pantry_items FOR DELETE USING (auth.uid() = user_id);


-- 12. Pantry Scans (storage bucket)
-- Run this separately in Supabase Storage settings:
-- CREATE BUCKET 'pantry-scans' (public: false)
-- Storage policies (apply ALL four):
--   SELECT: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]
--   INSERT: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]
--   UPDATE: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: bucket_id = 'pantry-scans' AND auth.uid()::text = (storage.foldername(name))[1]


-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_dietary_restrictions_user ON dietary_restrictions(user_id);
CREATE INDEX idx_meal_plans_user_week ON meal_plans(user_id, week_start);
CREATE INDEX idx_meal_slots_plan ON meal_slots(meal_plan_id);
CREATE INDEX idx_meal_slots_user ON meal_slots(user_id);
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_grocery_lists_user ON grocery_lists(user_id);
CREATE INDEX idx_grocery_items_list ON grocery_items(grocery_list_id);
CREATE INDEX idx_events_user_date ON events(user_id, event_date);
CREATE INDEX idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX idx_store_connections_user ON store_connections(user_id);


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
