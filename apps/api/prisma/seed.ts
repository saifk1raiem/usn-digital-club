import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const permissionKeys = [
  'dashboard.view','players.view','players.create','players.edit','staff.view','staff.manage',
  'training.view','training.create','training.manageAttendance','matches.view','matches.create',
  'matches.selectSquad','medical.viewAvailability','medical.viewDetails','medical.edit',
  'performance.view','performance.edit','contracts.view','contracts.manage','equipment.manage',
  'categories.manage','seasons.manage','users.manage','news.publish','announcements.view',
  'announcements.publish','notifications.view',
];

const rolePermissionSeeds: Record<string, string[]> = {
  SUPER_ADMIN: permissionKeys,
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
  PLAYER: ['dashboard.view','training.view','matches.view'], PARENT: ['dashboard.view','training.view','matches.view'], VIEWER: ['dashboard.view'],
};

for (const [role, keys] of Object.entries(rolePermissionSeeds)) {
  if (role !== 'SUPER_ADMIN') keys.push('announcements.view', 'notifications.view');
  if (['PRESIDENT', 'MANAGEMENT', 'TECHNICAL_DIRECTOR', 'HEAD_COACH'].includes(role)) keys.push('announcements.publish');
}

const positionSeeds = [
  ['TECHNICAL_DIRECTOR', 'المدير الفني', 'Directeur technique'],
  ['HEAD_COACH', 'المدرب الأول', 'Entraîneur principal'],
  ['ASSISTANT_COACH', 'مدرب مساعد', 'Entraîneur adjoint'],
  ['PHYSICAL_COACH', 'مدرب إعداد بدني', 'Préparateur physique'],
  ['GOALKEEPER_COACH', 'مدرب حراس المرمى', 'Entraîneur des gardiens'],
  ['COACH', 'مدرب', 'Entraîneur'],
  ['PHYSIOTHERAPIST', 'أخصائي العلاج الطبيعي', 'Kinésithérapeute'],
  ['NURSE', 'ممرض', 'Infirmier'],
  ['TEAM_ACCOMPANIER', 'مرافق الفريق', "Accompagnateur d'équipe"],
  ['FACILITY_KIT_MANAGER', 'مسؤول الملاعب والأزياء', 'Responsable terrains et tenues'],
  ['EQUIPMENT_MANAGER', 'مسؤول المعدات الرياضية', 'Responsable du matériel sportif'],
  ['COMMITTEE_MEMBER', 'عضو الهيئة المديرة', 'Membre du comité directeur'],
] as const;

