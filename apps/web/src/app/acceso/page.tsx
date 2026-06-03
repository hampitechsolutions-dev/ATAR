import AccessPanel from '@/components/auth/access-panel';
import Image from 'next/image';

export default function AccesoPage() {
  return (
    <main className="h-screen overflow-hidden bg-white text-slate-950">
      <div className="grid h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:flex">
          <Image alt="" className="object-cover" fill priority sizes="50vw" src="/login.png" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.65)_55%,rgba(2,6,23,0.12)_100%)]" />

          <div className="relative flex w-full flex-col justify-center px-14 py-12">
            <div className="flex items-center gap-3">
              <Image alt="ATAR" height={40} src="/logoatar.png" width={40} />
              <div className="leading-none">
                <p className="text-2xl font-semibold text-white">ATAR</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Marketplace industrial
                </p>
              </div>
            </div>

            <div className="mt-14 max-w-xl space-y-5">
              <h1 className="text-5xl font-semibold leading-[1.06] tracking-tight text-white">
                La red comercial
                <br />
                de la <span className="text-indigo-500">industria.</span>
              </h1>
              <p className="max-w-lg text-base leading-8 text-slate-300">
                Comprá, cotizá y gestioná proveedores verificados desde un único lugar.
              </p>
            </div>



          </div>
        </section>

        <section className="flex h-full items-center justify-center bg-slate-50 px-6 py-6 lg:px-12">
          <AccessPanel />
        </section>
      </div>
    </main>
  );
}
