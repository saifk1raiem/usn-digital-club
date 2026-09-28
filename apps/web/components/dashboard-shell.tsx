'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Boxes, ChevronLeft, ClipboardList, FileText, Home, LogOut, Megaphone, Menu, ScanSearch, Settings, Shield, Shirt, Stethoscope, Trophy, UserRoundCheck, UserRoundCog, Users, Warehouse, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { PermissionKey, SessionUser } from '@usn/types';
import { api } from '@/lib/api';
import { getMessages, type WebLocale } from '@/i18n';

const items: Array<{ key: string; href?: string; icon: typeof Home; permission: PermissionKey }> = [
  { key: 'dashboard', href: '', icon: Home, permission: 'dashboard.view' },
  { key: 'players', href: '/players', icon: Users, permission: 'players.view' },
  { key: 'categories', href: '/categories', icon: Boxes, permission: 'players.view' },
  { key: 'staff', href: '/staff', icon: UserRoundCog, permission: 'staff.view' },
  { key: 'training', href: '/trainings', icon: ClipboardList, permission: 'training.view' },
  { key: 'matches', href: '/matches', icon: Trophy, permission: 'matches.view' },
  { key: 'announcements', href: '/announcements', icon: Megaphone, permission: 'announcements.view' },
  { key: 'notifications', href: '/notifications', icon: Bell, permission: 'notifications.view' },
  { key: 'performance', href: '/performance', icon: Shield, permission: 'performance.view' },
  { key: 'medical', href: '/medical', icon: Stethoscope, permission: 'medical.viewAvailability' },
  { key: 'trials', href: '/trials', icon: ScanSearch, permission: 'trials.view' },
  { key: 'guardians', href: '/guardians', icon: UserRoundCheck, permission: 'guardians.view' },
  { key: 'equipment', icon: Warehouse, permission: 'equipment.manage' },
  { key: 'kits', icon: Shirt, permission: 'equipment.manage' },
  { key: 'documents', icon: FileText, permission: 'contracts.view' },
  { key: 'settings', href: '/users', icon: Settings, permission: 'users.manage' },
];

export function DashboardShell({ locale, children }: PropsWithChildren<{ locale: WebLocale }>) {
  const t = getMessages(locale); const pathname = usePathname(); const router = useRouter(); const cache = useQueryClient(); const [open, setOpen] = useState(false);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me'), retry: false });
  useEffect(() => { if (session.isError) router.replace(`/${locale}/login`); }, [session.isError, locale, router]);
  const visible = useMemo(() => items.filter((item) => session.data?.data.permissions.includes(item.permission)), [session.data]);
  const signOut = () => { localStorage.removeItem('usn_access_token'); localStorage.removeItem('usn_refresh_token'); cache.clear(); router.replace(`/${locale}/login`); };
  return <div className="app-shell">
    <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Menu"><Menu /></button>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <button className="sidebar-close" onClick={() => setOpen(false)}><X /></button>
      <div className="brand"><img src="https://u-s-n.vercel.app/favicon.png" alt="USN" /><div><strong>USN</strong><span>DIGITAL CLUB</span></div></div>
      <div className="season-pill"><span>{t.common.season}</span><b>2026/2027</b></div>
      <nav>{visible.map(({ key, href, icon: Icon }) => {
        const target = `/${locale}${href ?? '#'}`; const active = href !== undefined && pathname === target;
        const label = key === 'announcements' ? (locale === 'ar' ? 'الإعلانات' : 'Annonces') : t.nav[key as keyof typeof t.nav];
        return href !== undefined ? <Link key={key} href={target} className={active ? 'active' : ''} onClick={() => setOpen(false)}><Icon size={19} /><span>{label}</span>{active && <ChevronLeft className="nav-arrow" size={15} />}</Link> : <span key={key} className="nav-disabled"><Icon size={19} /><span>{label}</span><small>{locale === 'ar' ? 'قريبا' : 'Bientôt'}</small></span>;
      })}</nav>
      <div className="sidebar-footer"><button onClick={signOut}><LogOut size={18} />{t.common.signOut}</button></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div><span className="eyebrow">{t.common.clubName}</span></div><div className="topbar-actions"><Link className="locale-switch" href={`${locale === 'ar' ? '/fr' : '/ar'}${pathname.replace(/^\/(ar|fr)/, '')}`}>{locale === 'ar' ? 'FR' : 'ع'}</Link><Link className="icon-button" href={`/${locale}/notifications`} aria-label={t.nav.notifications}><Bell size={19} /><span /></Link><div className="profile-chip"><div className="avatar">{session.data?.data.displayName?.slice(0, 1) ?? 'U'}</div><div><b>{session.data?.data.displayName ?? 'USN'}</b><small>{session.data?.data.roles[0] ?? ''}</small></div></div></div></header>
      <div className="page-content">{children}</div>
    </main>
  </div>;
}
