INSERT INTO "Permission" ("id", "key", "description")
VALUES
  (gen_random_uuid()::text, 'guardians.view', 'View guardians for permitted categories'),
  (gen_random_uuid()::text, 'guardians.manage', 'Create and link guardians in permitted categories'),
  (gen_random_uuid()::text, 'trials.view', 'View trial events and candidates for permitted categories'),
  (gen_random_uuid()::text, 'trials.manage', 'Manage trial events, evaluations, and candidate workflow')
ON CONFLICT ("key") DO UPDATE SET "description" = EXCLUDED."description";

WITH grants(role_key, permission_key) AS (
  VALUES
    ('SUPER_ADMIN', 'guardians.view'),
    ('SUPER_ADMIN', 'guardians.manage'),
    ('SUPER_ADMIN', 'trials.view'),
    ('SUPER_ADMIN', 'trials.manage'),
    ('PRESIDENT', 'guardians.view'),
    ('PRESIDENT', 'trials.view'),
    ('MANAGEMENT', 'guardians.view'),
    ('MANAGEMENT', 'guardians.manage'),
    ('MANAGEMENT', 'trials.view'),
    ('MANAGEMENT', 'trials.manage'),
    ('TECHNICAL_DIRECTOR', 'guardians.view'),
    ('TECHNICAL_DIRECTOR', 'guardians.manage'),
    ('TECHNICAL_DIRECTOR', 'trials.view'),
    ('TECHNICAL_DIRECTOR', 'trials.manage'),
    ('HEAD_COACH', 'guardians.view'),
    ('HEAD_COACH', 'trials.view'),
    ('HEAD_COACH', 'trials.manage')
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role_record.id, permission_record.id
FROM grants
JOIN "Role" role_record ON role_record.key = grants.role_key
JOIN "Permission" permission_record ON permission_record.key = grants.permission_key
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
