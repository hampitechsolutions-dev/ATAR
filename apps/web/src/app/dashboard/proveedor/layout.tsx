import AuthGuard from '@/components/auth/auth-guard';
import AssistantFab from '@/components/dashboard/assistant-fab';
import SupplierTheme from '@/components/dashboard/supplier-theme';
import TourProvider from '@/components/tour/tour-provider';

export default function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRole="SUPPLIER">
      {/* Verde para el vendedor, violeta para la empresa (ver SupplierTheme). */}
      <SupplierTheme>
        <TourProvider>
          {children}
          <AssistantFab />
        </TourProvider>
      </SupplierTheme>
    </AuthGuard>
  );
}