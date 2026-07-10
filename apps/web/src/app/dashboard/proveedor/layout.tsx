import AuthGuard from '@/components/auth/auth-guard';
import AssistantFab from '@/components/dashboard/assistant-fab';

export default function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRole="SUPPLIER">
      {children}
      <AssistantFab />
    </AuthGuard>
  );
}