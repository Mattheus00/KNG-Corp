export { papelDoCadastroPublico, PAPEIS } from "./papeis"
export type { Ator, Papel } from "./papeis"

export {
  LIMITE_MOTIVO_CANCELAMENTO,
  motivoObrigatorio,
  ocupaAgenda,
  podeRemarcarSituacao,
  SITUACOES_ATENDIMENTO,
  transicaoPermitida,
} from "./situacao"
export type { SituacaoAtendimento } from "./situacao"

export type { Agendamento, AcaoHistorico, AlteracaoHorario, RegistroHistorico } from "./agendamento"

export { FUSO_CLINICA, instanteNoFuso, relogioNoFuso } from "./fuso"
export type { RelogioLocal } from "./fuso"

export {
  intersecao,
  intervalosSobrepoem,
  minutosDoIntervalo,
  subtrairIntervalos,
  unirIntervalos,
} from "./intervalo"
export type { Intervalo } from "./intervalo"

export { avaliarReserva, duracaoAtendimentoValida, horariosDisponiveis } from "./disponibilidade"
export type { ContextoReserva, PedidoDisponibilidade } from "./disponibilidade"

export { calcularIndicadores } from "./indicadores"
export type {
  ConsultaParaIndicador,
  ExpedienteProfissional,
  Indicadores,
  Taxa,
} from "./indicadores"

export { consultasAfetadasPorDesativacao } from "./desativacao"

export { falha, sucesso } from "./resultado"
export type { CodigoErro, ErroCampo, ErroNegocio, Falha, Resultado } from "./resultado"
