import {
  falha,
  papelDoCadastroPublico,
  podeRemarcarSituacao,
  sucesso,
  transicaoPermitida,
  type Agendamento,
  type Ator,
  type Papel,
  type Resultado,
  type SituacaoAtendimento,
} from "../domain"

// Papéis vêm do cadastro mantido no servidor. Metadados editáveis pelo usuário,
// inclusive user_metadata do Supabase, não entram nesta decisão.

const PAPEIS_DE_FUNCIONARIO = ["recepcao", "dentista", "gestor"] as const satisfies readonly Papel[]

export { papelDoCadastroPublico }

export function podeAtribuirPapel(ator: Ator, papel: Papel): boolean {
  if (!ator.papeis.includes("gestor")) return false
  return PAPEIS_DE_FUNCIONARIO.some((permitido) => permitido === papel)
}

export function podeAgendar(ator: Ator, pacienteId: string): Resultado<null> {
  // Enquanto não houver vínculo verificado entre conta e cadastro da recepção,
  // o paciente autenticado é o próprio pacienteId. Nome ou e-mail não autorizam.
  if (ator.papeis.includes("recepcao")) return sucesso(null)
  if (ator.papeis.includes("paciente") && ator.id === pacienteId) return sucesso(null)
  return falha("sem_permissao", "Você não pode agendar para este paciente.")
}

export function podeLerAgendamento(
  ator: Ator,
  consulta: Pick<Agendamento, "pacienteId" | "profissionalId">,
): boolean {
  // Gestor e recepção leem o registro operacional. Este modelo não tem conteúdo clínico;
  // quando houver, a leitura clínica não pode seguir esta função.
  if (ator.papeis.includes("recepcao") || ator.papeis.includes("gestor")) return true
  if (ator.papeis.includes("paciente") && ator.id === consulta.pacienteId) return true
  if (
    ator.papeis.includes("dentista") &&
    ator.profissionalId !== null &&
    ator.profissionalId === consulta.profissionalId
  ) {
    return true
  }
  return false
}

export function podeAlterarSituacao(
  ator: Ator,
  consulta: Pick<Agendamento, "pacienteId" | "profissionalId" | "situacao">,
  nova: SituacaoAtendimento,
): Resultado<null> {
  if (atorSomentePacienteDeOutraConsulta(ator, consulta.pacienteId)) {
    return falha("sem_permissao", "Você não pode alterar a consulta de outro paciente.")
  }

  const aplicaveis = papeisAplicaveis(ator, consulta)
  if (!transicaoPermitida(consulta.situacao, nova, aplicaveis)) {
    if (aplicaveis.length === 0) {
      return falha("sem_permissao", "Você não pode alterar esta consulta.")
    }
    return falha("transicao_invalida", "Esta mudança de situação não é permitida.")
  }
  return sucesso(null)
}

export function podeRemarcar(
  ator: Ator,
  consulta: Pick<Agendamento, "pacienteId" | "profissionalId" | "situacao">,
): Resultado<null> {
  if (atorSomentePacienteDeOutraConsulta(ator, consulta.pacienteId)) {
    return falha("sem_permissao", "Você não pode remarcar a consulta de outro paciente.")
  }

  const aplicaveis = papeisAplicaveis(ator, consulta)
  if (!podeRemarcarSituacao(consulta.situacao, aplicaveis)) {
    if (aplicaveis.length === 0) {
      return falha("sem_permissao", "Você não pode remarcar esta consulta.")
    }
    return falha("remarcacao_nao_permitida", "Esta consulta não pode ser remarcada.")
  }
  return sucesso(null)
}

export function podeConfirmarPresenca(ator: Ator): Resultado<null> {
  if (!ator.papeis.includes("recepcao")) {
    return falha("presenca_nao_permitida", "Somente a recepção confirma a presença.")
  }
  return sucesso(null)
}

function papeisAplicaveis(
  ator: Ator,
  consulta: Pick<Agendamento, "pacienteId" | "profissionalId">,
): Papel[] {
  const papeis: Papel[] = []
  if (ator.papeis.includes("recepcao")) papeis.push("recepcao")
  if (ator.papeis.includes("paciente") && ator.id === consulta.pacienteId) papeis.push("paciente")
  if (ator.papeis.includes("dentista") && ator.profissionalId === consulta.profissionalId) {
    papeis.push("dentista")
  }
  return papeis
}

function atorSomentePacienteDeOutraConsulta(ator: Ator, pacienteId: string): boolean {
  return ator.papeis.length === 1 && ator.papeis[0] === "paciente" && ator.id !== pacienteId
}
