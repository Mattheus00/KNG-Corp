import { DADOS_CLINICA_FICTICIA } from "@sgc/backend/data"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade e Revisão de SDKs",
  description:
    "Política de Privacidade do ambiente demonstrativo do Sistema de Gestão de Clínicas (SGC): dados coletados, finalidades, cookies técnicos, fornecedores e minimização de dados.",
  alternates: {
    canonical: "/privacidade",
  },
}

export default function PaginaPrivacidade() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
      <header className="border-b border-[#F1F5F9] pb-5">
        <span className="inline-block rounded-full bg-[#E6F2FD] px-3 py-0.5 text-xs font-bold text-[#002664]">
          Privacidade e LGPD
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#002664]">
          Política de Privacidade — {DADOS_CLINICA_FICTICIA.nome}
        </h1>
        <p className="mt-1 font-mono text-xs text-[#495054]">
          Atualizado em {DADOS_CLINICA_FICTICIA.ultimaAtualizacaoPoliticas} • Versão{" "}
          {DADOS_CLINICA_FICTICIA.versaoTermos}
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-[#22272B]">
        <h2 className="text-base font-extrabold text-[#002664]">
          1. Natureza demonstrativa
        </h2>
        <p>
          Esta aplicação é uma demonstração técnica do{" "}
          <strong>Sistema de Gestão de Clínicas (SGC)</strong>. Os pacientes, profissionais e
          agendamentos pré-carregados são estritamente fictícios. Recomendamos utilizar apenas dados
          fictícios durante a exploração.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-[#22272B]">
        <h2 className="text-base font-extrabold text-[#002664]">
          2. Minimização de dados (LGPD)
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Nome, e-mail e telefone:</strong> utilizados unicamente para identificar o
            agendamento na sessão demonstrativa e simular a confirmação de presença.
          </li>
          <li>
            <strong>Ocultação de identificadores internos:</strong> na listagem visível ao paciente,
            UUIDs internos de funcionários são anonimizados para <code>equipe-clinica</code>.
          </li>
          <li>
            <strong>Não coletamos:</strong> CPF, RG, endereço residencial, data de nascimento,
            anamnese, odontograma ou prontuário clínico.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-[#22272B]">
        <h2 className="text-base font-extrabold text-[#002664]">
          3. Cookies e segurança
        </h2>
        <p>
          Utilizamos apenas o cookie técnico <code>sgc_sessao_id</code> (<code>HttpOnly</code>,{" "}
          <code>SameSite=Lax</code>, UUID v4, até 12h) para isolar o cenário demonstrativo de cada
          visitante, sem rastreadores ou SDKs de publicidade.
        </p>
      </section>

      <footer className="border-t border-[#F1F5F9] pt-5">
        <Link
          href="/"
          className="inline-flex items-center rounded-xl bg-[#002664] px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-[#146CFD]"
        >
          ← Voltar ao início
        </Link>
      </footer>
    </article>
  )
}