async function main() {
  const club = await prisma.club.upsert({
    where: { id: 'usn-club' }, update: {},
    create: { id: 'usn-club', nameAr: 'الاتحاد الرياضي بالناظور', nameFr: 'Union Sportive de Nadhour', shortName: 'USN', founded: 1977, locationAr: 'الناظور، زغوان، تونس', locationFr: 'Nadhour, Zaghouan, Tunisie' },
  });
  const season = await prisma.season.upsert({
    where: { clubId_name: { clubId: club.id, name: '2026/2027' } },
    update: { isCurrent: true },
    create: { clubId: club.id, name: '2026/2027', startsAt: new Date('2026-07-01'), endsAt: new Date('2027-06-30'), isCurrent: true },
  });

  const categorySeeds = [
    ['SENIORS', 'الأكابر', 'Seniors'], ['U21', 'الأواسط', 'Élites / U21'],
    ['U17', 'الأصاغر', 'Cadets / U17'], ['U15', 'الأداني', 'Minimes / U15'],
    ['ACADEMY', 'مركز التكوين', 'Centre de formation'],
  ] as const;
  const categories = new Map<string, string>();
  for (const [code, nameAr, nameFr] of categorySeeds) {
    const category = await prisma.category.upsert({
      where: { seasonId_code: { seasonId: season.id, code } },
      update: { nameAr, nameFr }, create: { clubId: club.id, seasonId: season.id, code, nameAr, nameFr },
    });
    categories.set(code, category.id);
  }

  const positions = new Map<string, string>();
  for (const [code, nameAr, nameFr] of positionSeeds) {
    const position = await prisma.staffPosition.upsert({ where: { code }, update: { nameAr, nameFr }, create: { code, nameAr, nameFr } });
    positions.set(code, position.id);
  }

  const permissions = new Map<string, string>();
  for (const key of permissionKeys) {
    const permission = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
    permissions.set(key, permission.id);
  }
  const roles = new Map<string, string>();
  for (const [key, keys] of Object.entries(rolePermissionSeeds)) {
    const role = await prisma.role.upsert({ where: { key }, update: {}, create: { key, nameAr: key === 'SUPER_ADMIN' ? 'مدير النظام' : key.replaceAll('_', ' '), nameFr: key.replaceAll('_', ' ') } });
    roles.set(key, role.id);
    await prisma.rolePermission.createMany({ data: keys.map((permissionKey) => ({ roleId: role.id, permissionId: permissions.get(permissionKey)! })), skipDuplicates: true });
  }
  const superAdminId = roles.get('SUPER_ADMIN')!;

  const adminPerson = await prisma.person.upsert({
    where: { id: 'admin-person' }, update: {},
    create: { id: 'admin-person', firstName: 'Admin', lastName: 'USN', fullNameAr: 'مدير نظام الاتحاد' },
  });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@usn.tn' }, update: { status: 'ACTIVE' },
    create: { email: 'admin@usn.tn', passwordHash: await hash('ChangeMe123!', 12), status: 'ACTIVE', locale: 'ar', personId: adminPerson.id },
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: superAdminId } }, update: {}, create: { userId: admin.id, roleId: superAdminId } });

  const staffSeeds: Array<[string, string, string, string, string | null, string[]]> = [
    ['Abderrazak', 'Bouzid', 'عبد الرزاق بوزيد', 'TECHNICAL_DIRECTOR', null, ['COMMITTEE_MEMBER']],
    ['Mohsen', 'Ferjani', 'محسن فرجاني', 'HEAD_COACH', 'SENIORS', []],
    ['Haythem', 'Jaziri', 'هيثم الجزيري', 'ASSISTANT_COACH', 'SENIORS', []],
    ['Mohamed Jihad', 'Doctor', 'الدكتور محمد جهاد', 'PHYSICAL_COACH', null, []],
    ['Jihad', 'Adouli', 'جهاد العدولي', 'GOALKEEPER_COACH', 'SENIORS', ['COACH']],
    ['Tahar', 'Hammami', 'الطاهر الهمامي', 'COACH', 'U21', []],
    ['Mohamed Amine', 'Ben Amor', 'محمد أمين بن عمر', 'COACH', 'U17', []],
    ['Aziz', 'Toumi', 'عزيز التومي', 'COACH', 'U15', []],
    ['Sondos', 'Ben Ibrahim', 'سندس بن إبراهيم', 'PHYSIOTHERAPIST', null, []],
    ['Hatem', 'Zaid', 'حاتم زيد', 'NURSE', null, ['COMMITTEE_MEMBER']],
    ['Ahmed', 'Ben Mohamed', 'أحمد بن محمد', 'TEAM_ACCOMPANIER', 'SENIORS', []],
    ['Ridha', 'Ben Slimane', 'رضا بن سليمان', 'FACILITY_KIT_MANAGER', null, []],
    ['Zahrouni', 'Ben Amor', 'الزهروتي بن عمر', 'EQUIPMENT_MANAGER', null, []],
  ];
  const people = new Map<string, string>();
  for (const [firstName, lastName, fullNameAr, primaryPosition, categoryCode, extraPositions] of staffSeeds) {
    const key = `seed-${primaryPosition.toLowerCase()}-${firstName.toLowerCase().replace(/\s/g, '-')}`;
    const person = await prisma.person.upsert({ where: { id: key }, update: { fullNameAr }, create: { id: key, firstName, lastName, fullNameAr } });
    people.set(fullNameAr, person.id);
    const staff = await prisma.staffProfile.upsert({ where: { personId: person.id }, update: {}, create: { personId: person.id } });
    const assignments = [primaryPosition, ...extraPositions];
    for (let index = 0; index < assignments.length; index += 1) {
      const positionCode = assignments[index]!;
      const assignmentCategoryCode = fullNameAr === 'جهاد العدولي' && positionCode === 'COACH' ? 'ACADEMY' : categoryCode;
      const existing = await prisma.staffAssignment.findFirst({ where: { staffId: staff.id, seasonId: season.id, positionId: positions.get(positionCode)! } });
      if (existing) await prisma.staffAssignment.update({ where: { id: existing.id }, data: { categoryId: assignmentCategoryCode ? categories.get(assignmentCategoryCode) : null } });
      else await prisma.staffAssignment.create({ data: { staffId: staff.id, seasonId: season.id, categoryId: assignmentCategoryCode ? categories.get(assignmentCategoryCode) : null, positionId: positions.get(positionCode)!, startDate: season.startsAt, isPrimary: index === 0 } });
    }
  }

  const committee = await prisma.committee.findFirst({ where: { clubId: club.id, seasonId: season.id, nameFr: 'Comité directeur' } }) ?? await prisma.committee.create({ data: { clubId: club.id, seasonId: season.id, nameAr: 'الهيئة المديرة', nameFr: 'Comité directeur' } });
  for (const fullNameAr of ['عبد الرزاق بوزيد', 'حاتم زيد']) {
    await prisma.committeeMember.upsert({ where: { committeeId_personId_titleAr: { committeeId: committee.id, personId: people.get(fullNameAr)!, titleAr: 'عضو الهيئة المديرة' } }, update: { active: true }, create: { committeeId: committee.id, personId: people.get(fullNameAr)!, titleAr: 'عضو الهيئة المديرة', titleFr: 'Membre du comité directeur' } });
  }

  const facility = await prisma.facility.upsert({ where: { id: 'nadhour-municipal-stadium' }, update: {}, create: { id: 'nadhour-municipal-stadium', nameAr: 'الملعب البلدي بالناظور', nameFr: 'Stade municipal de Nadhour', facilityType: 'STADIUM', available: true } });
  const seniorsId = categories.get('SENIORS')!;
  await prisma.trainingSession.upsert({
    where: { id: 'seed-seniors-training-1' },
    update: { startsAt: new Date('2026-09-29T17:00:00+01:00'), endsAt: new Date('2026-09-29T18:30:00+01:00') },
    create: { id: 'seed-seniors-training-1', seasonId: season.id, categoryId: seniorsId, facilityId: facility.id, startsAt: new Date('2026-09-29T17:00:00+01:00'), endsAt: new Date('2026-09-29T18:30:00+01:00'), type: 'MATCH_PREPARATION', intensity: 7, objective: 'التنظيم التكتيكي والكرات الثابتة' },
  });
  await prisma.match.upsert({
    where: { id: 'seed-seniors-match-1' },
    update: { kickoffAt: new Date('2026-10-03T15:00:00+01:00') },
    create: { id: 'seed-seniors-match-1', seasonId: season.id, categoryId: seniorsId, facilityId: facility.id, competition: 'البطولة', opponent: 'نادي المستقبل', venueSide: 'HOME', stadium: 'الملعب البلدي بالناظور', kickoffAt: new Date('2026-10-03T15:00:00+01:00'), meetingAt: new Date('2026-10-03T13:30:00+01:00'), type: 'LEAGUE' },
  });
  const announcement = await prisma.announcement.upsert({
    where: { id: 'seed-club-announcement-1' },
    update: {},
    create: { id: 'seed-club-announcement-1', titleAr: 'مرحبا بكم في USN Digital Club', titleFr: 'Bienvenue sur USN Digital Club', messageAr: 'هذا الفضاء مخصص لتنظيم نشاط النادي وتسهيل التواصل.', messageFr: "Cet espace organise l'activité du club et facilite la communication.", audience: 'CLUB', priority: 'IMPORTANT', authorId: admin.id },
  });
  await prisma.announcementRecipient.upsert({ where: { announcementId_userId: { announcementId: announcement.id, userId: admin.id } }, update: {}, create: { announcementId: announcement.id, userId: admin.id } });
  await prisma.notification.upsert({ where: { id: 'seed-admin-notification-1' }, update: {}, create: { id: 'seed-admin-notification-1', userId: admin.id, type: 'ANNOUNCEMENT', title: announcement.titleAr, body: announcement.messageAr, data: { entityId: announcement.id } } });
  console.log('Editable development seed completed.');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
