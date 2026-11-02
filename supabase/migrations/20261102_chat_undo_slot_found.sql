-- Fix: record_chat_undo and attach_chat_undo_slot_after used
--   IF slot_row IS NULL
-- to decide whether a slot row existed. In PL/pgSQL a RECORD is "IS NULL"
-- only when every column is NULL — so a meal_slots row with both
-- custom_meal_name = NULL and recipe_id = NULL (an empty-but-present slot)
-- was treated as "no row" and stored as JSON null in the undo entry's
-- `before`. On undo, restoreUndoEntry (src/lib/chat-tools.js:923) then
-- takes the DELETE branch and blanks the slot. Switch to IF FOUND, which
-- SELECT INTO sets based on whether a row was returned regardless of
-- column values.

CREATE OR REPLACE FUNCTION record_chat_undo(p_targets JSONB, p_label TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  target JSONB;
  built  JSONB := '[]'::jsonb;
  entry  JSONB;
  slot_row RECORD;
  pantry_row RECORD;
  staple_row RECORD;
  verified_ids UUID[];
  new_id UUID;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN NULL; END IF;

  UPDATE chat_undo_actions
     SET superseded_at = now()
   WHERE user_id = caller
     AND used_at IS NULL
     AND superseded_at IS NULL;

  FOR target IN SELECT * FROM jsonb_array_elements(COALESCE(p_targets, '[]'::jsonb))
  LOOP
    IF target->>'kind' = 'slot' THEN
      SELECT custom_meal_name, recipe_id INTO slot_row
        FROM meal_slots
       WHERE meal_plan_id = (target->>'meal_plan_id')::uuid
         AND day_of_week  = (target->>'day_of_week')::int
         AND meal_type    =  target->>'meal_type'
         AND user_id      =  caller;
      entry := jsonb_build_object(
        'kind', 'slot',
        'ref',  jsonb_build_object(
          'meal_plan_id', target->>'meal_plan_id',
          'day_of_week',  (target->>'day_of_week')::int,
          'meal_type',    target->>'meal_type'
        ),
        'before', CASE
          WHEN FOUND THEN jsonb_build_object(
            'custom_meal_name', slot_row.custom_meal_name,
            'recipe_id',        slot_row.recipe_id
          )
          ELSE NULL
        END
      );
      built := built || jsonb_build_array(entry);

    ELSIF target->>'kind' = 'pantry' THEN
      SELECT id, is_depleted, ingredient_name INTO pantry_row
        FROM pantry
       WHERE id = (target->>'pantry_id')::uuid
         AND user_id = caller;
      IF FOUND THEN
        entry := jsonb_build_object(
          'kind',   'pantry',
          'ref',    jsonb_build_object('pantry_id', pantry_row.id),
          'before', jsonb_build_object(
            'is_depleted',     pantry_row.is_depleted,
            'ingredient_name', pantry_row.ingredient_name
          )
        );
        built := built || jsonb_build_array(entry);
      END IF;

    ELSIF target->>'kind' = 'staple' THEN
      SELECT id, is_out_of_stock, out_of_stock_since, name INTO staple_row
        FROM pantry_staples
       WHERE id = (target->>'staple_id')::uuid
         AND user_id = caller;
      IF FOUND THEN
        entry := jsonb_build_object(
          'kind',   'staple',
          'ref',    jsonb_build_object('staple_id', staple_row.id),
          'before', jsonb_build_object(
            'is_out_of_stock',    staple_row.is_out_of_stock,
            'out_of_stock_since', staple_row.out_of_stock_since,
            'name',               staple_row.name
          )
        );
        built := built || jsonb_build_array(entry);
      END IF;

    ELSIF target->>'kind' = 'grocery_ids' THEN
      SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO verified_ids
        FROM grocery_items
       WHERE id = ANY (
               SELECT (jsonb_array_elements_text(target->'ids'))::uuid
             )
         AND user_id = caller;
      IF array_length(verified_ids, 1) > 0 THEN
        entry := jsonb_build_object(
          'kind', 'grocery_ids',
          'ids',  to_jsonb(verified_ids)
        );
        built := built || jsonb_build_array(entry);
      END IF;
    END IF;
  END LOOP;

  IF jsonb_array_length(built) = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO chat_undo_actions (user_id, entries, label)
  VALUES (caller, built, p_label)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_chat_undo(JSONB, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION record_chat_undo(JSONB, TEXT) TO authenticated;


CREATE OR REPLACE FUNCTION attach_chat_undo_slot_after(
  p_undo_id UUID,
  p_meal_plan_id UUID,
  p_day_of_week INT,
  p_meal_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  undo_owner UUID;
  slot_row RECORD;
  after_json JSONB;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN; END IF;

  SELECT user_id INTO undo_owner FROM chat_undo_actions WHERE id = p_undo_id;
  IF undo_owner IS NULL OR undo_owner <> caller THEN RETURN; END IF;

  SELECT custom_meal_name, recipe_id INTO slot_row
    FROM meal_slots
   WHERE meal_plan_id = p_meal_plan_id
     AND day_of_week  = p_day_of_week
     AND meal_type    = p_meal_type
     AND user_id      = caller;

  IF FOUND THEN
    after_json := jsonb_build_object(
      'custom_meal_name', slot_row.custom_meal_name,
      'recipe_id',        slot_row.recipe_id
    );
  ELSE
    after_json := NULL;
  END IF;

  UPDATE chat_undo_actions
     SET entries = (
       SELECT jsonb_agg(
         CASE
           WHEN e->>'kind' = 'slot'
            AND e->'ref'->>'meal_plan_id' = p_meal_plan_id::text
            AND (e->'ref'->>'day_of_week')::int = p_day_of_week
            AND e->'ref'->>'meal_type' = p_meal_type
           THEN jsonb_set(e, '{after}', COALESCE(after_json, 'null'::jsonb), true)
           ELSE e
         END
       )
       FROM jsonb_array_elements(entries) e
     )
   WHERE id = p_undo_id
     AND user_id = caller;
END;
$$;

REVOKE EXECUTE ON FUNCTION attach_chat_undo_slot_after(UUID, UUID, INT, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION attach_chat_undo_slot_after(UUID, UUID, INT, TEXT) TO authenticated;
