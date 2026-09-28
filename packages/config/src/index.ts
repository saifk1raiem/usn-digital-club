import type { PermissionKey, SystemRole } from '@usn/types';

export const club = {
  nameAr: 'الاتحاد الرياضي بالناظور', nameFr: 'Union Sportive de Nadhour',
  shortName: 'USN', founded: 1977, location: 'الناظور، زغوان، تونس', season: '2026/2027',
} as const;

export const rolePermissions: Record<SystemRole, PermissionKey[]> = {
  SUPER_ADMIN: ['dashboard.view','players.view','players.create','players.edit','staff.view','staff.manage','training.view','training.create','training.manageAttendance','matches.view','matches.create','matches.selectSquad','medical.viewAvailability','medical.viewDetails','medical.edit','performance.view','performance.edit','guardians.view','guardians.manage','trials.view','trials.manage','contracts.view','contracts.manage','equipment.manage','categories.manage','seasons.manage','users.manage','news.publish','announcements.view','announcements.publish','notifications.view'],
  PRESIDENT: ['dashboard.view','players.view','staff.view','training.view','matches.view','medical.viewAvailability','performance.view','guardians.view','trials.view','contracts.view','categories.manage','seasons.manage','news.publish','announcements.view','announcements.publish','notifications.view'],
  MANAGEMENT: ['dashboard.view','players.view','staff.view','training.view','matches.view','medical.viewAvailability','guardians.view','guardians.manage','trials.view','trials.manage','contracts.view','equipment.manage','news.publish','announcements.view','announcements.publish','notifications.view'],
  TECHNICAL_DIRECTOR: ['dashboard.view','players.view','players.create','players.edit','staff.view','staff.manage','training.view','training.create','training.manageAttendance','matches.view','matches.create','matches.selectSquad','medical.viewAvailability','performance.view','performance.edit','guardians.view','guardians.manage','trials.view','trials.manage','categories.manage','announcements.view','announcements.publish','notifications.view'],
  HEAD_COACH: ['dashboard.view','players.view','players.edit','staff.view','training.view','training.create','training.manageAttendance','matches.view','matches.create','matches.selectSquad','medical.viewAvailability','performance.view','performance.edit','guardians.view','trials.view','trials.manage','announcements.view','announcements.publish','notifications.view'],
  ASSISTANT_COACH: ['dashboard.view','players.view','staff.view','training.view','training.create','training.manageAttendance','matches.view','medical.viewAvailability','performance.view','announcements.view','notifications.view'],
  GOALKEEPER_COACH: ['dashboard.view','players.view','training.view','training.create','matches.view','medical.viewAvailability','performance.view','performance.edit','announcements.view','notifications.view'],
  PHYSICAL_COACH: ['dashboard.view','players.view','training.view','medical.viewAvailability','performance.view','performance.edit','announcements.view','notifications.view'],
  MEDICAL: ['dashboard.view','players.view','training.view','medical.viewAvailability','medical.viewDetails','medical.edit','announcements.view','notifications.view'],
  PHYSIOTHERAPIST: ['dashboard.view','players.view','training.view','medical.viewAvailability','medical.viewDetails','medical.edit','announcements.view','notifications.view'],
  NURSE: ['dashboard.view','players.view','medical.viewAvailability','medical.viewDetails','medical.edit','announcements.view','notifications.view'],
  TEAM_STAFF: ['dashboard.view','players.view','training.view','matches.view','medical.viewAvailability','announcements.view','notifications.view'],
  EQUIPMENT_MANAGER: ['dashboard.view','equipment.manage','announcements.view','notifications.view'], KIT_MANAGER: ['dashboard.view','equipment.manage','announcements.view','notifications.view'],
  PLAYER: ['dashboard.view','training.view','matches.view','announcements.view','notifications.view'], PARENT: ['dashboard.view','training.view','matches.view','announcements.view','notifications.view'],
  VIEWER: ['dashboard.view','announcements.view','notifications.view'],
};

for (const [role, keys] of Object.entries(rolePermissions) as Array<[SystemRole, PermissionKey[]]>) {
  if ((keys.includes('players.view') || role === 'PLAYER' || role === 'PARENT') && !keys.includes('team.view')) keys.push('team.view');
}
