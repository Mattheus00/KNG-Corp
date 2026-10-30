import type { Metadata } from "next"
import { Icone } from "@/components/icone"
import { FormularioClinica } from "./formulario-clinica"

export const metadata: Metadata = {
  title: "Criar clínica",
  description: "Crie uma clínica demonstrativa no SGC. Os dados ficam só na memória desta sessão e não há cobrança.",
  alternates: { canonical: "/cadastro" },
}

export default function PaginaCadastro() {
  return (
    <div className="registration">
      <div className="registration-intro"><p className="eyebrow">Um novo começo</p><h1>Criar clínica</h1><p>Um espaço para organizar a rotina e conectar toda a equipe. Comece pelos dados da sua clínica demonstrativa.</p><ul><li><Icone nome="check" /> Você entra como gestor</li><li><Icone nome="check" /> Gratuito nesta fase</li><li><Icone nome="check" /> Dados isolados por sessão</li></ul><p className="mt-8">A clínica começa vazia. Use apenas dados fictícios; esta demonstração não oferece atendimento real.</p></div>
      <div className="registration-form"><FormularioClinica /></div>
    </div>
  )
}
