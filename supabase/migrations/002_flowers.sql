-- Adds flower_count and single stone rose color ('white' | 'red') to graves

ALTER TABLE public.graves
  ADD COLUMN IF NOT EXISTS flower_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flower_color text NULL CHECK (flower_color IN ('white', 'red'));

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
  is_demo,
  flower_count,
  flower_color
FROM public.graves
WHERE moderation_status IN ('visible', 'flagged');

CREATE OR REPLACE FUNCTION public.add_grave_flower(p_grave_id uuid)
RETURNS TABLE (flower_count int, flower_color text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chosen text;
BEGIN
  v_chosen := CASE WHEN random() < 0.5 THEN 'white' ELSE 'red' END;

  RETURN QUERY
  UPDATE public.graves g
  SET
    flower_count = g.flower_count + 1,
    flower_color = COALESCE(g.flower_color, v_chosen)
  WHERE g.id = p_grave_id
    AND g.moderation_status IN ('visible', 'flagged')
  RETURNING g.flower_count, g.flower_color;
END;
$$;
