-- RegretBox v2.0 Demonstration Seed Graves
-- Clearly labeled is_demo = true

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
  created_at,
  moderation_status,
  is_demo
)
VALUES
  (289, 1, 'new_cemetery', 'Maybe I could have been more patient.', 6.2, 0, -4.5, -0.06, 'classic', now() - interval '7 days', 'visible', true),
  (290, 2, 'new_cemetery', 'Trusted them far too easily.', -6.2, 0, -4.5, 0.08, 'mossy_stone', now() - interval '5 days', 'visible', true),
  (291, 3, 'new_cemetery', 'I should not have bought that.', -4.8, 0, 1.5, 0.04, 'classic', now() - interval '2 days', 'visible', true),
  (292, 4, 'new_cemetery', 'I should have walked away.', -9.6, 0, -10.5, 0.05, 'obelisk', now() - interval '14 days', 'visible', true),
  (293, 5, 'new_cemetery', 'Held back an apology out of stubborn pride.', 9.6, 0, -10.5, -0.04, 'cross_arch', now() - interval '19 days', 'visible', true),
  (294, 6, 'old_cemetery', 'Thought there would always be another weekend.', -6.8, 0, -37.0, 0.04, 'mossy_stone', now() - interval '45 days', 'visible', true),
  (295, 7, 'old_cemetery', 'Chased applause instead of quiet craft.', 6.8, 0, -37.0, -0.05, 'slab', now() - interval '62 days', 'visible', true),
  (296, 8, 'memorial_garden', 'Stayed two years in a place I had already outgrown.', -12.8, 0, -44.0, 0.03, 'classic', now() - interval '90 days', 'visible', true),
  (297, 9, 'memorial_garden', 'Argued to win instead of listening.', 12.8, 0, -44.0, -0.03, 'obelisk', now() - interval '120 days', 'visible', true)
ON CONFLICT (grave_number) DO NOTHING;

SELECT setval('public.grave_number_seq', GREATEST((SELECT COALESCE(MAX(grave_number), 0) FROM public.graves), 297));
