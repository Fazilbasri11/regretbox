-- RegretBox v3.0 Seed Data (40 spacious neutral graves: #00252 through #00291)

INSERT INTO public.graves (
  grave_number, slot_index, zone, inscription, pos_x, pos_y, pos_z, rotation_y, grave_style, created_at, moderation_status, is_demo
)
VALUES
  (252, 1, 'old_cemetery', 'Left a good friend standing alone at the station.', -11.58, 0.92, -42.28, 0.03, 'slim', '2026-08-12T10:00:00Z', 'visible', true),
  (253, 2, 'old_cemetery', 'Terlalu takut mencoba sampai waktu habis.', -5.6, 0.85, -42.72, 0.08, 'arched', '2026-08-15T11:20:00Z', 'visible', true),
  (254, 3, 'old_cemetery', 'Burned a bridge just to prove a point.', 5.38, 1.01, -42.28, -0.065, 'pillar', '2026-08-18T14:00:00Z', 'visible', true),
  (255, 4, 'old_cemetery', 'Menunda minta maaf hingga terlambat.', 11.8, 1.47, -42.72, -0.09, 'scroll', '2026-08-21T09:10:00Z', 'visible', true),
  (256, 5, 'old_cemetery', 'Ignored the quiet warning in my own chest.', -12.02, 0.78, -37.88, 0.03, 'arched', '2026-08-24T17:45:00Z', 'visible', true),
  (257, 6, 'old_cemetery', 'Berpura-pura baik-baik saja terlalu lama.', -5.38, 0.91, -38.32, 0.055, 'slim', '2026-08-27T20:30:00Z', 'visible', true),
  (258, 7, 'old_cemetery', 'Sold patience for instant relief.', 5.6, 1.19, -37.88, -0.04, 'arched', '2026-08-30T08:15:00Z', 'visible', true),
  (259, 8, 'old_cemetery', 'Tidak datang di hari penting keluargaku.', 12.02, 1.44, -38.32, -0.09, 'scroll', '2026-09-02T12:00:00Z', 'visible', true),
  (260, 9, 'old_cemetery', 'Chased applause from people who never knew me.', -11.8, 0.82, -33.48, 0.055, 'pillar', '2026-09-05T15:20:00Z', 'visible', true),
  (261, 10, 'old_cemetery', 'Membandingkan hidupku dengan bayangan orang lain.', -5.82, 0.76, -33.92, 0.08, 'arched', '2026-09-08T19:00:00Z', 'visible', true),
  (262, 11, 'memorial_garden', 'Spoke sharply when silence was kinder.', 5.82, 1.16, -33.48, -0.065, 'slim', '2026-09-11T10:30:00Z', 'visible', true),
  (263, 12, 'memorial_garden', 'Menyia-nyiakan kepercayaan yang susah dibangun.', 11.58, 1.28, -33.92, -0.115, 'arched', '2026-09-14T16:40:00Z', 'visible', true),
  (264, 13, 'old_cemetery', 'Kept promises to strangers and broke my own.', -11.58, 0.73, -29.08, 0.08, 'scroll', '2026-09-17T07:50:00Z', 'visible', true),
  (265, 14, 'old_cemetery', 'Lupa berterima kasih saat masih sempat.', -5.6, 0.73, -29.52, 0.13, 'arched', '2026-09-20T13:15:00Z', 'visible', true),
  (266, 15, 'memorial_garden', 'Stayed two years in a room I outgrew.', 5.38, 1.07, -29.08, -0.14, 'pillar', '2026-09-23T18:25:00Z', 'visible', true),
  (267, 16, 'memorial_garden', 'Membiarkan gengsi menang atas rindu.', 11.8, 1.27, -29.52, -0.115, 'slim', '2026-09-26T21:10:00Z', 'visible', true),
  (268, 17, 'old_cemetery', 'Thought there would always be another weekend.', -12.02, 0.71, -24.68, 0.055, 'arched', '2026-09-29T09:40:00Z', 'visible', true),
  (269, 18, 'old_cemetery', 'Menjawab dengan emosi saat lelah.', -5.38, 0.78, -25.12, 0.08, 'scroll', '2026-10-02T14:55:00Z', 'visible', true),
  (270, 19, 'memorial_garden', 'Let fear write my excuses for a decade.', 5.6, 0.94, -24.68, -0.065, 'arched', '2026-10-05T11:20:00Z', 'visible', true),
  (271, 20, 'memorial_garden', 'Tidak jujur sejak awal agar terlihat kuat.', 12.02, 1.29, -25.12, -0.14, 'slim', '2026-10-08T17:05:00Z', 'visible', true),
  (272, 21, 'old_cemetery', 'Closed the door before hearing the full story.', -11.8, 0.71, -20.28, 0.03, 'arched', '2026-10-11T08:30:00Z', 'visible', true),
  (273, 22, 'old_cemetery', 'Menghabiskan malam untuk khawatir hal kecil.', -5.82, 0.74, -20.72, 0.055, 'pillar', '2026-10-14T22:00:00Z', 'visible', true),
  (274, 23, 'new_cemetery', 'Walked away without saying goodbye properly.', 5.82, 0.87, -20.28, -0.09, 'arched', '2026-10-17T15:15:00Z', 'visible', true),
  (275, 24, 'new_cemetery', 'Terlalu sering bilang nanti.', 11.58, 1.15, -20.72, -0.09, 'scroll', '2026-10-20T10:45:00Z', 'visible', true),
  (276, 25, 'new_cemetery', 'Spent savings trying to impress nobody.', -11.58, 0.66, -15.88, 0.03, 'slim', '2026-10-23T19:30:00Z', 'visible', true),
  (277, 26, 'new_cemetery', 'Percaya janji manis tanpa melihat kenyataan.', -5.6, 0.72, -16.32, 0.055, 'arched', '2026-10-26T12:10:00Z', 'visible', true),
  (278, 27, 'new_cemetery', 'Forgot to celebrate small victories.', 5.38, 0.75, -15.88, -0.065, 'arched', '2026-10-29T16:00:00Z', 'visible', true),
  (279, 28, 'new_cemetery', 'Menyakiti orang yang paling tulus.', 11.8, 1.14, -16.32, -0.09, 'pillar', '2026-11-01T20:20:00Z', 'visible', true),
  (280, 29, 'new_cemetery', 'Kept checking a door that had already locked.', -12.02, 0.67, -11.48, 0.08, 'arched', '2026-11-03T08:50:00Z', 'visible', true),
  (281, 30, 'new_cemetery', 'Membuang waktu di tempat yang salah.', -5.38, 0.63, -11.92, 0.055, 'slim', '2026-11-05T14:15:00Z', 'visible', true),
  (282, 31, 'new_cemetery', 'Argued to win instead of listen.', 5.6, 0.66, -11.48, -0.065, 'scroll', '2026-11-07T11:30:00Z', 'visible', true),
  (283, 32, 'new_cemetery', 'Menyerah satu langkah sebelum selesai.', 12.02, 1.09, -11.92, -0.09, 'arched', '2026-11-09T18:40:00Z', 'visible', true),
  (284, 33, 'new_cemetery', 'Hidup untuk menyenangkan semua orang.', -11.8, 0.52, -7.08, 0.08, 'pillar', '2026-11-11T09:20:00Z', 'visible', true),
  (285, 34, 'new_cemetery', 'Ignored the red flags in soft light.', -5.82, 0.56, -7.52, 0.055, 'arched', '2026-11-13T15:00:00Z', 'visible', true),
  (286, 35, 'new_cemetery', 'Missed the last train home.', 5.82, 0.62, -7.08, -0.065, 'slim', '2026-11-15T21:10:00Z', 'visible', true),
  (287, 36, 'new_cemetery', 'Mengambil keputusan besar saat sedang marah.', 11.58, 0.99, -7.52, -0.09, 'arched', '2026-11-16T13:45:00Z', 'visible', true),
  (288, 37, 'new_cemetery', 'Sold too early out of panic.', -9.6, 0.58, -4.2, 0.09, 'scroll', '2026-11-17T10:15:00Z', 'visible', true),
  (289, 38, 'new_cemetery', 'Mungkin aku bisa lebih sabar.', 4.35, 0.34, -2.2, -0.14, 'arched', '2026-11-18T12:00:00Z', 'visible', true),
  (290, 39, 'new_cemetery', 'Terlalu percaya sama dia...', -4.65, 0.45, -1.9, 0.15, 'arched', '2026-11-20T14:30:00Z', 'visible', true),
  (291, 40, 'new_cemetery', 'Seharusnya aku tidak membeli itu.', -0.75, 0.05, 1.65, 0.06, 'arched', '2026-11-25T09:00:00Z', 'visible', true)
ON CONFLICT (grave_number) DO NOTHING;

SELECT setval('public.grave_number_seq', GREATEST((SELECT COALESCE(MAX(grave_number), 0) FROM public.graves), 291));
