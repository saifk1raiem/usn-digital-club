INSERT INTO "PhysicalTestType" ("id", "code", "nameAr", "nameFr", "defaultUnit", "lowerIsBetter", "active")
VALUES
  (gen_random_uuid()::text, 'WEIGHT', 'الوزن', 'Poids', 'kg', false, true),
  (gen_random_uuid()::text, 'HEIGHT', 'الطول', 'Taille', 'cm', false, true),
  (gen_random_uuid()::text, 'SPRINT_10M', 'سرعة 10 أمتار', 'Sprint 10 m', 's', true, true),
  (gen_random_uuid()::text, 'SPRINT_30M', 'سرعة 30 مترا', 'Sprint 30 m', 's', true, true),
  (gen_random_uuid()::text, 'AGILITY', 'الرشاقة', 'Agilité', 's', true, true),
  (gen_random_uuid()::text, 'VERTICAL_JUMP', 'القفز العمودي', 'Détente verticale', 'cm', false, true),
  (gen_random_uuid()::text, 'YOYO', 'اختبار يويو', 'Test Yo-Yo', 'm', false, true),
  (gen_random_uuid()::text, 'RPE', 'الإجهاد المدرك', 'RPE', '/10', true, true),
  (gen_random_uuid()::text, 'TRAINING_LOAD', 'الحمل التدريبي', 'Charge d''entraînement', 'AU', false, true)
ON CONFLICT ("code") DO UPDATE SET
  "nameAr" = EXCLUDED."nameAr",
  "nameFr" = EXCLUDED."nameFr",
  "defaultUnit" = EXCLUDED."defaultUnit",
  "lowerIsBetter" = EXCLUDED."lowerIsBetter",
  "active" = true;
