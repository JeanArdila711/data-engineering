'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Radio,
  Package,
  ScrollText,
  Activity,
  Compass,
  BookOpen
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', title: 'Inicio', href: '/', icon: Home },
  { id: 'radar', title: 'Radar Releases', href: '/#radar', icon: Radio },
  { id: 'ecosystem', title: 'Ecosistema', href: '/#ecosystem', icon: Package },
  { id: 'articulos', title: 'Deep-Dives', href: '/#articulos', icon: ScrollText },
  { id: 'digest', title: 'Digest Semanal', href: '/#digest', icon: Activity },
  { id: 'rumbo', title: 'Rumbo (Grafo)', href: '/ruta', icon: Compass },
  { id: 'glosario', title: 'Glosario DE', href: '/glosario', icon: BookOpen },
  {
    id: 'github',
    title: 'GitHub Repo',
    href: 'https://github.com/JeanArdila711/data-engineering',
    icon: GithubIcon,
    isExternal: true
  },
];

export default function Navbar() {
  return (
    <div className='fixed bottom-2 left-1/2 max-w-full -translate-x-1/2 z-50'>
      <Dock className='items-end pb-3'>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : undefined}
            >
              <DockItem className='aspect-square rounded-full bg-gray-200 dark:bg-neutral-800'>
                <DockLabel>{item.title}</DockLabel>
                <DockIcon>
                  <Icon className='h-full w-full text-neutral-600 dark:text-neutral-300' />
                </DockIcon>
              </DockItem>
            </Link>
          );
        })}
      </Dock>
    </div>
  );
}
