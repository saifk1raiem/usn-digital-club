export const messages = {
  ar: { home: 'الرئيسية', calendar: 'البرنامج', team: 'الفريق', notifications: 'الإشعارات', profile: 'حسابي', greeting: 'مرحبا بك', nextTraining: 'الحصة القادمة', nextMatch: 'المباراة القادمة', attendance: 'ملخص الحضور', signIn: 'تسجيل الدخول', email: 'البريد الإلكتروني', password: 'كلمة المرور', private: 'فضاء النادي الخاص', noData: 'لا توجد بيانات حاليا' },
  fr: { home: 'Accueil', calendar: 'Calendrier', team: 'Équipe', notifications: 'Notifications', profile: 'Profil', greeting: 'Bienvenue', nextTraining: 'Prochain entraînement', nextMatch: 'Prochain match', attendance: 'Présence', signIn: 'Se connecter', email: 'E-mail', password: 'Mot de passe', private: 'Espace privé du club', noData: 'Aucune donnée' },
} as const;
export type MobileLocale = keyof typeof messages;
