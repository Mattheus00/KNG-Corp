import { DADOS_CLINICA_FICTICIA, obterCenarioSessao } from "@sgc/backend/data"
import type { Metadata } from "next"
import Link from "next/link"
import { lerSessaoId } from "@/lib/sessao"

export const metadata: Metadata = {
  title: "Clínica Odontológica Aurora — SGC WebApp",
  description:
    "WebApp demonstrativo de agendamento odontológico, recepção operacional, atendimento clínico e gestão por indicadores (SGC).",
  alternates: {
    canonical: "/",
  },
}

export default async function PaginaInicial() {
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao(sessaoId)

  const jsonLdDemonstracao = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SGC — Clínica Odontológica Aurora",
    applicationCategory: "HealthApplication",
    operatingSystem: "All",
    inLanguage: "pt-BR",
    description:
      "WebApp demonstrativo para agendamento odontológico, recepção, rotina de dentistas e indicadores gerenciais.",
    isAccessibleForFree: true,
  }

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdDemonstracao) }}
      />

      {/* Compact, App-Style Hero Banner */}
      <section
        aria-labelledby="titulo-principal-clinica"
        className="overflow-hidden rounded-2xl bg-[#002664] p-6 text-white sm:p-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-[#CBEDFD]">
              Seg a Sáb • 08h às 18h • Agendamento Gratuito
            </span>
            <h1
              id="titulo-principal-clinica"
              className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              {DADOS_CLINICA_FICTICIA.nome}
            </h1>
            <p className="text-sm text-[#E6F2FD] sm:text-base">
              Agende sua avaliação, acompanhe o atendimento na recepção ou gerencie a clínica em um
              único aplicativo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/paciente"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#146CFD] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#002664]"
            >
              Agendar Consulta →
            </Link>
            <Link
              href="/acesso"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Trocar Perfil
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Direct App Modules */}
      <section aria-labelledby="titulo-modulos-app" className="space-y-3">
        <h2 id="titulo-modulos-app" className="text-base font-extrabold text-[#002664]">
          Áreas do Aplicativo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/paciente"
            className="group flex flex-col justify-between rounded-2xl border border-[#DDE2E8] bg-white p-5 transition-all hover:border-[#146CFD] hover:shadow-sm"
          >
            <div>
              <span className="inline-flex rounded-lg bg-[#E6F2FD] px-2.5 py-1 text-xs font-bold text-[#002664]">
                Paciente
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-[#002664] group-hover:text-[#146CFD]">
                Agendar e Consultas
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#495054]">
                Reserve horários livres em 3 passos, remarque ou cancele agendamentos.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-bold text-[#146CFD]">
              Abrir área →
            </span>
          </Link>

          <Link
            href="/recepcao"
            className="group flex flex-col justify-between rounded-2xl border border-[#DDE2E8] bg-white p-5 transition-all hover:border-[#146CFD] hover:shadow-sm"
          >
            <div>
              <span className="inline-flex rounded-lg bg-[#F2F4F7] px-2.5 py-1 text-xs font-bold text-[#22272B]">
                Recepção
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-[#002664] group-hover:text-[#146CFD]">
                Fila e Balcão
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#495054]">
                Confirme presença, registre chegada na clínica e faça encaixes manuais.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-bold text-[#146CFD]">
              Abrir área →
            </span>
          </Link>

          <Link
            href="/dentista"
            className="group flex flex-col justify-between rounded-2xl border border-[#DDE2E8] bg-white p-5 transition-all hover:border-[#004047] hover:shadow-sm"
          >
            <div>
              <span className="inline-flex rounded-lg bg-[#E3F3F4] px-2.5 py-1 text-xs font-bold text-[#004047]">
                Dentista
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-[#002664] group-hover:text-[#004047]">
                Consultório
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#495054]">
                Veja quem já chegou na recepção e inicie ou conclua o atendimento com 1 clique.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-bold text-[#004047]">
              Abrir área →
            </span>
          </Link>

          <Link
            href="/gestor"
            className="group flex flex-col justify-between rounded-2xl border border-[#DDE2E8] bg-white p-5 transition-all hover:border-[#D7153A] hover:shadow-sm"
          >
            <div>
              <span className="inline-flex rounded-lg bg-[#FBE9ED] px-2.5 py-1 text-xs font-bold text-[#8A0D29]">
                Gestor
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-[#002664] group-hover:text-[#D7153A]">
                Dashboard e Equipe
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#495054]">
                Acompanhe ocupação, faltas, convites de funcionários, serviços e bloqueios.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-bold text-[#D7153A]">
              Abrir área →
            </span>
          </Link>
        </div>
      </section>

      {/* Clean 2-Column Overview: Services & Specialists */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="titulo-servicos-publicos"
          className="rounded-2xl border border-[#DDE2E8] bg-white p-6 lg:col-span-7"
        >
          <div className="flex items-center justify-between">
            <h2 id="titulo-servicos-publicos" className="text-base font-extrabold text-[#002664]">
              Procedimentos e Duração
            </h2>
            <span className="text-xs font-medium text-[#495054]">Sem cobrança online</span>
          </div>

          <div className="mt-4 divide-y divide-[#EBEBEB]">
            {cenario.servicos.map((servico) => (
              <div
                key={servico.id}
                className="flex flex-col justify-between gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#22272B]">{servico.nome}</h3>
                    {servico.disponivelParaAutoagendamento && (
                      <span className="rounded-full bg-[#E6F2FD] px-2 py-0.5 text-[11px] font-semibold text-[#002664]">
                        Online
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#495054]">{servico.descricao}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-[#F2F4F7] px-2.5 py-1 text-xs font-bold text-[#002664] tabular-nums">
                  {servico.duracaoMinutos} min
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="titulo-equipe-publica"
          className="rounded-2xl border border-[#DDE2E8] bg-white p-6 lg:col-span-5"
        >
          <h2 id="titulo-equipe-publica" className="text-base font-extrabold text-[#002664]">
            Corpo Clínico
          </h2>

          <div className="mt-4 divide-y divide-[#EBEBEB]">
            {cenario.profissionais.map((prof) => (
              <div key={prof.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#22272B]">{prof.nome}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      prof.ativo
                        ? "bg-[#E5F5EC] text-[#00522B]"
                        : "bg-[#F2F4F7] text-[#495054]"
                    }`}
                  >
                    {prof.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#004047]">{prof.especialidade}</p>
                <p className="mt-1 text-[11px] text-[#495054] tabular-nums">
                  Expediente: {String(prof.aberturaHora).padStart(2, "0")}:00 às{" "}
                  {String(prof.fechamentoHora).padStart(2, "0")}:00
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
