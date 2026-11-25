-- RegretBox v2.0 Schema: Anonymous Public Digital Cemetery
-- No user accounts, no auth, no reminders, no private history.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE IF NOT EXISTS public.grave_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.graves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grave_number bigint UNIQUE NOT NULL CHECK (grave_number >= 1 AND grave_number <= 9999999),
  slot_index int UNIQUE NOT NULL,
  zone text NOT NULL DEFAULT 'new_cemetery' CHECK (
    zone IN ('entrance', 'new_cemetery', 'old_cemetery', 'memorial_garden')
  ),
  inscription varchar(120) NOT NULL CHECK (char_length(trim(inscription)) BETWEEN 3 AND 120),
  pos_x real NOT NULL,
  pos_y real NOT NULL DEFAULT 0,
  pos_z real NOT NULL,
  rotation_y real NOT NULL DEFAULT 0,
  grave_style text NOT NULL DEFAULT 'classic' CHECK (
    grave_style IN ('classic', 'obelisk', 'slab', 'cross_arch', 'mossy_stone')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  moderation_status text NOT NULL DEFAULT 'visible' CHECK (
    moderation_status IN ('visible', 'flagged', 'hidden')
  ),
  is_demo boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_graves_number ON public.graves(grave_number);
CREATE INDEX IF NOT EXISTS idx_graves_moderation_created ON public.graves(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_graves_zone ON public.graves(zone);

-- Public read-only view excluding hidden graves
CREATE OR REPLACE VIEW public.public_graves_view AS
SELECT
  id,
  grave_number,
  slot_index,
  zone,
  inscription,
  pos_x,
  pos_y,
  pos_z,
  rotation_y,
  grave_style,
  created_at,
  is_demo
FROM public.graves
WHERE moderation_status IN ('visible', 'flagged');

-- Reports for public moderation
CREATE TABLE IF NOT EXISTS public.grave_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grave_id uuid NOT NULL REFERENCES public.graves(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grave_reports_grave ON public.grave_reports(grave_id);

-- Atomic grave creation RPC (service_role only)
CREATE OR REPLACE FUNCTION public.create_public_grave(
  p_inscription text,
  p_grave_style text DEFAULT 'classic',
  p_zone text DEFAULT 'new_cemetery',
  p_pos_x real DEFAULT 0,
  p_pos_y real DEFAULT 0,
  p_pos_z real DEFAULT 0,
  p_rotation_y real DEFAULT 0,
  p_slot_index int DEFAULT NULL
)
RETURNS public.graves
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_number bigint;
  v_slot int;
  v_grave public.graves;
BEGIN
  PERFORM pg_advisory_xact_lock(98245202);

  v_clean := trim(regexp_replace(COALESCE(p_inscription, ''), '\s+', ' ', 'g'));
  IF char_length(v_clean) < 3 OR char_length(v_clean) > 120 THEN
    RAISE EXCEPTION 'INVALID_INSCRIPTION_LENGTH';
  END IF;

  v_number := nextval('public.grave_number_seq');
  WHILE EXISTS (SELECT 1 FROM public.graves WHERE grave_number = v_number) LOOP
    v_number := nextval('public.grave_number_seq');
  END LOOP;

  IF p_slot_index IS NULL THEN
    SELECT COALESCE(MAX(slot_index), 0) + 1 INTO v_slot FROM public.graves;
  ELSE
    v_slot := p_slot_index;
    WHILE EXISTS (SELECT 1 FROM public.graves WHERE slot_index = v_slot) LOOP
      v_slot := v_slot + 1;
    END LOOP;
  END IF;

  INSERT INTO public.graves (
    grave_number,
    slot_index,
    zone,
    inscription,
    pos_x,
    pos_y,
    pos_z,
    rotation_y,
    grave_style,
    moderation_status,
    is_demo
  )
  VALUES (
    v_number,
    v_slot,
    p_zone,
    v_clean,
    p_pos_x,
    p_pos_y,
    p_pos_z,
    p_rotation_y,
    p_grave_style,
    'visible',
    false
  )
  RETURNING * INTO v_grave;

  RETURN v_grave;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_grave(text, text, text, real, real, real, real, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_grave(text, text, text, real, real, real, real, int) TO service_role;

-- Row Level Security
ALTER TABLE public.graves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grave_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS graves_select_visible ON public.graves;
CREATE POLICY graves_select_visible ON public.graves
  FOR SELECT
  USING (moderation_status IN ('visible', 'flagged'));

-- No direct client inserts/updates/deletes on graves
GRANT SELECT ON public.public_graves_view TO anon, authenticated;
