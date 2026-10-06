'use client';

import { useAuth } from '@/components/auth/auth-provider';
import AdminCompanyRanking from '@/components/dashboard/admin-company-ranking';
import AdminShell from '@/components/dashboard/admin-shell';
import { atarApi } from '@/lib/atar-api';

export default function AdminBuyersPage() {
  const { session } = useAuth();
  const token = session?.accessToken;

  return (
    <AdminShell>
      <AdminCompanyRanking
        token={token}
        title="Compradores"
        description="Empresas compradoras ordenadas por volumen de compra. Entrá a cada una para ver sus operaciones: con qué proveedor, qué productos y cuánto."
        counterpartyLabel="Proveedor"
        rankBy="sales"
        loadList={(t) => atarApi.getAdminBuyers(t)}
        loadDetail={(id, t) => atarApi.getAdminBuyerDetail(id, t)}
      />
    </AdminShell>
  );
}
