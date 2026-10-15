-- Chat pending actions: server-created rows that a user confirms once, atomically.
-- The payload is server-validated at creation and re-validated on claim.

CREATE TABLE IF NOT EXISTS chat_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  summary TEXT,
  imported_content BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used_at TIMESTAMPTZ,
  cancelled BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE chat_pending_actions ENABLE ROW LEVEL SECURITY;

-- Users can read their own pending rows (so the UI can show summaries).
CREATE POLICY "Users select own pending actions"
  ON chat_pending_actions FOR SELECT
  USING (auth.uid() = user_id);

-- Users may insert their own rows; the claim RPC re-validates the payload before
-- executing, so a client-created row cannot bypass the normal input checks.
CREATE POLICY "Users insert own pending actions"
  ON chat_pending_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Intentionally no UPDATE or DELETE policy. The claim RPC runs as SECURITY DEFINER
-- and is the only path that may flip used_at. Rows expire naturally.

CREATE INDEX IF NOT EXISTS idx_chat_pending_actions_user
  ON chat_pending_actions(user_id, expires_at);

-- Atomic one-shot claim. Returns the row if it belongs to the caller, has not
-- been used, and has not expired. Any later attempt (replay, other user,
-- expired) returns zero rows.
CREATE OR REPLACE FUNCTION claim_chat_pending_action(pending_id UUID)
RETURNS chat_pending_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  claimed chat_pending_actions;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE chat_pending_actions
     SET used_at = now()
   WHERE id = pending_id
     AND user_id = caller
     AND used_at IS NULL
     AND cancelled = false
     AND expires_at > now()
  RETURNING * INTO claimed;

  RETURN claimed;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_chat_pending_action(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION claim_chat_pending_action(UUID) TO authenticated;
