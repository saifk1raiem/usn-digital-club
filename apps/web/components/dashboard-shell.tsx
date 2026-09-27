'use client';
import { useQuery } from '@tanstack/react-query';
import { Bell, Boxes, ChevronLeft, ClipboardList, FileText, Home, LogOut, Menu, Shield, Shirt, Stethoscope, Trophy, UserRoundCog, Users, Warehouse, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { PermissionKey, SessionUser } from '@usn/types';
import { api } from '@/lib/api';
import { getMessages, type WebLocale } from '@/i18n';

const items: Array<{ key: keyof ReturnType<typeof getMessages>['nav'] & string; href?: string; icon: typeof Home; permission: PermissionKey }> = [
  { key: 'dashboard', href: '', icon: Home, permission: 'dashboard.view' },
  { key: 'players', href: '/players', icon: Users, permission: 'players.view' },
  { key: 'categories', href: '/categories', icon: Boxes, permission: 'players.view' },
  { key: 'staff', href: '/staff', icon: UserRoundCog, permission: 'staff.view' },
  { key: 'training', icon: ClipboardList, permission: 'training.view' },
  { key: 'matches', icon: Trophy, permission: 'matches.view' },
  { key: 'performance', icon: Shield, permission: 'performance.view' },
  { key: 'medical', icon: Stethoscope, permission: 'medical.viewAvailability' },
  { key: 'equipment', icon: Warehouse, permission: 'equipment.manage' },
  { key: 'kits', icon: Shirt, permission: 'equipment.manage' },
  { key: 'documents', icon: FileText, permission: 'contracts.view' },
];

export function DashboardShell({ locale, children }: PropsWithChildren<{ locale: WebLocale }>) {
  const t = getMessages(locale); const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  const session = useQuery({ queryKey: ['session'], queryFn: () => api<{ data: SessionUser }>('/auth/me'), retry: false });
  useEffect(() => { if (session.isError) router.replace(`/${locale}/login`); }, [session.isError, locale, router]);
  const visible = useMemo(() => items.filter((item) => session.data?.data.permissions.includes(item.permission)), [session.data]);
  const signOut = () => { localStorage.removeItem('usn_access_token'); localStorage.removeItem('usn_refresh_token'); router.replace(`/${locale}/login`); };
  return <div className="app-shell">
    <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Menu"><Menu /></button>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <button className="sidebar-close" onClick={() => setOpen(false)}><X /></button>
      <div className="brand"><img src="https://u-s-n.vercel.app/favicon.png" alt="USN" /><div><strong>USN</strong><span>DIGITAL CLUB</span></div></div>
      <div className="season-pill"><span>{t.common.season}</span><b>2026/2027</b></div>
      <nav>{visible.map(({ key, href, icon: Icon }) => {
        const target = `/${locale}${href ?? '#'}`; const active = href !== undefined && pathname === target;
        return href !== undefined ? <Link key={key} href={target} className={active ? 'active' : ''} onClick={() => setOpen(false)}><Icon size={19} /><span>{t.nav[key]}</span>{active && <ChevronLeft className="nav-arrow" size={15} />}</Link> : <span key={key} className="nav-disabled"><Icon size={19} /><span>{t.nav[key]}</span><small>{locale === 'ar' ? 'قريبا' : 'Bientôt'}</small></span>;
      })}</nav>
      <div className="sidebar-footer"><button onClick={signOut}><LogOut size={18} />{t.common.signOut}</button></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div><span className="eyebrow">{t.common.clubName}</span></div><div className="topbar-actions"><Link className="locale-switch" href={`${locale === 'ar' ? '/fr' : '/ar'}${pathname.replace(/^\/(ar|fr)/, '')}`}>{locale === 'ar' ? 'FR' : 'ع'}</Link><button className="icon-button" aria-label={t.nav.notifications}><Bell size={19} /><span /></button><div className="profile-chip"><div className="avatar">{session.data?.data.displayName?.slice(0, 1) ?? 'U'}</div><div><b>{session.data?.data.displayName ?? 'USN'}</b><small>{session.data?.data.roles[0] ?? ''}</small></div></div></div></header>
      <div className="page-content">{children}</div>
    </main>
  </div>;
}
