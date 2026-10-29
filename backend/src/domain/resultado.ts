export type CodigoErro =
  | "sem_permissao"
  | "transicao_invalida"
  | "horario_no_passado"
  | "conflito_horario"
  | "fora_do_expediente"
  | "profissional_nao_habilitado"
  | "duracao_invalida"
  | "motivo_obrigatorio"
  | "remarcacao_nao_permitida"
  | "consulta_nao_encontrada"
  | "presenca_nao_permitida"
  | "entrada_invalida"

export type ErroNegocio = {
  codigo: CodigoErro
  mensagem: string
}

export type Falha = {
  ok: false
  erro: ErroNegocio
}

export type Resultado<T> = { ok: true; valor: T } | Falha

export function sucesso<T>(valor: T): Resultado<T> {
  return { ok: true, valor }
}

export function falha(codigo: CodigoErro, mensagem: string): Falha {
  return { ok: false, erro: { codigo, mensagem } }
}
