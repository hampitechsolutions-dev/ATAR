import AuthGuard from '@/components/auth/auth-guard';

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRole="BUYER">{children}</AuthGuard>;
}