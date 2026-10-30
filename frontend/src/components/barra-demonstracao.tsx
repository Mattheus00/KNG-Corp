"use client"

import type { Papel } from "@sgc/backend/domain"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { acaoAlternarPerfilDemo, acaoRestaurarDemonstracao } from "@/app/acoes"
import { ROTULO_PAPEL } from "@/lib/formatadores"

export type ContaDemoResumo = {
  id: string
  rotuloPerfil: string
  descricaoCurta: string
  nome: string
  email: string
  papeis: readonly Papel[]
  rotaInicial: string
}

export function BarraDemonstracao({
  atorId,
  nomeAtor,
  papeisAtor,
  contasDemo,
}: {
  atorId: string
  nomeAtor: string
  papeisAtor: readonly Papel[]
  contasDemo: readonly ContaDemoResumo[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)

  function trocarPerfil(contaId: string, irParaRota: boolean) {
    setAviso(null)
    startTransition(async () => {
      const res = await acaoAlternarPerfilDemo(contaId)
      if (res.ok) {
        if (irParaRota && res.dados?.rotaInicial) {
          router.push(res.dados.rotaInicial)
        } else {
          router.refresh()
        }
      } else {
        setAviso(res.mensagem)
      }
    })
  }

  function restaurarDados() {
    setAviso(null)
    startTransition(async () => {
      const res = await acaoRestaurarDemonstracao()
      setAviso(res.mensagem)
      router.refresh()
    })
  }

  const linksPrincipais = [
    { href: "/", rotulo: "Início" },
    { href: "/paciente", rotulo: "Paciente" },
    { href: "/recepcao", rotulo: "Recepção" },
    { href: "/dentista", rotulo: "Dentista" },
    { href: "/gestor", rotulo: "Gestor" },
    { href: "/acesso", rotulo: "Contas" },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-[#DDE2E8] bg-white/95 backdrop-blur">
      {/* Compact WebApp Top Bar */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* App Brand */}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-xl pr-2 text-[#002664]"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#002664] text-xs font-extrabold tracking-tight text-white"
          >
            SGC
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-extrabold text-[#002664] sm:text-base">
              Aurora Clínica
            </span>
            <span className="block text-[11px] font-medium text-[#495054]">
              WebApp Demonstrativo
            </span>
          </div>
        </Link>

        {/* Main App Navigation Pills */}
        <nav
          aria-label="Navegação do aplicativo"
          className="flex flex-wrap items-center gap-1 rounded-xl bg-[#F2F4F7] p-1"
        >
          {linksPrincipais.map((item) => {
            const ativo =
              item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                  ativo
                    ? "bg-[#002664] text-white shadow-xs"
                    : "text-[#495054] hover:bg-white/70 hover:text-[#002664]"
                }`}
              >
                {item.rotulo}
              </Link>
            )
          })}
        </nav>

        {/* Quick Profile Switcher Dropdown + Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#CDD3D9] bg-[#F8FAFC] px-2.5 py-1">
            <span className="hidden text-[11px] font-semibold text-[#495054] sm:inline">
              Visão:
            </span>
            <label htmlFor="seletor-perfil-topo" className="sr-only">
              Alternar perfil demonstrativo
            </label>
            <select
              id="seletor-perfil-topo"
              disabled={isPending}
              value={atorId}
              onChange={(e) => trocarPerfil(e.target.value, true)}
              className="min-h-8 cursor-pointer bg-transparent text-xs font-bold text-[#002664] focus:outline-none"
            >
              {contasDemo.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.rotuloPerfil} — {conta.nome}
                </option>
              ))}
              {!contasDemo.some((c) => c.id === atorId) && (
                <option value={atorId}>
                  {nomeAtor} ({papeisAtor.map((p) => ROTULO_PAPEL[p]).join(" + ")})
                </option>
              )}
            </select>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={restaurarDados}
            title="Restaurar dados fictícios iniciais"
            className="inline-flex min-h-10 items-center rounded-xl border border-[#CDD3D9] bg-white px-3 py-1.5 text-xs font-semibold text-[#495054] transition-colors hover:border-[#002664] hover:text-[#002664]"
          >
            ↺ Resetar
          </button>
        </div>
      </div>

      {aviso && (
        <div
          role="status"
          aria-live="polite"
          className="border-t border-[#B8D8FA] bg-[#E6F2FD] px-4 py-1.5 text-center text-xs font-semibold text-[#002664]"
        >
          {aviso}
        </div>
      )}
    </header>
  )
}
