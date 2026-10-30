"use client"

import type { Papel } from "@sgc/backend/domain"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { acaoAlternarPerfilDemo } from "@/app/acoes"
import { ROTULO_PAPEL } from "@/lib/formatadores"

export function AvisoPermissao({
  papelNecessario,
  nomeAtorAtual,
  papeisAtuais,
  contaSugeridaId,
  contaSugeridaNome,
}: {
  papelNecessario: Papel
  nomeAtorAtual: string
  papeisAtuais: readonly Papel[]
  contaSugeridaId: string
  contaSugeridaNome: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function entrarComContaSugerida() {
    setErro(null)
    startTransition(async () => {
      const res = await acaoAlternarPerfilDemo(contaSugeridaId)
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      router.refresh()
    })
  }

  return (
    <section
      aria-labelledby="titulo-acesso-restrito"
      className="mx-auto my-10 max-w-lg rounded-xl border border-line bg-white p-6  sm:p-8"
    >
      <span className="inline-flex items-center rounded-full bg-[#FBE9ED] px-3 py-1 text-xs font-semibold text-[#8A0D29]">
        Perfil necessário: {ROTULO_PAPEL[papelNecessario]}
      </span>

      <h1 id="titulo-acesso-restrito" className="mt-3 text-xl font-semibold text-ink">
        Troque de perfil para abrir esta área
      </h1>

      <p className="mt-2 text-sm text-muted">
        Você está conectado como <strong>{nomeAtorAtual}</strong> (
        {papeisAtuais.map((p) => ROTULO_PAPEL[p]).join(" + ")}).
      </p>

      {erro && (
        <p role="alert" className="mt-3 rounded-lg bg-[#FBE9ED] p-3 text-xs font-semibold text-[#8A0D29]">
          {erro}
        </p>
      )}

      {contaSugeridaId ? (
      <button
        type="button"
        disabled={isPending}
        onClick={entrarComContaSugerida}
        className="mt-5 min-h-11 w-full rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
      >
        {isPending
          ? "Alternando..."
          : `Entrar como ${contaSugeridaNome} (${ROTULO_PAPEL[papelNecessario]}) →`}
      </button>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Peça ao gestor desta clínica um convite com o papel necessário, ou alterne para uma conta
          já cadastrada no seletor do topo.
        </p>
      )}
    </section>
  )
}
