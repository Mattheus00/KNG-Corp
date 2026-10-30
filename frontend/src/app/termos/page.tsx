import { DADOS_CLINICA_FICTICIA } from "@sgc/backend/data"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Termos de Serviço e Regras de Agendamento",
  description:
    "Termos de Serviço da demonstração do Sistema de Gestão de Clínicas (SGC): condição demonstrativa, regras de confirmação, remarcação, cancelamento e ausência de cobranças.",
  alternates: {
    canonical: "/termos",
  },
}

export default function PaginaTermos() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
      <header className="border-b border-[#F1F5F9] pb-5">
        <span className="inline-block rounded-full bg-[#E6F2FD] px-3 py-0.5 text-xs font-bold text-[#002664]">
          Regras de Uso
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#002664]">
          Termos de Serviço — {DADOS_CLINICA_FICTICIA.nome}
        </h1>
        <p className="mt-1 font-mono text-xs text-[#495054]">
          Versão {DADOS_CLINICA_FICTICIA.versaoTermos} • Atualizado em{" "}
          {DADOS_CLINICA_FICTICIA.ultimaAtualizacaoPoliticas}
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed text-[#22272B]">
        <h2 className="text-base font-extrabold text-[#002664]">
          1. Finalidade demonstrativa
        </h2>
        <p>
          Este WebApp integra o estudo de caso do{" "}
          <strong>Sistema de Gestão de Clínicas (SGC)</strong>. A{" "}
          <strong>{DADOS_CLINICA_FICTICIA.nome}</strong> é uma clínica fictícia e não realiza
          atendimento odontológico real nem cobranças financeiras.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-[#22272B]">
        <h2 className="text-base font-extrabold text-[#002664]">
          2. Perfis de acesso e limites
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Cadastro público:</strong> cria exclusivamente contas com o papel de{" "}
            <strong>Paciente</strong>.
          </li>
          <li>
            <strong>Proteção de agenda:</strong> cada paciente pode manter até 3 consultas futuras
            ativas simultâneas no autoagendamento, com antecedência máxima de 180 dias.
          </li>
          <li>
            <strong>Revogação imediata:</strong> funcionários desativados pelo Gestor perdem
            imediatamente a autorização de sessão no servidor.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-[#22272B]">
        <h2 className="text-base font-extrabold text-[#002664]">
          3. Ciclo de atendimento
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Fluxo clínico:</strong> <code>Agendado → Chegou → Em atendimento → Concluído</code>.
          </li>
          <li>
            <strong>Remarcação atômica:</strong> se o novo horário não puder ser reservado, o
            agendamento original é mantido integralmente e a confirmação de presença é reiniciada.
          </li>
          <li>
            <strong>Cancelamento:</strong> exige motivo, libera imediatamente a vaga na agenda e
            mantém o histórico.
          </li>
        </ul>
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
