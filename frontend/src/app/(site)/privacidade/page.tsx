import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade da demonstração do SGC: dados da sessão, cadastro de clínica em memória e cookies técnicos.",
  alternates: { canonical: "/privacidade" },
}

export default function PaginaPrivacidade() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Política de Privacidade</h1>
        <p className="mt-1 text-xs text-muted">Atualizado em 30 de outubro de 2026 · versão 1.0-demo</p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">1. O que é esta demonstração</h2>
        <p>
          O SGC é um sistema demonstrativo de gestão para clínicas odontológicas. A clínica Aurora é
          um exemplo fictício. Clínicas criadas pelo visitante também são fictícias e existem só na
          sessão atual.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">2. Dados do cadastro da clínica</h2>
        <p>
          Nome da clínica, endereço na URL, nome e e-mail do responsável ficam apenas na memória do
          servidor durante a sessão demonstrativa. Não são gravados em banco, não são enviados a
          terceiros e são descartados quando a sessão termina ou quando os dados da demonstração são
          restaurados.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">3. O que mais é coletado</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Nome, e-mail e telefone de pacientes fictícios, só para identificar o agendamento nesta sessão.</li>
          <li>Não coletamos CPF, RG, endereço residencial, data de nascimento, anamnese ou prontuário.</li>
          <li>Não há cobrança nem pagamento.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">4. Cookies</h2>
        <p>
          Usamos os cookies técnicos <code>sgc_sessao_id</code> e <code>sgc_clinica_slug</code>{" "}
          (HttpOnly, SameSite=Lax) para isolar a sessão e saber qual clínica está aberta. Não há
          rastreador nem SDK de publicidade nesta versão.
        </p>
      </section>

      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink">
        Voltar ao início
      </Link>
    </article>
  )
}
