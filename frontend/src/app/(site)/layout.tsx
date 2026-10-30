import Link from "next/link"
import { Marca, Icone } from "@/components/icone"

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-container site-header-inner">
          <Link href="/" aria-label="SGC — início"><Marca /></Link>
          <nav aria-label="Seções" className="site-links"><a href="/#funcionalidades">Funcionalidades</a><a href="/#como-funciona">Como funciona</a><a href="/#perguntas">Perguntas frequentes</a></nav>
          <div className="site-actions"><Link href="/c/aurora" className="button button-secondary">Ver demonstração</Link><Link href="/cadastro" className="button button-primary">Criar clínica <Icone nome="seta" width="16" height="16" /></Link></div>
        </div>
      </header>
      <main id="conteudo-principal">{children}</main>
      <footer className="site-footer">
        <div className="site-container site-footer-inner"><p className="site-footer-marca"><Marca /><span>Gestão odontológica, feita para conectar.</span></p><nav aria-label="Políticas"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></nav><span>Projeto demonstrativo · Sem atendimento real</span></div>
      </footer>
    </div>
  )
}
