import AuthGuard from '@/components/auth/auth-guard';

export default function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRole="SUPPLIER">{children}</AuthGuard>;
}