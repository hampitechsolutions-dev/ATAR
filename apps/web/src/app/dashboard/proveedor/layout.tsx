import AuthGuard from '@/components/auth/auth-guard';
import AssistantFab from '@/components/dashboard/assistant-fab';

export default function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRole="SUPPLIER">
      {/* Identidad violeta del vendedor (ver `.theme-supplier` en globals.css).
          `contents` no agrega caja: solo aporta las variables de color. */}
      <div className="theme-supplier contents">
        {children}
        <AssistantFab />
      </div>
    </AuthGuard>
  );
}