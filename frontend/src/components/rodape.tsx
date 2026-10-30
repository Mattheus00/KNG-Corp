import Link from "next/link"

export function Rodape({ nome, horario, ficticia }: { nome: string; horario: string; ficticia: boolean }) {
  return (
    <footer className="app-footer">
      <p><strong>{nome}</strong> · {ficticia ? "Dados fictícios" : "Demonstração"}<br />{horario || "Gestão odontológica com SGC"}</p>
      <nav aria-label="Informações do sistema"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></nav>
    </footer>
  )
}
