export type Locale = 'ar' | 'fr';

export const systemRoles = [
  'SUPER_ADMIN', 'PRESIDENT', 'MANAGEMENT', 'TECHNICAL_DIRECTOR', 'HEAD_COACH',
  'ASSISTANT_COACH', 'GOALKEEPER_COACH', 'PHYSICAL_COACH', 'MEDICAL',
  'PHYSIOTHERAPIST', 'NURSE', 'TEAM_STAFF', 'EQUIPMENT_MANAGER', 'KIT_MANAGER',
  'PLAYER', 'PARENT', 'VIEWER',
] as const;
export type SystemRole = (typeof systemRoles)[number];

export const permissions = [
  'dashboard.view', 'players.view', 'players.create', 'players.edit', 'staff.view',
  'staff.manage', 'training.view', 'training.create', 'training.manageAttendance',
  'matches.view', 'matches.create', 'matches.selectSquad', 'medical.viewAvailability',
  'medical.viewDetails', 'medical.edit', 'performance.view', 'performance.edit',
  'contracts.view', 'contracts.manage', 'equipment.manage', 'categories.manage',
  'seasons.manage', 'users.manage', 'news.publish',
] as const;
export type PermissionKey = (typeof permissions)[number];

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: SystemRole[];
  permissions: PermissionKey[];
  categoryIds: string[];
  locale: Locale;
}

export interface ApiEnvelope<T> { data: T; meta?: Record<string, unknown> }
export interface CategorySummary { id: string; nameAr: string; nameFr: string; code: string; active: boolean; playerCount?: number }
export interface SeasonSummary { id: string; name: string; startsAt: string; endsAt: string; isCurrent: boolean }
export interface PlayerSummary { id: string; fullNameAr: string; firstName: string; lastName: string; jerseyNumber?: number | null; position?: string | null; status: string; category: CategorySummary }
export interface StaffSummary { id: string; fullNameAr: string; firstName: string; lastName: string; phone?: string | null; assignments: Array<{ position: string; category?: string | null }> }
