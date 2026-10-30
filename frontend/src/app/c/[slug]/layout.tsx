import {
  CONTAS_DEMONSTRATIVAS,
  obterCenarioSessao,
  SLUG_CLINICA_EXEMPLO,
} from "@sgc/backend/data"
import { notFound } from "next/navigation"
import { BarraDemonstracao } from "@/components/barra-demonstracao"
import { Rodape } from "@/components/rodape"
import { lerSessaoId } from "@/lib/sessao"

export default async function LayoutClinica({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao({ sessaoId, clinicaSlug: slug })
  if (!cenario) notFound()

  const basePath = `/c/${slug}`
  const contas =
    slug === SLUG_CLINICA_EXEMPLO
      ? CONTAS_DEMONSTRATIVAS.map((conta) => ({
          ...conta,
          rotaInicial: `${basePath}${conta.rotaInicial}`,
        }))
      : cenario.funcionarios
          .filter((funcionario) => funcionario.ativo)
          .map((funcionario) => ({
            id: funcionario.id,
            rotuloPerfil: funcionario.papeis.join(" + "),
            descricaoCurta: "Conta desta clínica",
            nome: funcionario.nome,
            email: funcionario.email,
            papeis: funcionario.papeis,
            rotaInicial: funcionario.papeis.includes("gestor")
              ? `${basePath}/gestor`
              : funcionario.papeis.includes("dentista")
                ? `${basePath}/dentista`
                : `${basePath}/recepcao`,
          }))

  return (
    <>
      <BarraDemonstracao
        atorId={cenario.atorAtual.id}
        nomeAtor={cenario.nomeAtorAtual}
        papeisAtor={cenario.atorAtual.papeis}
        contasDemo={contas}
        nomeClinica={cenario.clinica.nome}
        basePath={basePath}
      />
      <div className="app-body">
        <main id="conteudo-principal" className="app-main">
          {children}
        </main>
        <Rodape
          nome={cenario.clinica.nome}
          horario={cenario.clinica.horarioFuncionamento}
          ficticia={cenario.clinica.ficticia}
        />
      </div>
    </>
  )
}
