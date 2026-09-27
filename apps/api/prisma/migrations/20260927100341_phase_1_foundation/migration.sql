-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INJURED', 'SUSPENDED', 'UNAVAILABLE', 'TRIAL', 'LEFT_CLUB');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'REGISTERED', 'NOT_REGISTERED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('RIGHT', 'LEFT', 'BOTH');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('TACTICAL', 'TECHNICAL', 'PHYSICAL', 'RECOVERY', 'GYM', 'GOALKEEPER', 'MATCH_PREPARATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AvailabilityResponse" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'INJURED', 'LATE', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INJURED');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('LEAGUE', 'CUP', 'FRIENDLY', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "VenueSide" AS ENUM ('HOME', 'AWAY', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'INJURY');

-- CreateEnum
CREATE TYPE "MedicalStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'INDIVIDUAL_TRAINING', 'UNAVAILABLE', 'RETURN_TO_TRAINING', 'MATCH_READY');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'FIRST_EVALUATION', 'SECOND_TRIAL', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EquipmentTransactionType" AS ENUM ('ASSIGNED', 'RETURNED', 'DAMAGED', 'LOST', 'REPAIRED', 'PURCHASED');

-- CreateEnum
CREATE TYPE "KitCondition" AS ENUM ('NEW', 'GOOD', 'WORN', 'DAMAGED', 'LOST');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PRIVATE', 'MANAGEMENT', 'MEDICAL', 'STAFF', 'CATEGORY', 'GUARDIANS', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EMPLOYMENT', 'PLAYER', 'VOLUNTEER', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('CLUB', 'CATEGORY', 'STAFF', 'PLAYERS', 'PARENTS', 'USERS');

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'AT_RISK', 'ACHIEVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('INTERNAL', 'PUBLIC', 'BOTH');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "founded" INTEGER,
    "locationAr" TEXT,
    "locationFr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullNameAr" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "nationality" TEXT DEFAULT 'Tunisian',
    "phone" TEXT,
    "emergencyContact" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionFr" TEXT,
    "minBirthYear" INTEGER,
    "maxBirthYear" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "bioAr" TEXT,
    "bioFr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPosition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,

    CONSTRAINT "StaffPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "categoryId" TEXT,
    "positionId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "federationLicenseNumber" TEXT,
    "position" TEXT,
    "preferredFoot" "PreferredFoot",
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeason" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "jerseyNumber" INTEGER,
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "PlayerSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGuardian" (
    "playerId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canCollect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerGuardian_pkey" PRIMARY KEY ("playerId","guardianId")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "address" TEXT,
    "facilityType" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "facilityId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "type" "TrainingType" NOT NULL,
    "intensity" INTEGER,
    "objective" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "trainingId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "response" "AvailabilityResponse" NOT NULL DEFAULT 'NO_RESPONSE',
    "status" "AttendanceStatus",
    "responseNote" TEXT,
    "coachNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "markedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("trainingId","playerId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "facilityId" TEXT,
    "competition" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "venueSide" "VenueSide" NOT NULL,
    "stadium" TEXT,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "meetingAt" TIMESTAMP(3),
    "type" "MatchType" NOT NULL,
    "formation" TEXT,
    "tacticalNotes" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "coachNotes" TEXT,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSquad" (
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "positionCode" TEXT,
    "shirtNumber" INTEGER,

    CONSTRAINT "MatchSquad_pkey" PRIMARY KEY ("matchId","playerId")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "saves" INTEGER,
    "goalsConceded" INTEGER,
    "cleanSheet" BOOLEAN,
    "penaltiesSaved" INTEGER,
    "crossesClaimed" INTEGER,
    "distributionScore" DOUBLE PRECISION,
    "coachEvaluation" TEXT,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("matchId","playerId")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT,
    "type" "MatchEventType" NOT NULL,
    "minute" INTEGER NOT NULL,
    "relatedPlayerId" TEXT,
    "notes" TEXT,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalTestType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "lowerIsBetter" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PhysicalTestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalTestResult" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "testTypeId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "responsibleStaffId" TEXT,
    "notes" TEXT,

    CONSTRAINT "PhysicalTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCase" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "bodyArea" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "severity" TEXT,
    "responsibleStaffId" TEXT,
    "status" "MedicalStatus" NOT NULL,
    "expectedReturnAt" TIMESTAMP(3),
    "confidentialNotes" TEXT,
    "rehabilitationPhase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalUpdate" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "MedicalStatus" NOT NULL,
    "publicNote" TEXT,
    "confidentialNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialEvent" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "facilityId" TEXT,
    "venue" TEXT,
    "registrationFee" DECIMAL(10,3),
    "maxParticipants" INTEGER,
    "description" TEXT,

    CONSTRAINT "TrialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialCandidate" (
    "id" TEXT NOT NULL,
    "trialEventId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "guardianName" TEXT,
    "previousClub" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "status" "TrialStatus" NOT NULL DEFAULT 'REGISTERED',
    "convertedPlayerId" TEXT,

    CONSTRAINT "TrialCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialEvaluation" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "technical" DOUBLE PRECISION,
    "physical" DOUBLE PRECISION,
    "tactical" DOUBLE PRECISION,
    "attitude" DOUBLE PRECISION,
    "notes" TEXT,
    "evaluatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "missing" INTEGER NOT NULL DEFAULT 0,
    "storageLocation" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentTransaction" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "type" "EquipmentTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "assignedToId" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitItem" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" TEXT,
    "number" INTEGER,
    "condition" "KitCondition" NOT NULL DEFAULT 'GOOD',

    CONSTRAINT "KitItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitAssignment" (
    "id" TEXT NOT NULL,
    "kitItemId" TEXT NOT NULL,
    "playerId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "KitAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "salary" DECIMAL(12,3),
    "bonuses" DECIMAL(12,3),
    "renewalOption" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleFr" TEXT,
    "messageAr" TEXT NOT NULL,
    "messageFr" TEXT,
    "audience" "AnnouncementAudience" NOT NULL,
    "categoryId" TEXT,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("announcementId","userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonObjective" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" "ObjectiveStatus" NOT NULL DEFAULT 'PLANNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleFr" TEXT,
    "responsibility" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT,
    "notes" TEXT,
    "decisions" TEXT,
    "attachments" JSONB,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "meetingId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "attendanceStatus" TEXT,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meetingId","personId")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleFr" TEXT,
    "bodyAr" TEXT NOT NULL,
    "bodyFr" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Season_clubId_isCurrent_idx" ON "Season"("clubId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "Season_clubId_name_key" ON "Season"("clubId", "name");

-- CreateIndex
CREATE INDEX "Category_seasonId_active_idx" ON "Category"("seasonId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_seasonId_code_key" ON "Category"("seasonId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_personId_key" ON "StaffProfile"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPosition_code_key" ON "StaffPosition"("code");

-- CreateIndex
CREATE INDEX "StaffAssignment_staffId_seasonId_idx" ON "StaffAssignment"("staffId", "seasonId");

-- CreateIndex
CREATE INDEX "StaffAssignment_categoryId_seasonId_idx" ON "StaffAssignment"("categoryId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_personId_key" ON "Player"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_federationLicenseNumber_key" ON "Player"("federationLicenseNumber");

-- CreateIndex
CREATE INDEX "PlayerSeason_categoryId_seasonId_idx" ON "PlayerSeason"("categoryId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeason_playerId_seasonId_key" ON "PlayerSeason"("playerId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_personId_key" ON "Guardian"("personId");

-- CreateIndex
CREATE INDEX "TrainingSession_categoryId_startsAt_idx" ON "TrainingSession"("categoryId", "startsAt");

-- CreateIndex
CREATE INDEX "Match_categoryId_kickoffAt_idx" ON "Match"("categoryId", "kickoffAt");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_minute_idx" ON "MatchEvent"("matchId", "minute");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalTestType_code_key" ON "PhysicalTestType"("code");

-- CreateIndex
CREATE INDEX "PhysicalTestResult_playerId_testTypeId_measuredAt_idx" ON "PhysicalTestResult"("playerId", "testTypeId", "measuredAt");

-- CreateIndex
CREATE INDEX "MedicalCase_playerId_status_idx" ON "MedicalCase"("playerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TrialCandidate_convertedPlayerId_key" ON "TrialCandidate"("convertedPlayerId");

-- CreateIndex
CREATE INDEX "Document_ownerType_ownerId_idx" ON "Document"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Document_expiryDate_idx" ON "Document"("expiryDate");

-- CreateIndex
CREATE INDEX "Contract_endsAt_idx" ON "Contract"("endsAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMember_committeeId_personId_titleAr_key" ON "CommitteeMember"("committeeId", "personId", "titleAr");

-- CreateIndex
CREATE INDEX "NewsPost_status_visibility_publishedAt_idx" ON "NewsPost"("status", "visibility", "publishedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "AuditLog"("entity", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "StaffPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSquad" ADD CONSTRAINT "MatchSquad_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSquad" ADD CONSTRAINT "MatchSquad_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalTestResult" ADD CONSTRAINT "PhysicalTestResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalTestResult" ADD CONSTRAINT "PhysicalTestResult_testTypeId_fkey" FOREIGN KEY ("testTypeId") REFERENCES "PhysicalTestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalTestResult" ADD CONSTRAINT "PhysicalTestResult_responsibleStaffId_fkey" FOREIGN KEY ("responsibleStaffId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCase" ADD CONSTRAINT "MedicalCase_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCase" ADD CONSTRAINT "MedicalCase_responsibleStaffId_fkey" FOREIGN KEY ("responsibleStaffId") REFERENCES "StaffProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalUpdate" ADD CONSTRAINT "MedicalUpdate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "MedicalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalUpdate" ADD CONSTRAINT "MedicalUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialEvent" ADD CONSTRAINT "TrialEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialEvent" ADD CONSTRAINT "TrialEvent_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialCandidate" ADD CONSTRAINT "TrialCandidate_trialEventId_fkey" FOREIGN KEY ("trialEventId") REFERENCES "TrialEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialEvaluation" ADD CONSTRAINT "TrialEvaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "TrialCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentTransaction" ADD CONSTRAINT "EquipmentTransaction_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitItem" ADD CONSTRAINT "KitItem_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitAssignment" ADD CONSTRAINT "KitAssignment_kitItemId_fkey" FOREIGN KEY ("kitItemId") REFERENCES "KitItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitAssignment" ADD CONSTRAINT "KitAssignment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonObjective" ADD CONSTRAINT "SeasonObjective_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonObjective" ADD CONSTRAINT "SeasonObjective_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonObjective" ADD CONSTRAINT "SeasonObjective_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
