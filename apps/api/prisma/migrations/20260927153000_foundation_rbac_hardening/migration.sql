-- Permission grants are now explicitly global or scoped to one or more categories.
ALTER TABLE "UserRole" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "UserRoleScope" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRoleScope_pkey" PRIMARY KEY ("userId", "roleId", "categoryId")
);

CREATE INDEX "UserRoleScope_categoryId_idx" ON "UserRoleScope"("categoryId");

-- Preserve the previous club-wide semantics for the three original global roles.
UPDATE "UserRole" ur
SET "isGlobal" = true
FROM "Role" r
WHERE ur."roleId" = r."id" AND r."key" IN ('SUPER_ADMIN', 'PRESIDENT', 'TECHNICAL_DIRECTOR');

-- Backfill existing staff grants from their current-season category assignments.
INSERT INTO "UserRoleScope" ("userId", "roleId", "categoryId")
SELECT DISTINCT ur."userId", ur."roleId", sa."categoryId"
FROM "UserRole" ur
JOIN "User" u ON u."id" = ur."userId"
JOIN "StaffProfile" sp ON sp."personId" = u."personId"
JOIN "StaffAssignment" sa ON sa."staffId" = sp."id"
JOIN "Season" s ON s."id" = sa."seasonId" AND s."isCurrent" = true
WHERE ur."isGlobal" = false
  AND sa."categoryId" IS NOT NULL
  AND sa."startDate" <= CURRENT_TIMESTAMP
  AND (sa."endDate" IS NULL OR sa."endDate" > CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

ALTER TABLE "UserRoleScope" ADD CONSTRAINT "UserRoleScope_userId_roleId_fkey"
FOREIGN KEY ("userId", "roleId") REFERENCES "UserRole"("userId", "roleId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRoleScope" ADD CONSTRAINT "UserRoleScope_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Core hierarchy integrity: a category must belong to the same club/season as its dependants.
ALTER TABLE "Category" DROP CONSTRAINT "Category_clubId_fkey";
ALTER TABLE "Category" DROP CONSTRAINT "Category_seasonId_fkey";
ALTER TABLE "Committee" DROP CONSTRAINT "Committee_seasonId_fkey";
ALTER TABLE "Match" DROP CONSTRAINT "Match_categoryId_fkey";
ALTER TABLE "PlayerSeason" DROP CONSTRAINT "PlayerSeason_categoryId_fkey";
ALTER TABLE "SeasonObjective" DROP CONSTRAINT "SeasonObjective_categoryId_fkey";
ALTER TABLE "StaffAssignment" DROP CONSTRAINT "StaffAssignment_categoryId_fkey";
ALTER TABLE "TrainingSession" DROP CONSTRAINT "TrainingSession_categoryId_fkey";

CREATE UNIQUE INDEX "Category_id_seasonId_key" ON "Category"("id", "seasonId");
CREATE UNIQUE INDEX "Season_id_clubId_key" ON "Season"("id", "clubId");

ALTER TABLE "Category" ADD CONSTRAINT "Category_seasonId_clubId_fkey"
FOREIGN KEY ("seasonId", "clubId") REFERENCES "Season"("id", "clubId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_categoryId_seasonId_fkey"
FOREIGN KEY ("categoryId", "seasonId") REFERENCES "Category"("id", "seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_categoryId_seasonId_fkey"
FOREIGN KEY ("categoryId", "seasonId") REFERENCES "Category"("id", "seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_categoryId_seasonId_fkey"
FOREIGN KEY ("categoryId", "seasonId") REFERENCES "Category"("id", "seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_categoryId_seasonId_fkey"
FOREIGN KEY ("categoryId", "seasonId") REFERENCES "Category"("id", "seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeasonObjective" ADD CONSTRAINT "SeasonObjective_categoryId_seasonId_fkey"
FOREIGN KEY ("categoryId", "seasonId") REFERENCES "Category"("id", "seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_seasonId_clubId_fkey"
FOREIGN KEY ("seasonId", "clubId") REFERENCES "Season"("id", "clubId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve historical core records by replacing destructive cascades with restrictions.
ALTER TABLE "User" DROP CONSTRAINT "User_personId_fkey";
ALTER TABLE "Season" DROP CONSTRAINT "Season_clubId_fkey";
ALTER TABLE "Guardian" DROP CONSTRAINT "Guardian_personId_fkey";
ALTER TABLE "Player" DROP CONSTRAINT "Player_personId_fkey";
ALTER TABLE "PlayerGuardian" DROP CONSTRAINT "PlayerGuardian_guardianId_fkey";
ALTER TABLE "PlayerGuardian" DROP CONSTRAINT "PlayerGuardian_playerId_fkey";
ALTER TABLE "PlayerSeason" DROP CONSTRAINT "PlayerSeason_playerId_fkey";
ALTER TABLE "PlayerSeason" DROP CONSTRAINT "PlayerSeason_seasonId_fkey";
ALTER TABLE "StaffAssignment" DROP CONSTRAINT "StaffAssignment_seasonId_fkey";
ALTER TABLE "StaffAssignment" DROP CONSTRAINT "StaffAssignment_staffId_fkey";
ALTER TABLE "StaffProfile" DROP CONSTRAINT "StaffProfile_personId_fkey";

ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Season" ADD CONSTRAINT "Season_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Missing relational integrity.
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_relatedPlayerId_fkey" FOREIGN KEY ("relatedPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrialCandidate" ADD CONSTRAINT "TrialCandidate_convertedPlayerId_fkey" FOREIGN KEY ("convertedPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrialEvaluation" ADD CONSTRAINT "TrialEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EquipmentTransaction" ADD CONSTRAINT "EquipmentTransaction_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Query-path indexes.
CREATE INDEX "Announcement_categoryId_publishAt_expiresAt_idx" ON "Announcement"("categoryId", "publishAt", "expiresAt");
CREATE INDEX "AnnouncementRead_userId_readAt_idx" ON "AnnouncementRead"("userId", "readAt");
CREATE INDEX "MatchPlayer_playerId_idx" ON "MatchPlayer"("playerId");
CREATE INDEX "MatchSquad_playerId_idx" ON "MatchSquad"("playerId");
CREATE INDEX "PlayerGuardian_guardianId_idx" ON "PlayerGuardian"("guardianId");
CREATE INDEX "RefreshToken_userId_revokedAt_expiresAt_idx" ON "RefreshToken"("userId", "revokedAt", "expiresAt");
CREATE INDEX "TrainingAttendance_playerId_idx" ON "TrainingAttendance"("playerId");

-- Cross-row uniqueness that Prisma cannot express as partial indexes.
CREATE UNIQUE INDEX "Season_one_current_per_club_key" ON "Season"("clubId") WHERE "isCurrent" = true;
CREATE UNIQUE INDEX "PlayerSeason_active_jersey_key" ON "PlayerSeason"("seasonId", "categoryId", "jerseyNumber") WHERE "jerseyNumber" IS NOT NULL AND "leftAt" IS NULL;
CREATE UNIQUE INDEX "User_email_normalized_key" ON "User"(LOWER("email"));

-- Domain invariants are enforced even for imports and direct database writes.
ALTER TABLE "Season" ADD CONSTRAINT "Season_dates_check" CHECK ("endsAt" > "startsAt");
ALTER TABLE "Category" ADD CONSTRAINT "Category_birth_years_check" CHECK ("minBirthYear" IS NULL OR "maxBirthYear" IS NULL OR "minBirthYear" <= "maxBirthYear");
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_time_check" CHECK ("endsAt" > "startsAt");
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_intensity_check" CHECK ("intensity" IS NULL OR "intensity" BETWEEN 1 AND 10);
ALTER TABLE "Match" ADD CONSTRAINT "Match_meeting_time_check" CHECK ("meetingAt" IS NULL OR "meetingAt" <= "kickoffAt");
ALTER TABLE "Match" ADD CONSTRAINT "Match_score_check" CHECK (("homeScore" IS NULL OR "homeScore" >= 0) AND ("awayScore" IS NULL OR "awayScore" >= 0));
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_minute_check" CHECK ("minute" BETWEEN 0 AND 130);
ALTER TABLE "SeasonObjective" ADD CONSTRAINT "SeasonObjective_progress_check" CHECK ("progress" BETWEEN 0 AND 100);
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_dates_check" CHECK ("endsAt" >= "startsAt");
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_quantities_check" CHECK ("quantity" >= 0 AND "available" >= 0 AND "damaged" >= 0 AND "missing" >= 0 AND "available" + "damaged" + "missing" <= "quantity");
ALTER TABLE "EquipmentTransaction" ADD CONSTRAINT "EquipmentTransaction_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "User" ADD CONSTRAINT "User_locale_check" CHECK ("locale" IN ('ar', 'fr'));
