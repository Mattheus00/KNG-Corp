"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  acaoAlternarPerfilDemo,
  acaoCadastrarPacientePublico,
  acaoLoginEmailDemo,
} from "@/app/acoes"
import type { ContaDemoResumo } from "@/components/barra-demonstracao"
import { ROTULO_PAPEL } from "@/lib/formatadores"

export function PainelAcesso({
  contasDemo,
  atorAtualId,
  versaoTermos,
}: {
  contasDemo: readonly ContaDemoResumo[]
  atorAtualId: string
  versaoTermos: string
}) {
  const router = useRouter()
  const [abaAtiva, setAbaAtiva] = useState<"demo" | "login" | "cadastro" | "recuperacao">("demo")
  const [isPending, startTransition] = useTransition()
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const [emailLogin, setEmailLogin] = useState("mariana.costa@demo.exemplo.invalid")
  const [senhaLogin, setSenhaLogin] = useState("demo1234")

  const [nomeCadastro, setNomeCadastro] = useState("")
  const [emailCadastro, setEmailCadastro] = useState("")
  const [telefoneCadastro, setTelefoneCadastro] = useState("")
  const [aceitouTermos, setAceitouTermos] = useState(false)

  const [emailRecuperacao, setEmailRecuperacao] = useState("")

  function entrarComContaDemo(contaId: string) {
    setMensagemErro(null)
    setMensagemSucesso(null)
    startTransition(async () => {
      const res = await acaoAlternarPerfilDemo(contaId)
      if (!res.ok) {
        setMensagemErro(res.mensagem)
        return
      }
      setMensagemSucesso(res.mensagem)
      if (res.dados?.rotaInicial) {
        router.push(res.dados.rotaInicial)
      }
    })
  }

  function submeterLogin(e: React.FormEvent) {
    e.preventDefault()
    setMensagemErro(null)
    setMensagemSucesso(null)
    startTransition(async () => {
      const res = await acaoLoginEmailDemo(emailLogin)
      if (!res.ok) {
        setMensagemErro(res.mensagem)
        return
      }
      setMensagemSucesso(res.mensagem)
      if (res.dados?.rotaInicial) {
        router.push(res.dados.rotaInicial)
      }
    })
  }

  function submeterCadastro(e: React.FormEvent) {
    e.preventDefault()
    setMensagemErro(null)
    setMensagemSucesso(null)
    startTransition(async () => {
      const res = await acaoCadastrarPacientePublico({
        nome: nomeCadastro,
        email: emailCadastro,
        telefone: telefoneCadastro,
        aceitouTermos,
      })
      if (!res.ok) {
        setMensagemErro(res.mensagem)
        return
      }
      setMensagemSucesso(res.mensagem)
      if (res.dados?.rotaInicial) {
        router.push(res.dados.rotaInicial)
      }
    })
  }

  function submeterRecuperacao(e: React.FormEvent) {
    e.preventDefault()
    setMensagemErro(null)
    setMensagemSucesso(null)
    if (!emailRecuperacao.trim().includes("@")) {
      setMensagemErro("Informe um endereço de e-mail válido para simular a recuperação.")
      return
    }
    setMensagemSucesso(
      "Simulação de recuperação concluída: em produção o link é enviado via Supabase Auth; neste ambiente demonstrativo nenhum e-mail real é disparado.",
    )
  }

  return (
    <div className="space-y-6">
      <div className="module-heading">
        <div>
          <p className="eyebrow">Conecte-se à clínica</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Acesso e Perfis
          </h1>
          <p className="text-sm text-muted">
            Alterne entre contas de demonstração ou crie uma conta de paciente
          </p>
        </div>

        <div
          role="group"
          aria-label="Formas de acesso ao sistema"
          className="module-tabs"
        >
          <button
            type="button"

            aria-pressed={abaAtiva === "demo"}
            onClick={() => {
              setAbaAtiva("demo")
              setMensagemErro(null)
              setMensagemSucesso(null)
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "demo"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Contas Demo
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "cadastro"}
            onClick={() => {
              setAbaAtiva("cadastro")
              setMensagemErro(null)
              setMensagemSucesso(null)
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "cadastro"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Criar Conta
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "login"}
            onClick={() => {
              setAbaAtiva("login")
              setMensagemErro(null)
              setMensagemSucesso(null)
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "login"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Entrar
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "recuperacao"}
            onClick={() => {
              setAbaAtiva("recuperacao")
              setMensagemErro(null)
              setMensagemSucesso(null)
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "recuperacao"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Recuperar
          </button>
        </div>
      </div>

      {mensagemErro && (
        <div
          role="alert"
          className="rounded-xl border border-[#F5B7C4] bg-[#FBE9ED] px-4 py-3 text-sm font-semibold text-[#8A0D29]"
        >
          {mensagemErro}
        </div>
      )}

      {mensagemSucesso && (
        <div
          role="status"
          className="rounded-xl border border-[#A3DFC0] bg-[#E5F5EC] px-4 py-3 text-sm font-semibold text-[#00522B]"
        >
          {mensagemSucesso}
        </div>
      )}

      {abaAtiva === "demo" && (
        <section aria-labelledby="titulo-contas-demo" className="grid gap-4 md:grid-cols-2">
          <h2 id="titulo-contas-demo" className="sr-only">
            Contas Demonstrativas
          </h2>

          {contasDemo.map((conta) => {
            const ativo = conta.id === atorAtualId
            return (
              <article
                key={conta.id}
                className="flex flex-col justify-between rounded-xl border border-line bg-white p-5 transition-colors hover:border-input"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-soft px-3 py-0.5 text-xs font-semibold text-ink">
                      {conta.rotuloPerfil}
                    </span>
                    {ativo && (
                      <span className="rounded-full border border-[#A3DFC0] bg-[#E5F5EC] px-2.5 py-0.5 text-xs font-semibold text-[#00522B]">
                        ✓ Sessão atual
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{conta.nome}</h3>
                  <p className="font-sans text-xs text-muted">{conta.email}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {conta.descricaoCurta}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-ink">
                    Papéis: {conta.papeis.map((p) => ROTULO_PAPEL[p]).join(" + ")}
                  </p>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => entrarComContaDemo(conta.id)}
                    className="w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand"
                  >
                    Entrar como {conta.nome} →
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {abaAtiva === "cadastro" && (
        <section
          aria-labelledby="titulo-cadastro-paciente"
          className="max-w-xl rounded-xl border border-line bg-white p-6"
        >
          <h2 id="titulo-cadastro-paciente" className="text-lg font-semibold text-ink">
            Criar conta de Paciente
          </h2>
          <p className="mt-1 text-xs text-muted">
            Coletamos apenas nome, e-mail e telefone para agendamento (LGPD).
          </p>

          <form onSubmit={submeterCadastro} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="cadastro-nome" className="block text-xs font-semibold text-muted">
                Nome completo *
              </label>
              <input
                id="cadastro-nome"
                type="text"
                required
                maxLength={120}
                value={nomeCadastro}
                onChange={(e) => setNomeCadastro(e.target.value)}
                placeholder="Ex.: Ana Paula Souza"
                className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cadastro-email" className="block text-xs font-semibold text-muted">
                E-mail *
              </label>
              <input
                id="cadastro-email"
                type="email"
                required
                maxLength={160}
                value={emailCadastro}
                onChange={(e) => setEmailCadastro(e.target.value)}
                placeholder="ana.souza@exemplo.invalid"
                className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cadastro-telefone" className="block text-xs font-semibold text-muted">
                Telefone *
              </label>
              <input
                id="cadastro-telefone"
                type="tel"
                required
                maxLength={40}
                value={telefoneCadastro}
                onChange={(e) => setTelefoneCadastro(e.target.value)}
                placeholder="(11) 90000-1234"
                className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-line bg-canvas p-3.5">
              <label
                htmlFor="cadastro-termos"
                className="flex cursor-pointer items-start gap-2.5 text-xs text-ink"
              >
                <input
                  id="cadastro-termos"
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-ink"
                />
                <span>
                  Li e aceito os{" "}
                  <Link href="/termos" className="font-semibold text-ink underline">
                    Termos de Serviço
                  </Link>{" "}
                  ({versaoTermos}) e a{" "}
                  <Link href="/privacidade" className="font-semibold text-ink underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              {isPending ? "Criando..." : "Criar conta de paciente"}
            </button>
          </form>
        </section>
      )}

      {abaAtiva === "login" && (
        <section
          aria-labelledby="titulo-login"
          className="max-w-xl rounded-xl border border-line bg-white p-6"
        >
          <h2 id="titulo-login" className="text-lg font-semibold text-ink">
            Entrar com e-mail
          </h2>
          <p className="mt-1 text-xs text-muted">
            Use o e-mail de uma conta demonstrativa ou cadastrada nesta sessão.
          </p>

          <form onSubmit={submeterLogin} className="mt-4 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-muted">
                E-mail *
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="login-senha" className="block text-xs font-semibold text-muted">
                Senha demonstrativa *
              </label>
              <input
                id="login-senha"
                type="password"
                required
                value={senhaLogin}
                onChange={(e) => setSenhaLogin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              {isPending ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </section>
      )}

      {abaAtiva === "recuperacao" && (
        <section
          aria-labelledby="titulo-recuperacao"
          className="max-w-xl rounded-xl border border-line bg-white p-6"
        >
          <h2 id="titulo-recuperacao" className="text-lg font-semibold text-ink">
            Recuperar acesso
          </h2>
          <p className="mt-1 text-xs text-muted">
            Na demonstração nenhum e-mail real é disparado; use a aba Contas Demo para alternar em 1
            clique.
          </p>

          <form onSubmit={submeterRecuperacao} className="mt-4 space-y-4">
            <div>
              <label htmlFor="recuperacao-email" className="block text-xs font-semibold text-muted">
                E-mail da conta *
              </label>
              <input
                id="recuperacao-email"
                type="email"
                required
                value={emailRecuperacao}
                onChange={(e) => setEmailRecuperacao(e.target.value)}
                placeholder="mariana.costa@demo.exemplo.invalid"
                className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              Simular recuperação
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
