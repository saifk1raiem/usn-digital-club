import type { PermissionKey, SystemRole } from '@usn/types';

export const club = {
  nameAr: 'الاتحاد الرياضي بالناظور', nameFr: 'Union Sportive de Nadhour',
  shortName: 'USN', founded: 1977, location: 'الناظور، زغوان، تونس', season: '2026/2027',
} as const;

export const rolePermissions: Record<SystemRole, PermissionKey[]> = {
  SUPER_ADMIN: ['dashboard.view','players.view','players.create','players.edit','staff.view','staff.manage','training.view','training.create','training.manageAttendance','matches.view','matches.create','matches.selectSquad','medical.viewAvailability','medical.viewDetails','medical.edit','performance.view','performance.edit','contracts.view','contracts.manage','equipment.manage','categories.manage','seasons.manage','users.manage','news.publish'],
  PRESIDENT: ['dashboard.view','players.view','staff.view','training.view','matches.view','medical.viewAvailability','performance.view','contracts.view','categories.manage','seasons.manage','news.publish'],
  MANAGEMENT: ['dashboard.view','players.view','staff.view','training.view','matches.view','medical.viewAvailability','contracts.view','equipment.manage','news.publish'],
  TECHNICAL_DIRECTOR: ['dashboard.view','players.view','players.create','players.edit','staff.view','staff.manage','training.view','training.create','training.manageAttendance','matches.view','matches.create','matches.selectSquad','medical.viewAvailability','performance.view','performance.edit','categories.manage'],
  HEAD_COACH: ['dashboard.view','players.view','players.edit','staff.view','training.view','training.create','training.manageAttendance','matches.view','matches.create','matches.selectSquad','medical.viewAvailability','performance.view','performance.edit'],
  ASSISTANT_COACH: ['dashboard.view','players.view','staff.view','training.view','training.create','training.manageAttendance','matches.view','medical.viewAvailability','performance.view'],
  GOALKEEPER_COACH: ['dashboard.view','players.view','training.view','training.create','matches.view','medical.viewAvailability','performance.view','performance.edit'],
  PHYSICAL_COACH: ['dashboard.view','players.view','training.view','medical.viewAvailability','performance.view','performance.edit'],
  MEDICAL: ['dashboard.view','players.view','training.view','medical.viewAvailability','medical.viewDetails','medical.edit'],
  PHYSIOTHERAPIST: ['dashboard.view','players.view','training.view','medical.viewAvailability','medical.viewDetails','medical.edit'],
  NURSE: ['dashboard.view','players.view','medical.viewAvailability','medical.viewDetails','medical.edit'],
  TEAM_STAFF: ['dashboard.view','players.view','training.view','matches.view','medical.viewAvailability'],
  EQUIPMENT_MANAGER: ['dashboard.view','equipment.manage'], KIT_MANAGER: ['dashboard.view','equipment.manage'],
  PLAYER: ['dashboard.view','training.view','matches.view'], PARENT: ['dashboard.view','training.view','matches.view'],
  VIEWER: ['dashboard.view'],
};
