import AdminGuard from '@/components/auth/admin-guard';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
