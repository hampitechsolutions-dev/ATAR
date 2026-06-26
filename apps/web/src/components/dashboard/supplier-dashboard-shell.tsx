'use client';

import { type ReactNode, useState } from 'react';
import { type WebSession } from '@/lib/session';
import SupplierAccountMenu from './supplier-account-menu';
import DashboardSidebar from './dashboard-sidebar';

type SupplierDashboardShellProps = {
  children: ReactNode;
  session: WebSession | null;
  searchPlaceholder?: string;
};

function HeaderActionIcon({ kind }: { kind: 'chat' | 'bell' }) {
  if (kind === 'chat') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function SupplierDashboardShell({
  children,
  session,
  searchPlaceholder = 'Buscar solicitudes, clientes, productos...',
}: SupplierDashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <div className="flex h-full">
        <div className="hidden h-full w-[264px] shrink-0 lg:block">
          <DashboardSidebar className="sticky top-0 h-screen" role="supplier" session={session} />
        </div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/50"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[264px]">
              <DashboardSidebar
                className="h-full"
                onNavigate={() => setIsSidebarOpen(false)}
                role="supplier"
                session={session}
              />
            </div>
          </div>
        ) : null}

        <section className="min-w-0 flex-1 overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M4 6h16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 12h16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 18h16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>

                <div className="hidden min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm md:flex md:max-w-[460px] xl:max-w-[520px]">
                  <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M11 19a8 8 0 100-16 8 8 0 000 16z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder={searchPlaceholder}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="hidden h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 sm:inline-flex"
                  type="button"
                >
                  Invitar a un miembro
                </button>
                <button
                  className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
                  type="button"
                >
                  <HeaderActionIcon kind="chat" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                    2
                  </span>
                </button>
                <button
                  className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
                  type="button"
                >
                  <HeaderActionIcon kind="bell" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                    3
                  </span>
                </button>
                <SupplierAccountMenu session={session} />
              </div>
            </div>
          </header>

          <div className="h-[calc(100dvh-73px)] overflow-y-auto px-4 py-4 lg:px-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
