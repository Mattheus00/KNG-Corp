import { obterCenarioSessao, SLUG_CLINICA_EXEMPLO } from "@sgc/backend/data"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Icone, type NomeIcone } from "@/components/icone"
import { lerSessaoId } from "@/lib/sessao"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao({ sessaoId, clinicaSlug: slug })
  if (!cenario) return { title: "Clínica não encontrada" }
  const indexavel = slug === SLUG_CLINICA_EXEMPLO
  return {
    title: cenario.clinica.nome,
    description: indexavel
      ? "Clínica fictícia de demonstração do SGC, com agenda, equipe e serviços."
      : `Página da ${cenario.clinica.nome} nesta sessão demonstrativa do SGC.`,
    alternates: indexavel ? { canonical: `/c/${slug}` } : undefined,
    robots: indexavel ? { index: true, follow: true } : { index: false, follow: false },
  }
}

const MODULOS = [
  {
    caminho: "/paciente",
    rotulo: "Paciente",
    titulo: "Agendar avaliação",
    descricao: "Escolher serviço, profissional e horário, e acompanhar as próprias consultas.",
  },
  {
    caminho: "/recepcao",
    rotulo: "Recepção",
    titulo: "Agenda da clínica",
    descricao: "Confirmar presença, registrar chegada, encaixe, falta e cancelamento.",
  },
  {
    caminho: "/dentista",
    rotulo: "Dentista",
    titulo: "Atendimentos do dia",
    descricao: "Ver quem já chegou e iniciar ou concluir o atendimento.",
  },
  {
    caminho: "/gestor",
    rotulo: "Gestor",
    titulo: "Operação",
    descricao: "Indicadores, equipe, serviços, expediente e bloqueios.",
  },
] as const

export default async function PaginaClinica({ params }: Props) {
  const { slug } = await params
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao({ sessaoId, clinicaSlug: slug })
  if (!cenario) notFound()

  const base = `/c/${slug}`
  const clinica = cenario.clinica

  return (
    <div className="space-y-6">
      <header className="clinic-hero">
        <div>
          <p className="eyebrow">{clinica.ficticia ? "Clínica demonstrativa" : "Sua clínica no SGC"}</p>
          <h1>{clinica.nome}</h1>
          <p>{slug === SLUG_CLINICA_EXEMPLO ? "Cuidado começa com uma rotina bem organizada. Conheça a equipe, explore os serviços e acompanhe cada etapa do atendimento nesta clínica fictícia." : "Seu espaço de gestão está pronto. Configure a equipe, os serviços e a agenda desta clínica demonstrativa."}</p>
          <div className="hero-actions"><Link href={`${base}/paciente`} className="button button-primary">Agendar avaliação <Icone nome="seta" width="17" height="17" /></Link><Link href={`${base}/recepcao`} className="button button-secondary">Abrir agenda</Link></div>
        </div>
        <div className="clinic-hero-mark" aria-hidden="true"><Icone nome="brilho" /></div>
      </header>

      <dl className="clinic-details">
        {([
          ["relogio", "Funcionamento", clinica.horarioFuncionamento],
          ["local", "Localização", clinica.endereco],
          ["telefone", "Telefone", clinica.telefone],
          ["email", "E-mail", clinica.email],
        ] as [NomeIcone, string, string][]).map(([icone, rotulo, valor]) => <div key={rotulo}><dt><Icone nome={icone} width="16" height="16" />{rotulo}</dt><dd>{valor || "Ainda não informado"}</dd></div>)}
      </dl>

      <section aria-labelledby="titulo-modulos-app">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Cada perfil, uma experiência</p><h2 id="titulo-modulos-app" className="mt-2 text-xl font-semibold tracking-tight">Como você quer começar?</h2></div><p className="text-xs text-muted">Alterne o perfil no topo para explorar as áreas.</p></div>
        <div className="module-grid">
          {MODULOS.map((modulo, indice) => <Link key={modulo.caminho} href={`${base}${modulo.caminho}`} className="module-card"><Icone nome={(["conta", "agenda", "cuidado", "grafico"] as const)[indice]!} width="25" height="25" /><small>{modulo.rotulo}</small><h3>{modulo.titulo}</h3><p>{modulo.descricao}</p><span className="module-link">Explorar área <Icone nome="seta" width="17" height="17" /></span></Link>)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section aria-labelledby="titulo-servicos-publicos" className="rounded-xl border border-line bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id="titulo-servicos-publicos" className="text-sm font-semibold text-ink">
              Serviços
            </h2>
            <span className="text-xs text-muted">Valor definido na avaliação</span>
          </div>
          {cenario.servicos.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {cenario.servicos.map((servico) => (
                <li key={servico.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{servico.nome}</h3>
                      {servico.disponivelParaAutoagendamento && (
                        <span className="rounded-xl bg-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
                          Agendamento pelo paciente
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{servico.descricao}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                    {servico.duracaoMinutos} min
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-equipe-publica" className="rounded-xl border border-line bg-white lg:col-span-5">
          <h2 id="titulo-equipe-publica" className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
            Equipe
          </h2>
          {cenario.profissionais.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">Nenhum profissional cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {cenario.profissionais.map((prof) => (
                <li key={prof.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">{prof.nome}</h3>
                    <span
                      className={`rounded-xl px-2 py-0.5 text-[11px] font-semibold ${
                        prof.ativo ? "bg-[#E5F5EC] text-[#00522B]" : "bg-canvas text-muted"
                      }`}
                    >
                      {prof.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="text-sm text-ink">{prof.especialidade}</p>
                  <p className="mt-1 text-xs text-muted tabular-nums">
                    {String(prof.aberturaHora).padStart(2, "0")}:00 – {String(prof.fechamentoHora).padStart(2, "0")}:00
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
