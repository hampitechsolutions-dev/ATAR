'use client';

import { useAuth } from '@/components/auth/auth-provider';
import AdminCompanyRanking from '@/components/dashboard/admin-company-ranking';
import AdminShell from '@/components/dashboard/admin-shell';
import { atarApi } from '@/lib/atar-api';

export default function AdminSuppliersPage() {
  const { session } = useAuth();
  const token = session?.accessToken;

  return (
    <AdminShell>
      <AdminCompanyRanking
        token={token}
        title="Proveedores"
        description="Empresas proveedoras ordenadas por la comisión que generaron para ATAR. Entrá a cada una para ver sus transacciones: con qué comprador, qué productos y cuánto."
        counterpartyLabel="Comprador"
        rankBy="commission"
        loadList={(t) => atarApi.getAdminSuppliers(t)}
        loadDetail={(id, t) => atarApi.getAdminSupplierDetail(id, t)}
      />
    </AdminShell>
  );
}
