
export default function ContactoPage() {
  const contactOptions = [
    {
      title: 'Chat en vivo',
      description: 'Hablá con nuestro equipo en tiempo real y resolvé tus consultas al instante.',
      action: 'Iniciar chat',
    },
    {
      title: 'Email',
      description: 'Enviános tu consulta y te responderemos a la brevedad.',
      action: 'hola@atar.com.ar',
    },
    {
      title: 'Teléfono',
      description: 'Llamanos de lunes a viernes de 9 a 18 hs.',
      action: '+54 11 1234 5678',
    },
    {
      title: 'Agenda una reunión',
      description: 'Coordina una reunión con un especialista y conocé más sobre ATAR.',
      action: 'Agendar reunión',
    },
  ];

  const team = [
    { name: 'Martín Rodríguez', role: 'Operaciones', action: 'Agendar reunión' },
    { name: 'Julieta Martínez', role: 'Consultora comercial', action: 'Agendar reunión' },
    { name: 'Facundo López', role: 'Especialista en proveedores', action: 'Agendar reunión' },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:items-center">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Estamos para ayudarte
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Hablemos de cómo ATAR puede <span className="text-indigo-600">impulsar tu industria</span>.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Nuestro equipo está listo para asesorarte, resolver tus dudas y ayudarte a
              encontrar la mejor solución para tu negocio.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                href="#consulta"
              >
                Enviar mensaje <span aria-hidden="true">→</span>
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="tel:+541112345678"
              >
                Llamar ahora
              </a>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="flex -space-x-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-9 rounded-full border-2 border-white bg-[linear-gradient(135deg,#cbd5e1_0%,#f8fafc_60%,#ffffff_100%)]"
                  />
                ))}
              </div>
              <p>Respuestas en menos de 24 hs</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <h2 className="text-center text-xl font-semibold text-slate-950">
            Elegí cómo querés contactarnos
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {contactOptions.map((option) => (
              <article
                key={option.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  ⬤
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{option.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{option.description}</p>
                <p className="mt-4 text-sm font-semibold text-indigo-600">{option.action}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="consulta" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Enviános tu consulta</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Completá el formulario y te contactaremos lo antes posible.
              </p>

              <form className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm">
                    <span className="text-slate-700">Nombre y apellido</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400"
                      placeholder="Ej. Juan Pérez"
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="text-slate-700">Email corporativo</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400"
                      placeholder="Ej. juan@empresa.com"
                      type="email"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm">
                    <span className="text-slate-700">Empresa</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400"
                      placeholder="Ej. Empresa S.A."
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="text-slate-700">Teléfono</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400"
                      placeholder="Ej. +54 11 1234 5678"
                    />
                  </label>
                </div>

                <label className="block space-y-2 text-sm">
                  <span className="text-slate-700">Motivo de consulta</span>
                  <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400">
                    <option value="">Seleccioná una opción</option>
                    <option value="comprador">Quiero comprar</option>
                    <option value="proveedor">Quiero ser proveedor</option>
                    <option value="soporte">Soporte</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="text-slate-700">Contanos cómo podemos ayudarte</span>
                  <textarea
                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400"
                    placeholder="Escribí tu mensaje aquí..."
                  />
                </label>

                <button
                  className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                  type="button"
                >
                  Enviar mensaje
                </button>

                <p className="text-xs text-slate-500">
                  Tu información está protegida. No compartimos tus datos.
                </p>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0b1220_0%,#0a1630_55%,#121a2e_100%)] p-6 text-white shadow-2xl shadow-slate-200/60">
                <h3 className="text-lg font-semibold">Oficinas centrales</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <p>Av. Corrientes 1234, Piso 8</p>
                  <p>C1043AAB, Buenos Aires, Argentina</p>
                  <p>Lunes a viernes de 9 a 18 hs.</p>
                  <p>+54 11 1234 5678</p>
                  <p>hola@atar.com.ar</p>
                </div>
                <div className="mt-6 h-40 rounded-[1.5rem] bg-white/10" />
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-200/60">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),_transparent_60%)]" />
                <div className="relative space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
                    Conectamos industrias
                  </p>
                  <p className="text-lg font-semibold">Con oportunidades reales.</p>
                  <p className="text-sm leading-7 text-slate-300">
                    ATAR es la plataforma líder en abastecimiento de bolsas industriales en
                    Latinoamérica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Hablá con un especialista
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Un equipo que entiende tu industria
              </h2>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Nuestros especialistas están listos para ayudarte a encontrar la mejor solución
                para tu empresa.
              </p>
              <a className="inline-flex text-sm font-semibold text-indigo-600" href="/#recursos">
                Conocé más sobre nuestro equipo →
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {team.map((member) => (
                <article
                  key={member.name}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="h-40 rounded-[1.25rem] bg-[linear-gradient(135deg,#cbd5e1_0%,#f8fafc_60%,#ffffff_100%)]" />
                  <p className="mt-4 text-sm font-semibold text-slate-950">{member.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{member.role}</p>
                  <a className="mt-4 inline-flex text-sm font-semibold text-indigo-600" href="/acceso">
                    {member.action} →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
