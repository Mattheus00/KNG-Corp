import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Termos de Serviço",
  description:
    "Termos da demonstração do SGC: clínicas fictícias, regras de agenda e ausência de cobrança.",
  alternates: { canonical: "/termos" },
}

export default function PaginaTermos() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Termos de Serviço</h1>
        <p className="mt-1 text-xs text-muted">Atualizado em 30 de outubro de 2026 · versão 1.0-demo</p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">1. Demonstração</h2>
        <p>
          O SGC não oferece atendimento odontológico real. A clínica de exemplo e as clínicas criadas
          pelo visitante são fictícias. O agendamento não substitui avaliação profissional. Não há
          cobrança, cartão nem assinatura nesta fase.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">2. Contas e clínicas</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Criar uma clínica torna o responsável gestor daquela clínica, só nesta sessão.</li>
          <li>Cada sessão aceita no máximo 3 clínicas, limite técnico da memória da demonstração.</li>
          <li>O cadastro público de paciente cria apenas o papel de paciente, dentro da clínica aberta.</li>
          <li>Papéis de funcionário dependem de convite do gestor.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">3. Agenda</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Fluxo: agendado, chegou, em atendimento, concluído. Cancelado e falta são desfechos alternativos.</li>
          <li>Remarcar só vale se o novo horário puder ser reservado; senão a consulta original permanece.</li>
          <li>Remarcar reinicia a confirmação de presença. Cancelar exige motivo.</li>
          <li>Cada paciente pode manter até 3 consultas futuras ativas no autoagendamento.</li>
        </ul>
      </section>

      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink">
        Voltar ao início
      </Link>
    </article>
  )
}
