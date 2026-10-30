import { DADOS_CLINICA_FICTICIA } from "@sgc/backend/data"
import Link from "next/link"

export function Rodape() {
  return (
    <footer className="mt-12 border-t border-[#DDE2E8] bg-white text-[#495054]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 text-xs sm:flex-row sm:items-center sm:px-6">
        <div>
          <span className="font-bold text-[#002664]">{DADOS_CLINICA_FICTICIA.nome}</span>
          <span className="mx-2 text-[#CDD3D9]">•</span>
          <span>Ambiente demonstrativo com dados fictícios ({DADOS_CLINICA_FICTICIA.horarioFuncionamento})</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-semibold text-[#002664]">
          <Link href="/acesso" className="hover:underline">
            Contas Demo
          </Link>
          <Link href="/privacidade" className="hover:underline">
            Privacidade (LGPD)
          </Link>
          <Link href="/termos" className="hover:underline">
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  )
}
