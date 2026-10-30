"use client"

import type { Papel } from "@sgc/backend/domain"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { acaoAlternarPerfilDemo, acaoRestaurarDemonstracao } from "@/app/acoes"
import { Icone, Marca, type NomeIcone } from "@/components/icone"
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

export function BarraDemonstracao({ atorId, nomeAtor, papeisAtor, contasDemo, nomeClinica, basePath }: {
  atorId: string
  nomeAtor: string
  papeisAtor: readonly Papel[]
  contasDemo: readonly ContaDemoResumo[]
  nomeClinica: string
  basePath: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)
  const papeis = papeisAtor.map((papel) => ROTULO_PAPEL[papel]).join(" + ")
  const iniciais = nomeAtor.split(" ").filter(Boolean).slice(0, 2).map((nome) => nome[0]).join("")
  const links: { href: string; rotulo: string; icone: NomeIcone }[] = [
    { href: basePath, rotulo: "Visão geral", icone: "inicio" },
    { href: `${basePath}/paciente`, rotulo: "Paciente", icone: "conta" },
    { href: `${basePath}/recepcao`, rotulo: "Recepção", icone: "agenda" },
    { href: `${basePath}/dentista`, rotulo: "Dentista", icone: "cuidado" },
    { href: `${basePath}/gestor`, rotulo: "Gestor", icone: "grafico" },
    { href: `${basePath}/acesso`, rotulo: "Contas e acesso", icone: "pessoas" },
  ]
  const atual = links.find((item) => item.href === pathname)

  function trocarPerfil(contaId: string) {
    setAviso(null)
    startTransition(async () => {
      const res = await acaoAlternarPerfilDemo(contaId)
      if (res.ok) {
        if (res.dados?.rotaInicial) router.push(res.dados.rotaInicial)
        else router.refresh()
      } else setAviso(res.mensagem)
    })
  }

  function restaurarDados() {
    setAviso(null)
    startTransition(async () => {
      const res = await acaoRestaurarDemonstracao()
      setAviso(res.mensagem)
      if (res.ok && res.dados?.rotaInicial) router.push(res.dados.rotaInicial)
      else router.refresh()
    })
  }

  return (
    <>
      <aside className="app-sidebar" onKeyDown={(evento) => {
        if (evento.key === "Escape" && menuAberto) {
          setMenuAberto(false)
          menuRef.current?.focus()
        }
      }}>
        <div className="sidebar-mobile-row">
          <Link href={basePath} className="sidebar-brand" aria-label={`${nomeClinica} — início`}>
            <Marca />
          </Link>
          <button ref={menuRef} type="button" className="mobile-menu" aria-expanded={menuAberto} aria-controls="navegacao-app" onClick={() => setMenuAberto(!menuAberto)}>
            <Icone nome={menuAberto ? "fechar" : "menu"} /> Menu
          </button>
        </div>
        <div className="clinic-identity"><Icone nome="inicio" /><div><strong>{nomeClinica}</strong><small>Seu espaço de cuidado</small></div></div>
        <p className="nav-caption">Espaço de trabalho</p>
        <nav id="navegacao-app" aria-label="Módulos do sistema" className={`app-nav ${menuAberto ? "is-open" : ""}`}>
          {links.map((item) => {
            const ativo = item.href === pathname
            return (
              <Link key={item.href} href={item.href} aria-current={ativo ? "page" : undefined} onClick={() => setMenuAberto(false)}>
                <Icone nome={item.icone} /><span>{item.rotulo}</span>{ativo && <span className="nav-current-dot" aria-hidden="true" />}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><strong><Icone nome="brilho" width="16" height="16" /> Explore a demonstração</strong><p>Troque de perfil no topo e conheça cada etapa do atendimento. Use apenas dados fictícios.</p></div>
          <Link className="sidebar-return" href="/"><Icone nome="voltar" width="16" height="16" /> Conhecer o SGC</Link>
        </div>
      </aside>
      <header className="app-topbar">
        <div className="topbar-context"><span>Clínica <span aria-hidden="true">/</span></span><strong>{atual?.rotulo ?? nomeClinica}</strong><span className="demo-label">Demonstração</span></div>
        <div className="topbar-tools">
          <button type="button" disabled={isPending} onClick={restaurarDados} className="reset-button" aria-label="Restaurar dados" title="Restaurar dados da demonstração"><Icone nome="restaurar" width="16" height="16" /><span>Restaurar dados</span></button>
          <div className="profile-select">
            <span className="avatar" aria-hidden="true">{iniciais}</span>
            <div>
              <label htmlFor="seletor-perfil-topo">PERFIL DEMONSTRATIVO</label>
              <select id="seletor-perfil-topo" aria-label="Alternar perfil demonstrativo" disabled={isPending} value={atorId} onChange={(evento) => trocarPerfil(evento.target.value)}>
                {contasDemo.map((conta) => <option key={conta.id} value={conta.id}>{conta.rotuloPerfil} — {conta.nome}</option>)}
                {!contasDemo.some((conta) => conta.id === atorId) && <option value={atorId}>{nomeAtor} ({papeis})</option>}
              </select>
            </div>
          </div>
        </div>
        {aviso && <div role="status" aria-live="polite" className="app-feedback">{aviso}</div>}
      </header>
    </>
  )
}
