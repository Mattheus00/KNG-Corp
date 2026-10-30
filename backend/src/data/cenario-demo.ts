import "server-only"

import {
  papelDoCadastroPublico,
  podeAtribuirPapel,
  podeLerAgendamento,
} from "../auth"
import {
  calcularIndicadores,
  consultasAfetadasPorDesativacao,
  duracaoAtendimentoValida,
  falha,
  FUSO_CLINICA,
  horariosDisponiveis,
  instanteNoFuso,
  intervalosSobrepoem,
  ocupaAgenda,
  relogioNoFuso,
  sucesso,
  type Agendamento,
  type Ator,
  type ExpedienteProfissional,
  type Indicadores,
  type Intervalo,
  type Papel,
  type RegistroHistorico,
  type Resultado,
} from "../domain"
import {
  agendar,
  alterarSituacao,
  confirmarPresenca,
  remarcar,
  type AgendaRepositorio,
  type VistaAgenda,
} from "../services"
import {
  lerAtualizacaoPaciente,
  lerCadastroPacientePublico,
  lerCadastroPacienteRecepcao,
  lerConviteFuncionario,
  lerPedidoAgendamento,
  lerPedidoAlterarSituacao,
  lerPedidoCancelamento,
  lerPedidoConfirmarPresenca,
  lerPedidoRemarcacao,
} from "../validation"

export type PacienteCadastro = {
  id: string
  nome: string
  email: string | null
  telefone: string
  possuiConta: boolean
  criadoEm: Date
  termosAceitosVersao: string | null
  termosAceitosEm: Date | null
}

export type ProfissionalClinica = {
  id: string
  usuarioId: string
  nome: string
  especialidade: string
  apresentacao: string
  ativo: boolean
  aberturaHora: number
  fechamentoHora: number
}

export type FuncionarioClinica = {
  id: string
  nome: string
  email: string
  papeis: Papel[]
  profissionalId: string | null
  ativo: boolean
  convitePendente: boolean
}

export type ServicoClinica = {
  id: string
  nome: string
  descricao: string
  duracaoMinutos: number
  indicacaoPreco: string
  disponivelParaAutoagendamento: boolean
  profissionaisHabilitados: string[]
}

export type BloqueioClinica = {
  id: string
  profissionalId: string
  motivo: string
  inicio: Date
  fim: Date
}

export type ContaDemonstrativa = {
  id: string
  rotuloPerfil: string
  descricaoCurta: string
  nome: string
  email: string
  papeis: readonly Papel[]
  profissionalId: string | null
  rotaInicial: "/paciente" | "/recepcao" | "/dentista" | "/gestor"
}

export const LIMITE_RESERVAS_ATIVAS_POR_PACIENTE = 3
export const LIMITE_DIAS_ANTECEDENCIA_RESERVA = 180
const LIMITE_OPERACOES_POR_MINUTO = 30

export const DADOS_CLINICA_FICTICIA = {
  nome: "Clínica Odontológica Aurora",
  codigoUnidade: "UNIDADE SP-01 • DEMONSTRAÇÃO SGC",
  identificacaoDemonstracao:
    "Ambiente demonstrativo do Sistema de Gestão de Clínicas (SGC) — clínica, equipe, contatos e pacientes são estritamente fictícios.",
  subtitulo:
    "Serviço público digital de agendamento odontológico, operação clínica e gestão transparente.",
  apresentacao:
    "A Clínica Odontológica Aurora é uma unidade fictícia criada para demonstrar a jornada completa de agendamento, atendimento clínico operacional e acompanhamento gerencial em tempo real.",
  horarioFuncionamento: "Segunda a sábado, das 08:00 às 18:00 (Horário de Brasília — America/Sao_Paulo)",
  enderecoFicticio:
    "Av. das Araucárias, 1000 — Sala 402, Bairro Jardim Central, São Paulo/SP (Endereço fictício de demonstração)",
  telefoneFicticio: "(11) 0000-0000 (Canal fictício — não realiza atendimento real)",
  emailFicticio: "contato-demo@clinica-aurora.exemplo.invalid",
  versaoTermos: "1.0-demo (2026-10-30)",
  ultimaAtualizacaoPoliticas: "30 de outubro de 2026",
  regrasOperacionais: [
    "Reserva imediata em horários livres, protegida contra conflitos simultâneos no mesmo profissional.",
    "Limite de até 3 consultas futuras ativas simultâneas por paciente no autoagendamento público para evitar bloqueio indevido da agenda.",
    "Confirmação de presença registrada pela recepção para o horário vigente. Se a consulta for remarcada para outro horário, uma nova confirmação será necessária.",
    "Remarcação atômica: permitida para consultas na situação 'Agendado'. Caso o novo horário não possa ser reservado, a consulta original permanece intacta.",
    "Cancelamento: exige indicação de motivo (até 200 caracteres) e libera imediatamente o horário na agenda do profissional.",
    "Transparência de preços: nenhuma taxa é cobrada para agendar pelo sistema. Eventuais planos de tratamento dependem de avaliação clínica presencial.",
  ],
} as const

export const CONTAS_DEMONSTRATIVAS: readonly ContaDemonstrativa[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    rotuloPerfil: "Paciente",
    descricaoCurta: "Agenda avaliação, consulta horários, remarca, cancela e atualiza contato.",
    nome: "Mariana Costa",
    email: "mariana.costa@demo.exemplo.invalid",
    papeis: ["paciente"],
    profissionalId: null,
    rotaInicial: "/paciente",
  },
  {
    id: "22222222-2222-4222-8222-222222222201",
    rotuloPerfil: "Recepção",
    descricaoCurta: "Gerencia agenda da clínica, cadastra pacientes, confirma presença e chegada.",
    nome: "Lucas Ferreira",
    email: "recepcao@clinica-aurora.exemplo.invalid",
    papeis: ["recepcao"],
    profissionalId: null,
    rotaInicial: "/recepcao",
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    rotuloPerfil: "Dentista (Dra. Helena)",
    descricaoCurta: "Consulta a própria agenda e inicia/conclui atendimentos após a chegada.",
    nome: "Dra. Helena Martins",
    email: "helena.martins@clinica-aurora.exemplo.invalid",
    papeis: ["dentista"],
    profissionalId: "33333333-3333-4333-8333-333333333301",
    rotaInicial: "/dentista",
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    rotuloPerfil: "Gestor",
    descricaoCurta: "Acompanha indicadores do dashboard, equipe, serviços, expediente e bloqueios.",
    nome: "Roberto Vasconcelos",
    email: "gestao@clinica-aurora.exemplo.invalid",
    papeis: ["gestor"],
    profissionalId: null,
    rotaInicial: "/gestor",
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    rotuloPerfil: "Gestora + Dentista (Acúmulo)",
    descricaoCurta: "Demonstra acúmulo explícito dos papéis de dentista e gestora na mesma conta.",
    nome: "Dra. Camila Tavares",
    email: "camila.tavares@clinica-aurora.exemplo.invalid",
    papeis: ["dentista", "gestor"],
    profissionalId: "33333333-3333-4333-8333-333333333303",
    rotaInicial: "/gestor",
  },
] as const

export type EstadoCenario = {
  sessaoId: string
  criadoEm: Date
  atorAtual: Ator
  nomeAtorAtual: string
  emailAtorAtual: string
  pacientes: PacienteCadastro[]
  profissionais: ProfissionalClinica[]
  funcionarios: FuncionarioClinica[]
  servicos: ServicoClinica[]
  bloqueios: BloqueioClinica[]
  consultas: Agendamento[]
  historico: RegistroHistorico[]
  cadeiaTransacao: Promise<unknown>
  marcasOperacaoMs: number[]
}

const LIMITE_SESSOES_MEMORIA = 200
const PADRAO_SESSAO_ID_SEGURO = /^[a-zA-Z0-9_-]{4,80}$/

const globalComCenarios = globalThis as unknown as {
  __sgcCenariosDemo?: Map<string, EstadoCenario>
}

function mapaCenarios(): Map<string, EstadoCenario> {
  if (!globalComCenarios.__sgcCenariosDemo) {
    globalComCenarios.__sgcCenariosDemo = new Map<string, EstadoCenario>()
  }
  return globalComCenarios.__sgcCenariosDemo
}

export function normalizarSessaoIdSeguro(sessaoIdBruto: unknown): string {
  if (typeof sessaoIdBruto !== "string") return `sessao-efemera-${crypto.randomUUID()}`
  const limpo = sessaoIdBruto.trim()
  if (
    !PADRAO_SESSAO_ID_SEGURO.test(limpo) ||
    limpo === "__proto__" ||
    limpo === "constructor" ||
    limpo === "prototype"
  ) {
    return `sessao-efemera-${crypto.randomUUID()}`
  }
  return limpo
}

function verificarTaxaOperacao(estado: EstadoCenario, agoraMs = Date.now()): Resultado<null> {
  const janelaInicio = agoraMs - 60_000
  estado.marcasOperacaoMs = estado.marcasOperacaoMs.filter((t) => t >= janelaInicio)
  if (estado.marcasOperacaoMs.length >= LIMITE_OPERACOES_POR_MINUTO) {
    return falha(
      "sem_permissao",
      "Muitas solicitações em sequência. Aguarde alguns segundos antes de tentar novamente.",
    )
  }
  estado.marcasOperacaoMs.push(agoraMs)
  return sucesso(null)
}

// Garante que funcionários desativados percam imediatamente autorização no servidor,
// mesmo que sua sessão estivesse autenticada antes da desativação.
function garantirAtorAtivo(estado: EstadoCenario): Resultado<Ator> {
  const { atorAtual } = estado
  const ehFuncionario = atorAtual.papeis.some(
    (p) => p === "recepcao" || p === "dentista" || p === "gestor",
  )
  if (ehFuncionario) {
    const registroFuncionario = estado.funcionarios.find((f) => f.id === atorAtual.id)
    if (!registroFuncionario || !registroFuncionario.ativo) {
      return falha("sem_permissao", "Esta conta de funcionário está desativada.")
    }
    // Sincroniza papéis com o registro do servidor (nunca confia em estado obsoleto)
    atorAtual.papeis = [...registroFuncionario.papeis]
  }
  return sucesso(atorAtual)
}

function deslocarDataCivil(
  base: { ano: number; mes: number; dia: number },
  diasDelta: number,
): { ano: number; mes: number; dia: number } {
  const utc = new Date(Date.UTC(base.ano, base.mes - 1, base.dia + diasDelta, 12, 0, 0))
  return {
    ano: utc.getUTCFullYear(),
    mes: utc.getUTCMonth() + 1,
    dia: utc.getUTCDate(),
  }
}

export function instanteClinica(ano: number, mes: number, dia: number, hora: number, minuto = 0): Date {
  const convertido = instanteNoFuso({ ano, mes, dia, hora, minuto }, FUSO_CLINICA)
  if (!convertido.ok) {
    throw new Error(convertido.erro.mensagem)
  }
  return convertido.valor
}

export function formatarDataISOClinica(instante: Date): string {
  const rel = relogioNoFuso(instante, FUSO_CLINICA)
  const m = String(rel.mes).padStart(2, "0")
  const d = String(rel.dia).padStart(2, "0")
  return `${rel.ano}-${m}-${d}`
}

export function lerDataISOClinica(isoData: string): { ano: number; mes: number; dia: number } | null {
  if (typeof isoData !== "string") return null
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoData.trim())
  if (!partes) return null
  const ano = Number(partes[1])
  const mes = Number(partes[2])
  const dia = Number(partes[3])
  const teste = instanteNoFuso({ ano, mes, dia, hora: 12, minuto: 0 }, FUSO_CLINICA)
  if (!teste.ok) return null
  return { ano, mes, dia }
}

function criarEstadoInicial(sessaoId: string, agora = new Date()): EstadoCenario {
  const hojeRel = relogioNoFuso(agora, FUSO_CLINICA)
  const hoje = { ano: hojeRel.ano, mes: hojeRel.mes, dia: hojeRel.dia }
  const ontem = deslocarDataCivil(hoje, -1)
  const amanha = deslocarDataCivil(hoje, 1)
  const depoisDeAmanha = deslocarDataCivil(hoje, 2)

  const pacientes: PacienteCadastro[] = [
    {
      id: "11111111-1111-4111-8111-111111111101",
      nome: "Mariana Costa",
      email: "mariana.costa@demo.exemplo.invalid",
      telefone: "(11) 90000-0101",
      possuiConta: true,
      criadoEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 0),
      termosAceitosVersao: DADOS_CLINICA_FICTICIA.versaoTermos,
      termosAceitosEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 0),
    },
    {
      id: "11111111-1111-4111-8111-111111111102",
      nome: "Carlos Henrique Almeida",
      email: "carlos.almeida@demo.exemplo.invalid",
      telefone: "(11) 90000-0102",
      possuiConta: true,
      criadoEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 15),
      termosAceitosVersao: DADOS_CLINICA_FICTICIA.versaoTermos,
      termosAceitosEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 15),
    },
    {
      id: "11111111-1111-4111-8111-111111111103",
      nome: "Beatriz Nogueira",
      email: null,
      telefone: "(11) 90000-0103",
      possuiConta: false,
      criadoEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 0),
      termosAceitosVersao: null,
      termosAceitosEm: null,
    },
    {
      id: "11111111-1111-4111-8111-111111111104",
      nome: "Fernando Ribeiro",
      email: "fernando.ribeiro@demo.exemplo.invalid",
      telefone: "(11) 90000-0104",
      possuiConta: true,
      criadoEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 30),
      termosAceitosVersao: DADOS_CLINICA_FICTICIA.versaoTermos,
      termosAceitosEm: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 30),
    },
  ]

  const profissionais: ProfissionalClinica[] = [
    {
      id: "33333333-3333-4333-8333-333333333301",
      usuarioId: "22222222-2222-4222-8222-222222222202",
      nome: "Dra. Helena Martins",
      especialidade: "Clínica Geral, Prevenção e Reabilitação Oral",
      apresentacao:
        "Atendimento voltado à avaliação diagnóstica, prevenção de cárie e acompanhamento odontológico integral.",
      ativo: true,
      aberturaHora: 8,
      fechamentoHora: 18,
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      usuarioId: "22222222-2222-4222-8222-222222222203",
      nome: "Dr. Rafael Mendes",
      especialidade: "Endodontia e Dentística Restauradora",
      apresentacao:
        "Foco em procedimentos conservadores, restaurações diretas e reabilitação estética e funcional.",
      ativo: true,
      aberturaHora: 9,
      fechamentoHora: 18,
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      usuarioId: "22222222-2222-4222-8222-222222222205",
      nome: "Dra. Camila Tavares",
      especialidade: "Periodontia e Saúde Gengival",
      apresentacao:
        "Prevenção periodontal, profilaxia clínica e orientação de cuidados bucais personalizados.",
      ativo: true,
      aberturaHora: 8,
      fechamentoHora: 17,
    },
  ]

  const funcionarios: FuncionarioClinica[] = [
    {
      id: "22222222-2222-4222-8222-222222222201",
      nome: "Lucas Ferreira",
      email: "recepcao@clinica-aurora.exemplo.invalid",
      papeis: ["recepcao"],
      profissionalId: null,
      ativo: true,
      convitePendente: false,
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      nome: "Dra. Helena Martins",
      email: "helena.martins@clinica-aurora.exemplo.invalid",
      papeis: ["dentista"],
      profissionalId: "33333333-3333-4333-8333-333333333301",
      ativo: true,
      convitePendente: false,
    },
    {
      id: "22222222-2222-4222-8222-222222222203",
      nome: "Dr. Rafael Mendes",
      email: "rafael.mendes@clinica-aurora.exemplo.invalid",
      papeis: ["dentista"],
      profissionalId: "33333333-3333-4333-8333-333333333302",
      ativo: true,
      convitePendente: false,
    },
    {
      id: "22222222-2222-4222-8222-222222222204",
      nome: "Roberto Vasconcelos",
      email: "gestao@clinica-aurora.exemplo.invalid",
      papeis: ["gestor"],
      profissionalId: null,
      ativo: true,
      convitePendente: false,
    },
    {
      id: "22222222-2222-4222-8222-222222222205",
      nome: "Dra. Camila Tavares",
      email: "camila.tavares@clinica-aurora.exemplo.invalid",
      papeis: ["dentista", "gestor"],
      profissionalId: "33333333-3333-4333-8333-333333333303",
      ativo: true,
      convitePendente: false,
    },
  ]

  const servicos: ServicoClinica[] = [
    {
      id: "44444444-4444-4444-8444-444444444401",
      nome: "Avaliação Odontológica Inicial",
      descricao:
        "Consulta inicial de exame clínico bucal, levantamento de necessidades e definição do plano de cuidado.",
      duracaoMinutos: 60,
      indicacaoPreco:
        "Avaliação clínica presencial; eventuais procedimentos são orçados apenas após diagnóstico. Sem cobrança online.",
      disponivelParaAutoagendamento: true,
      profissionaisHabilitados: [
        "33333333-3333-4333-8333-333333333301",
        "33333333-3333-4333-8333-333333333302",
        "33333333-3333-4333-8333-333333333303",
      ],
    },
    {
      id: "44444444-4444-4444-8444-444444444402",
      nome: "Profilaxia e Prevenção (Limpeza)",
      descricao:
        "Remoção de biofilme e cálculo dental, polimento coronário e orientação de higiene bucal.",
      duracaoMinutos: 60,
      indicacaoPreco:
        "Condições informadas presencialmente conforme avaliação odontológica. Nenhuma taxa é cobrada no agendamento.",
      disponivelParaAutoagendamento: true,
      profissionaisHabilitados: [
        "33333333-3333-4333-8333-333333333301",
        "33333333-3333-4333-8333-333333333303",
      ],
    },
    {
      id: "44444444-4444-4444-8444-444444444403",
      nome: "Restauração Dental Conservadora",
      descricao:
        "Procedimento restaurador direto agendado pela equipe após avaliação clínica inicial.",
      duracaoMinutos: 60,
      indicacaoPreco:
        "Definido conforme plano de tratamento aprovado após avaliação presencial.",
      disponivelParaAutoagendamento: false,
      profissionaisHabilitados: [
        "33333333-3333-4333-8333-333333333301",
        "33333333-3333-4333-8333-333333333302",
      ],
    },
    {
      id: "44444444-4444-4444-8444-444444444404",
      nome: "Retorno de Acompanhamento",
      descricao:
        "Reavaliação clínica rápida (30 minutos) agendada pela recepção ou profissional.",
      duracaoMinutos: 30,
      indicacaoPreco:
        "Acompanhamento vinculado ao atendimento anterior, sem cobrança no agendamento.",
      disponivelParaAutoagendamento: false,
      profissionaisHabilitados: [
        "33333333-3333-4333-8333-333333333301",
        "33333333-3333-4333-8333-333333333302",
        "33333333-3333-4333-8333-333333333303",
      ],
    },
  ]

  const bloqueios: BloqueioClinica[] = [
    {
      id: "55555555-5555-4555-8555-555555555501",
      profissionalId: "33333333-3333-4333-8333-333333333302",
      motivo: "Reunião clínica interna",
      inicio: instanteClinica(amanha.ano, amanha.mes, amanha.dia, 16, 0),
      fim: instanteClinica(amanha.ano, amanha.mes, amanha.dia, 18, 0),
    },
  ]

  const horaConsultaHojeChegou = Math.min(Math.max(hojeRel.hora, 9), 16)
  const horaConsultaHojeAgendada = Math.min(horaConsultaHojeChegou + 1, 17)

  const consultas: Agendamento[] = [
    {
      id: "66666666-6666-4666-8666-666666666601",
      pacienteId: "11111111-1111-4111-8111-111111111101",
      profissionalId: "33333333-3333-4333-8333-333333333301",
      servicoId: "44444444-4444-4444-8444-444444444401",
      inicio: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 0),
      fim: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 10, 0),
      situacao: "concluido",
      presencaConfirmada: true,
      motivoCancelamento: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666602",
      pacienteId: "11111111-1111-4111-8111-111111111102",
      profissionalId: "33333333-3333-4333-8333-333333333302",
      servicoId: "44444444-4444-4444-8444-444444444401",
      inicio: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 10, 0),
      fim: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 11, 0),
      situacao: "falta",
      presencaConfirmada: true,
      motivoCancelamento: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666603",
      pacienteId: "11111111-1111-4111-8111-111111111104",
      profissionalId: "33333333-3333-4333-8333-333333333301",
      servicoId: "44444444-4444-4444-8444-444444444402",
      inicio: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 14, 0),
      fim: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 15, 0),
      situacao: "cancelado",
      presencaConfirmada: false,
      motivoCancelamento: "Imprevisto profissional no horário da tarde",
    },
    {
      id: "66666666-6666-4666-8666-666666666604",
      pacienteId: "11111111-1111-4111-8111-111111111102",
      profissionalId: "33333333-3333-4333-8333-333333333301",
      servicoId: "44444444-4444-4444-8444-444444444401",
      inicio: instanteClinica(hoje.ano, hoje.mes, hoje.dia, horaConsultaHojeChegou, 0),
      fim: instanteClinica(hoje.ano, hoje.mes, hoje.dia, horaConsultaHojeChegou + 1, 0),
      situacao: "chegou",
      presencaConfirmada: true,
      motivoCancelamento: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666605",
      pacienteId: "11111111-1111-4111-8111-111111111103",
      profissionalId: "33333333-3333-4333-8333-333333333302",
      servicoId: "44444444-4444-4444-8444-444444444403",
      inicio: instanteClinica(hoje.ano, hoje.mes, hoje.dia, horaConsultaHojeAgendada, 0),
      fim: instanteClinica(hoje.ano, hoje.mes, hoje.dia, horaConsultaHojeAgendada + 1, 0),
      situacao: "agendado",
      presencaConfirmada: false,
      motivoCancelamento: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666606",
      pacienteId: "11111111-1111-4111-8111-111111111101",
      profissionalId: "33333333-3333-4333-8333-333333333301",
      servicoId: "44444444-4444-4444-8444-444444444402",
      inicio: instanteClinica(amanha.ano, amanha.mes, amanha.dia, 10, 0),
      fim: instanteClinica(amanha.ano, amanha.mes, amanha.dia, 11, 0),
      situacao: "agendado",
      presencaConfirmada: true,
      motivoCancelamento: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666607",
      pacienteId: "11111111-1111-4111-8111-111111111104",
      profissionalId: "33333333-3333-4333-8333-333333333303",
      servicoId: "44444444-4444-4444-8444-444444444401",
      inicio: instanteClinica(depoisDeAmanha.ano, depoisDeAmanha.mes, depoisDeAmanha.dia, 9, 0),
      fim: instanteClinica(depoisDeAmanha.ano, depoisDeAmanha.mes, depoisDeAmanha.dia, 10, 0),
      situacao: "agendado",
      presencaConfirmada: false,
      motivoCancelamento: null,
    },
  ]

  const historico: RegistroHistorico[] = [
    {
      agendamentoId: "66666666-6666-4666-8666-666666666601",
      autorId: "11111111-1111-4111-8111-111111111101",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 5),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666601",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 50),
      acao: "alterar_situacao",
      situacaoAnterior: "agendado",
      situacaoNova: "chegou",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666601",
      autorId: "22222222-2222-4222-8222-222222222202",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 2),
      acao: "alterar_situacao",
      situacaoAnterior: "chegou",
      situacaoNova: "em_atendimento",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666601",
      autorId: "22222222-2222-4222-8222-222222222202",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 55),
      acao: "alterar_situacao",
      situacaoAnterior: "em_atendimento",
      situacaoNova: "concluido",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666602",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 8, 20),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666602",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 10, 30),
      acao: "alterar_situacao",
      situacaoAnterior: "agendado",
      situacaoNova: "falta",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666603",
      autorId: "11111111-1111-4111-8111-111111111104",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 9, 40),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666603",
      autorId: "11111111-1111-4111-8111-111111111104",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 11, 15),
      acao: "alterar_situacao",
      situacaoAnterior: "agendado",
      situacaoNova: "cancelado",
      motivo: "Imprevisto profissional no horário da tarde",
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666604",
      autorId: "11111111-1111-4111-8111-111111111102",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 15, 0),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666604",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(hoje.ano, hoje.mes, hoje.dia, 8, 10),
      acao: "confirmar_presenca",
      situacaoAnterior: "agendado",
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666604",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(hoje.ano, hoje.mes, hoje.dia, 8, 45),
      acao: "alterar_situacao",
      situacaoAnterior: "agendado",
      situacaoNova: "chegou",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666605",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(ontem.ano, ontem.mes, ontem.dia, 16, 0),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666606",
      autorId: "11111111-1111-4111-8111-111111111101",
      momento: instanteClinica(hoje.ano, hoje.mes, hoje.dia, 8, 0),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666606",
      autorId: "22222222-2222-4222-8222-222222222201",
      momento: instanteClinica(hoje.ano, hoje.mes, hoje.dia, 8, 30),
      acao: "confirmar_presenca",
      situacaoAnterior: "agendado",
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
    {
      agendamentoId: "66666666-6666-4666-8666-666666666607",
      autorId: "11111111-1111-4111-8111-111111111104",
      momento: instanteClinica(hoje.ano, hoje.mes, hoje.dia, 8, 20),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    },
  ]

  const contaInicial = CONTAS_DEMONSTRATIVAS[0]!

  return {
    sessaoId,
    criadoEm: new Date(agora),
    atorAtual: {
      id: contaInicial.id,
      papeis: [...contaInicial.papeis],
      profissionalId: contaInicial.profissionalId,
    },
    nomeAtorAtual: contaInicial.nome,
    emailAtorAtual: contaInicial.email,
    pacientes,
    profissionais,
    funcionarios,
    servicos,
    bloqueios,
    consultas,
    historico,
    cadeiaTransacao: Promise.resolve(),
    marcasOperacaoMs: [],
  }
}

export function obterCenarioSessao(sessaoIdBruto: string): EstadoCenario {
  const sessaoId = normalizarSessaoIdSeguro(sessaoIdBruto)
  const mapa = mapaCenarios()
  const existente = mapa.get(sessaoId)
  if (existente) return existente

  if (mapa.size >= LIMITE_SESSOES_MEMORIA) {
    const primeiraChave = mapa.keys().next().value
    if (primeiraChave) mapa.delete(primeiraChave)
  }

  const novo = criarEstadoInicial(sessaoId)
  mapa.set(sessaoId, novo)
  return novo
}

export function restaurarCenarioSessao(sessaoIdBruto: string, manterContaId?: string): EstadoCenario {
  const sessaoId = normalizarSessaoIdSeguro(sessaoIdBruto)
  const mapa = mapaCenarios()
  const restaurado = criarEstadoInicial(sessaoId)
  if (manterContaId) {
    const conta = CONTAS_DEMONSTRATIVAS.find((item) => item.id === manterContaId)
    if (conta) {
      restaurado.atorAtual = {
        id: conta.id,
        papeis: [...conta.papeis],
        profissionalId: conta.profissionalId,
      }
      restaurado.nomeAtorAtual = conta.nome
      restaurado.emailAtorAtual = conta.email
    }
  }
  mapa.set(sessaoId, restaurado)
  return restaurado
}

export function alternarContaDemonstrativa(
  sessaoId: string,
  contaId: string,
): Resultado<ContaDemonstrativa> {
  if (typeof contaId !== "string" || contaId.trim().length === 0) {
    return falha("entrada_invalida", "Identificador de conta inválido.")
  }

  const estado = obterCenarioSessao(sessaoId)

  // Verifica se é um funcionário e se está ativo antes de permitir alternância para ele
  const funcionario = estado.funcionarios.find((item) => item.id === contaId)
  if (funcionario && !funcionario.ativo) {
    return falha("sem_permissao", "Esta conta de funcionário foi desativada pelo gestor.")
  }

  const conta = CONTAS_DEMONSTRATIVAS.find((item) => item.id === contaId)
  if (conta) {
    estado.atorAtual = {
      id: conta.id,
      papeis: [...conta.papeis],
      profissionalId: conta.profissionalId,
    }
    estado.nomeAtorAtual = conta.nome
    estado.emailAtorAtual = conta.email
    return sucesso(conta)
  }

  const paciente = estado.pacientes.find((item) => item.id === contaId && item.possuiConta)
  if (paciente) {
    estado.atorAtual = {
      id: paciente.id,
      papeis: ["paciente"],
      profissionalId: null,
    }
    estado.nomeAtorAtual = paciente.nome
    estado.emailAtorAtual = paciente.email ?? ""
    return sucesso({
      id: paciente.id,
      rotuloPerfil: "Paciente",
      descricaoCurta: "Conta de paciente criada na demonstração.",
      nome: paciente.nome,
      email: paciente.email ?? "",
      papeis: ["paciente"],
      profissionalId: null,
      rotaInicial: "/paciente",
    })
  }

  if (funcionario && funcionario.ativo) {
    const rotaInicial = funcionario.papeis.includes("gestor")
      ? "/gestor"
      : funcionario.papeis.includes("dentista")
        ? "/dentista"
        : "/recepcao"
    estado.atorAtual = {
      id: funcionario.id,
      papeis: [...funcionario.papeis],
      profissionalId: funcionario.profissionalId,
    }
    estado.nomeAtorAtual = funcionario.nome
    estado.emailAtorAtual = funcionario.email
    return sucesso({
      id: funcionario.id,
      rotuloPerfil: funcionario.papeis.join(" + "),
      descricaoCurta: "Funcionário ativo da clínica.",
      nome: funcionario.nome,
      email: funcionario.email,
      papeis: funcionario.papeis,
      profissionalId: funcionario.profissionalId,
      rotaInicial,
    })
  }

  return falha("entrada_invalida", "Conta demonstrativa não encontrada.")
}

export function autenticarPorEmailDemo(
  sessaoId: string,
  email: unknown,
): Resultado<{ rotaInicial: string; nome: string }> {
  if (typeof email !== "string") {
    return falha("entrada_invalida", "Informe seu e-mail de acesso.")
  }
  const emailNormalizado = email.trim().toLowerCase()
  if (!emailNormalizado || emailNormalizado.length > 160 || !emailNormalizado.includes("@")) {
    return falha("entrada_invalida", "Informe um e-mail de acesso válido.")
  }

  const estado = obterCenarioSessao(sessaoId)
  const taxa = verificarTaxaOperacao(estado)
  if (!taxa.ok) return taxa

  const funcionario = estado.funcionarios.find(
    (item) => item.email.toLowerCase() === emailNormalizado,
  )
  if (funcionario) {
    if (!funcionario.ativo) {
      return falha("sem_permissao", "Esta conta de funcionário está desativada.")
    }
    estado.atorAtual = {
      id: funcionario.id,
      papeis: [...funcionario.papeis],
      profissionalId: funcionario.profissionalId,
    }
    estado.nomeAtorAtual = funcionario.nome
    estado.emailAtorAtual = funcionario.email
    const rotaInicial = funcionario.papeis.includes("gestor")
      ? "/gestor"
      : funcionario.papeis.includes("dentista")
        ? "/dentista"
        : "/recepcao"
    return sucesso({ rotaInicial, nome: funcionario.nome })
  }

  const paciente = estado.pacientes.find(
    (item) => item.email?.toLowerCase() === emailNormalizado && item.possuiConta,
  )
  if (paciente) {
    estado.atorAtual = {
      id: paciente.id,
      papeis: ["paciente"],
      profissionalId: null,
    }
    estado.nomeAtorAtual = paciente.nome
    estado.emailAtorAtual = paciente.email ?? ""
    return sucesso({ rotaInicial: "/paciente", nome: paciente.nome })
  }

  return falha(
    "entrada_invalida",
    "Nenhuma conta ativa encontrada com este e-mail neste ambiente demonstrativo.",
  )
}

export function cadastrarContaPacientePublico(
  sessaoId: string,
  entradaBruta: unknown,
): Resultado<PacienteCadastro> {
  const validado = lerCadastroPacientePublico(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const taxa = verificarTaxaOperacao(estado)
  if (!taxa.ok) return taxa

  const nome = validado.valor.nome
  const email = validado.valor.email.toLowerCase()
  const telefone = validado.valor.telefone

  const emailExistente =
    estado.pacientes.some((p) => p.email?.toLowerCase() === email) ||
    estado.funcionarios.some((f) => f.email.toLowerCase() === email)
  if (emailExistente) {
    return falha("entrada_invalida", "Já existe um cadastro com este e-mail na sessão atual.")
  }

  // Cadastro público cria exclusivamente papel de paciente (AGENTS.md seção 5).
  const papel = papelDoCadastroPublico()
  const agora = new Date()
  const novoPaciente: PacienteCadastro = {
    id: crypto.randomUUID(),
    nome,
    email,
    telefone,
    possuiConta: true,
    criadoEm: agora,
    termosAceitosVersao: DADOS_CLINICA_FICTICIA.versaoTermos,
    termosAceitosEm: agora,
  }

  estado.pacientes.push(novoPaciente)
  estado.atorAtual = {
    id: novoPaciente.id,
    papeis: [papel],
    profissionalId: null,
  }
  estado.nomeAtorAtual = novoPaciente.nome
  estado.emailAtorAtual = email

  return sucesso(novoPaciente)
}

export function atualizarDadosBasicosPaciente(
  sessaoId: string,
  entradaBruta: unknown,
): Resultado<PacienteCadastro> {
  const validado = lerAtualizacaoPaciente(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor
  const ator = checkAtor.valor

  const entrada = validado.valor
  const ehProprioPaciente = ator.papeis.includes("paciente") && ator.id === entrada.pacienteId
  const ehRecepcao = ator.papeis.includes("recepcao")
  if (!ehProprioPaciente && !ehRecepcao) {
    return falha("sem_permissao", "Você não tem permissão para editar os dados deste paciente.")
  }

  const paciente = estado.pacientes.find((p) => p.id === entrada.pacienteId)
  if (!paciente) {
    return falha("entrada_invalida", "Paciente não encontrado.")
  }

  const nome = entrada.nome
  const email = entrada.email.toLowerCase()
  const telefone = entrada.telefone

  if (email.length > 0 && !email.includes("@")) {
    return falha("entrada_invalida", "O e-mail informado é inválido.")
  }

  paciente.nome = nome
  paciente.email = email.length > 0 ? email : null
  paciente.telefone = telefone

  if (ator.id === paciente.id) {
    estado.nomeAtorAtual = paciente.nome
    if (paciente.email) estado.emailAtorAtual = paciente.email
  }

  return sucesso({ ...paciente })
}

export function cadastrarPacientePelaRecepcao(
  sessaoId: string,
  entradaBruta: unknown,
): Resultado<PacienteCadastro> {
  const validado = lerCadastroPacienteRecepcao(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  if (!checkAtor.valor.papeis.includes("recepcao")) {
    return falha("sem_permissao", "Somente a recepção pode cadastrar pacientes operacionais.")
  }

  const nome = validado.valor.nome
  const telefone = validado.valor.telefone
  const email = validado.valor.email?.toLowerCase() || null

  if (email && !email.includes("@")) {
    return falha("entrada_invalida", "E-mail inválido.")
  }

  const novo: PacienteCadastro = {
    id: crypto.randomUUID(),
    nome,
    email,
    telefone,
    possuiConta: false,
    criadoEm: new Date(),
    termosAceitosVersao: null,
    termosAceitosEm: null,
  }
  estado.pacientes.push(novo)
  return sucesso(novo)
}

export function expedienteDoProfissionalParaDia(
  profissional: ProfissionalClinica,
  ano: number,
  mes: number,
  dia: number,
): Intervalo[] {
  if (!profissional.ativo) return []
  const dataUtc = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0))
  if (dataUtc.getUTCDay() === 0) return []

  return [
    {
      inicio: instanteClinica(ano, mes, dia, profissional.aberturaHora, 0),
      fim: instanteClinica(ano, mes, dia, profissional.fechamentoHora, 0),
    },
  ]
}

export function bloqueiosDoProfissionalParaDia(
  estado: EstadoCenario,
  profissional: ProfissionalClinica,
  ano: number,
  mes: number,
  dia: number,
): Intervalo[] {
  const intervaloAlmoco: Intervalo = {
    inicio: instanteClinica(ano, mes, dia, 12, 0),
    fim: instanteClinica(ano, mes, dia, 13, 0),
  }
  const inicioDia = instanteClinica(ano, mes, dia, 0, 0)
  const fimDia = instanteClinica(ano, mes, dia, 23, 59)
  const extras = estado.bloqueios
    .filter(
      (b) =>
        b.profissionalId === profissional.id &&
        intervalosSobrepoem({ inicio: b.inicio, fim: b.fim }, { inicio: inicioDia, fim: fimDia }),
    )
    .map((b) => ({ inicio: new Date(b.inicio), fim: new Date(b.fim) }))

  return [intervaloAlmoco, ...extras]
}

export function consultarHorariosDisponiveisNoDia(
  sessaoId: string,
  entrada: {
    profissionalId: string
    servicoId: string
    dataISO: string
    ignorarAgendamentoId?: string
  },
): Resultado<Date[]> {
  const estado = obterCenarioSessao(sessaoId)
  const dataCivil = lerDataISOClinica(entrada.dataISO)
  if (!dataCivil) {
    return falha("entrada_invalida", "Data informada é inválida.")
  }

  const profissional = estado.profissionais.find((p) => p.id === entrada.profissionalId)
  if (!profissional || !profissional.ativo) {
    return falha("profissional_nao_habilitado", "Profissional não encontrado ou inativo.")
  }

  const servico = estado.servicos.find((s) => s.id === entrada.servicoId)
  if (!servico) {
    return falha("entrada_invalida", "Serviço não encontrado.")
  }

  if (!servico.profissionaisHabilitados.includes(profissional.id)) {
    return falha("profissional_nao_habilitado", "Este profissional não realiza o serviço escolhido.")
  }

  const expediente = expedienteDoProfissionalParaDia(
    profissional,
    dataCivil.ano,
    dataCivil.mes,
    dataCivil.dia,
  )
  const bloqueios = bloqueiosDoProfissionalParaDia(
    estado,
    profissional,
    dataCivil.ano,
    dataCivil.mes,
    dataCivil.dia,
  )
  const ocupadas = estado.consultas
    .filter(
      (c) =>
        c.profissionalId === profissional.id &&
        c.id !== entrada.ignorarAgendamentoId &&
        ocupaAgenda(c.situacao),
    )
    .map((c) => ({ inicio: new Date(c.inicio), fim: new Date(c.fim) }))

  const horarios = horariosDisponiveis({
    duracaoMinutos: servico.duracaoMinutos,
    passoMinutos: 30,
    agora: new Date(),
    expediente,
    bloqueios,
    ocupadas,
  })

  return sucesso(horarios)
}

function criarRepositorioDaSessao(estado: EstadoCenario): AgendaRepositorio {
  return {
    transacao<T>(operacao: (vista: VistaAgenda) => T): Promise<T> {
      const execucao = estado.cadeiaTransacao.then(() => {
        const consultasRascunho = estado.consultas.map(copiarAgendamento)
        const historicoRascunho = estado.historico.map(copiarHistorico)
        const resultado = operacao(criarVista(consultasRascunho, historicoRascunho))
        if (!ehFalhaResultado(resultado)) {
          estado.consultas.splice(0, estado.consultas.length, ...consultasRascunho)
          estado.historico.splice(0, estado.historico.length, ...historicoRascunho)
        }
        return resultado
      })
      estado.cadeiaTransacao = execucao.then(
        () => undefined,
        () => undefined,
      )
      return execucao
    },
  }
}

function criarVista(consultas: Agendamento[], registros: RegistroHistorico[]): VistaAgenda {
  return {
    listarPorProfissional(profissionalId) {
      return consultas
        .filter((c) => c.profissionalId === profissionalId)
        .map(copiarAgendamento)
    },
    obter(id) {
      const encontrada = consultas.find((c) => c.id === id)
      return encontrada ? copiarAgendamento(encontrada) : null
    },
    inserir(consulta, historico) {
      garantirSemConflito(consultas, consulta, null)
      consultas.push(copiarAgendamento(consulta))
      registros.push(copiarHistorico(historico))
    },
    substituir(consulta, historico) {
      const indice = consultas.findIndex((item) => item.id === consulta.id)
      if (indice < 0) {
        throw new Error("Consulta inexistente na substituição.")
      }
      garantirSemConflito(consultas, consulta, consulta.id)
      consultas[indice] = copiarAgendamento(consulta)
      registros.push(copiarHistorico(historico))
    },
  }
}

function garantirSemConflito(
  consultas: readonly Agendamento[],
  consulta: Agendamento,
  ignorarId: string | null,
): void {
  if (!ocupaAgenda(consulta.situacao)) return
  const conflito = consultas.some(
    (existente) =>
      existente.id !== ignorarId &&
      existente.profissionalId === consulta.profissionalId &&
      ocupaAgenda(existente.situacao) &&
      intervalosSobrepoem(existente, consulta),
  )
  if (conflito) {
    throw new Error("Conflito de horário não impedido pela regra.")
  }
}

function ehFalhaResultado(valor: unknown): boolean {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) return false
  return valor.ok === false
}

function copiarAgendamento(consulta: Agendamento): Agendamento {
  return {
    ...consulta,
    inicio: new Date(consulta.inicio),
    fim: new Date(consulta.fim),
  }
}

function copiarHistorico(registro: RegistroHistorico): RegistroHistorico {
  return {
    ...registro,
    momento: new Date(registro.momento),
    horario: registro.horario
      ? {
          inicioAnterior: new Date(registro.horario.inicioAnterior),
          fimAnterior: new Date(registro.horario.fimAnterior),
          inicioNovo: new Date(registro.horario.inicioNovo),
          fimNovo: new Date(registro.horario.fimNovo),
        }
      : null,
  }
}

export async function executarAgendamentoSessao(
  sessaoId: string,
  entradaBruta: unknown,
): Promise<Resultado<Agendamento>> {
  const validado = lerPedidoAgendamento(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor
  const ator = checkAtor.valor

  const taxa = verificarTaxaOperacao(estado)
  if (!taxa.ok) return taxa

  const { pacienteId, profissionalId, servicoId, inicio: inicioISO } = validado.valor

  const pacienteExiste = estado.pacientes.some((p) => p.id === pacienteId)
  if (!pacienteExiste) {
    return falha("entrada_invalida", "Paciente não encontrado no cadastro.")
  }

  const profissional = estado.profissionais.find((p) => p.id === profissionalId)
  if (!profissional || !profissional.ativo) {
    return falha("profissional_nao_habilitado", "Este profissional não está ativo para agendamentos.")
  }

  const servico = estado.servicos.find((s) => s.id === servicoId)
  if (!servico) {
    return falha("entrada_invalida", "Serviço não encontrado.")
  }

  const agora = new Date()
  const inicio = new Date(inicioISO)
  const limiteFuturoMs = agora.getTime() + LIMITE_DIAS_ANTECEDENCIA_RESERVA * 86_400_000
  if (inicio.getTime() > limiteFuturoMs) {
    return falha(
      "entrada_invalida",
      `O agendamento não pode ultrapassar ${LIMITE_DIAS_ANTECEDENCIA_RESERVA} dias de antecedência.`,
    )
  }

  const ehRecepcao = ator.papeis.includes("recepcao")
  if (!ehRecepcao) {
    if (!servico.disponivelParaAutoagendamento) {
      return falha(
        "sem_permissao",
        "Este procedimento especializado é agendado apenas pela recepção após avaliação inicial.",
      )
    }

    // Proteção contra abuso da rota pública (AGENTS.md seção 5, linha 159):
    // limita a quantidade de reservas futuras ativas por paciente no autoagendamento.
    const reservasAtivasDoPaciente = estado.consultas.filter(
      (c) =>
        c.pacienteId === pacienteId &&
        c.inicio >= agora &&
        (c.situacao === "agendado" || c.situacao === "chegou" || c.situacao === "em_atendimento"),
    ).length
    if (reservasAtivasDoPaciente >= LIMITE_RESERVAS_ATIVAS_POR_PACIENTE) {
      return falha(
        "sem_permissao",
        `Você já possui ${LIMITE_RESERVAS_ATIVAS_POR_PACIENTE} consultas futuras ativas. Remarque ou cancele uma consulta existente antes de reservar outro horário.`,
      )
    }
  }

  const relInicio = relogioNoFuso(inicio, FUSO_CLINICA)
  const expediente = expedienteDoProfissionalParaDia(
    profissional,
    relInicio.ano,
    relInicio.mes,
    relInicio.dia,
  )
  const bloqueios = bloqueiosDoProfissionalParaDia(
    estado,
    profissional,
    relInicio.ano,
    relInicio.mes,
    relInicio.dia,
  )

  const repositorio = criarRepositorioDaSessao(estado)
  return agendar(repositorio, {
    ator,
    pacienteId,
    profissionalId,
    servicoId,
    inicio,
    duracaoMinutos: servico.duracaoMinutos,
    agora,
    profissionalHabilitado: servico.profissionaisHabilitados.includes(profissional.id),
    expediente,
    bloqueios,
  })
}

export async function executarRemarcacaoSessao(
  sessaoId: string,
  entradaBruta: unknown,
): Promise<Resultado<Agendamento>> {
  const validado = lerPedidoRemarcacao(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor
  const ator = checkAtor.valor

  const taxa = verificarTaxaOperacao(estado)
  if (!taxa.ok) return taxa

  const consultaAtual = estado.consultas.find((c) => c.id === validado.valor.agendamentoId)
  if (!consultaAtual) {
    return falha("consulta_nao_encontrada", "A consulta não foi encontrada.")
  }

  const profissional = estado.profissionais.find((p) => p.id === consultaAtual.profissionalId)
  const servico = estado.servicos.find((s) => s.id === consultaAtual.servicoId)
  if (!profissional || !servico) {
    return falha("entrada_invalida", "Profissional ou serviço da consulta não encontrado.")
  }

  const agora = new Date()
  const inicioNovo = new Date(validado.valor.inicio)
  const limiteFuturoMs = agora.getTime() + LIMITE_DIAS_ANTECEDENCIA_RESERVA * 86_400_000
  if (inicioNovo.getTime() > limiteFuturoMs) {
    return falha(
      "entrada_invalida",
      `A nova data não pode ultrapassar ${LIMITE_DIAS_ANTECEDENCIA_RESERVA} dias de antecedência.`,
    )
  }

  const relNovo = relogioNoFuso(inicioNovo, FUSO_CLINICA)
  const expediente = expedienteDoProfissionalParaDia(
    profissional,
    relNovo.ano,
    relNovo.mes,
    relNovo.dia,
  )
  const bloqueios = bloqueiosDoProfissionalParaDia(
    estado,
    profissional,
    relNovo.ano,
    relNovo.mes,
    relNovo.dia,
  )

  const repositorio = criarRepositorioDaSessao(estado)
  return remarcar(repositorio, {
    ator,
    agendamentoId: validado.valor.agendamentoId,
    inicio: inicioNovo,
    duracaoMinutos: servico.duracaoMinutos,
    agora,
    profissionalHabilitado:
      profissional.ativo && servico.profissionaisHabilitados.includes(profissional.id),
    expediente,
    bloqueios,
  })
}

export async function executarCancelamentoSessao(
  sessaoId: string,
  entradaBruta: unknown,
): Promise<Resultado<Agendamento>> {
  const validado = lerPedidoCancelamento(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  const repositorio = criarRepositorioDaSessao(estado)
  return alterarSituacao(repositorio, {
    ator: checkAtor.valor,
    agendamentoId: validado.valor.agendamentoId,
    situacao: "cancelado",
    motivo: validado.valor.motivo,
    agora: new Date(),
  })
}

export async function executarMudancaSituacaoSessao(
  sessaoId: string,
  entradaBruta: unknown,
): Promise<Resultado<Agendamento>> {
  const validado = lerPedidoAlterarSituacao(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor
  const ator = checkAtor.valor

  // Se a transição exige papel de dentista, verifica também se o registro do profissional está ativo
  if (
    (validado.valor.situacao === "em_atendimento" || validado.valor.situacao === "concluido") &&
    ator.profissionalId
  ) {
    const prof = estado.profissionais.find((p) => p.id === ator.profissionalId)
    if (!prof || !prof.ativo) {
      return falha("sem_permissao", "Este perfil profissional está desativado.")
    }
  }

  const repositorio = criarRepositorioDaSessao(estado)
  return alterarSituacao(repositorio, {
    ator,
    agendamentoId: validado.valor.agendamentoId,
    situacao: validado.valor.situacao,
    motivo: validado.valor.motivo ?? null,
    agora: new Date(),
  })
}

export async function executarConfirmacaoPresencaSessao(
  sessaoId: string,
  agendamentoIdBruto: unknown,
): Promise<Resultado<Agendamento>> {
  const validado = lerPedidoConfirmarPresenca({ agendamentoId: agendamentoIdBruto })
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  const repositorio = criarRepositorioDaSessao(estado)
  return confirmarPresenca(repositorio, {
    ator: checkAtor.valor,
    agendamentoId: validado.valor.agendamentoId,
    agora: new Date(),
  })
}

export type AgendamentoDetalhado = Agendamento & {
  pacienteNome: string
  pacienteTelefone: string
  profissionalNome: string
  profissionalEspecialidade: string
  servicoNome: string
  duracaoMinutos: number
  historico: RegistroHistorico[]
}

export function listarAgendamentosVisiveis(sessaoId: string): AgendamentoDetalhado[] {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return []
  const atorAtual = checkAtor.valor

  const somentePaciente =
    atorAtual.papeis.length === 1 && atorAtual.papeis[0] === "paciente"

  return estado.consultas
    .filter((consulta) => podeLerAgendamento(atorAtual, consulta))
    .map((consulta) => {
      const paciente = estado.pacientes.find((p) => p.id === consulta.pacienteId)
      const profissional = estado.profissionais.find((p) => p.id === consulta.profissionalId)
      const servico = estado.servicos.find((s) => s.id === consulta.servicoId)
      const historicoConsulta = estado.historico
        .filter((h) => h.agendamentoId === consulta.id)
        .map((h) => {
          const copia = copiarHistorico(h)
          // Minimização de dados (AGENTS.md seção 10): paciente não recebe UUIDs internos de funcionários
          if (somentePaciente && copia.autorId !== atorAtual.id) {
            copia.autorId = "equipe-clinica"
          }
          return copia
        })
        .sort((a, b) => a.momento.getTime() - b.momento.getTime())

      return {
        ...copiarAgendamento(consulta),
        pacienteNome: paciente?.nome ?? "Paciente removido",
        pacienteTelefone: paciente?.telefone ?? "",
        profissionalNome: profissional?.nome ?? "Profissional",
        profissionalEspecialidade: profissional?.especialidade ?? "",
        servicoNome: servico?.nome ?? "Serviço",
        duracaoMinutos: servico?.duracaoMinutos ?? 60,
        historico: historicoConsulta,
      }
    })
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
}

export function convidarFuncionarioSessao(
  sessaoId: string,
  entradaBruta: unknown,
): Resultado<FuncionarioClinica> {
  const validado = lerConviteFuncionario(entradaBruta)
  if (!validado.ok) return validado

  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor
  const atorAtual = checkAtor.valor

  const entrada = validado.valor
  for (const papel of entrada.papeis) {
    if (!podeAtribuirPapel(atorAtual, papel)) {
      return falha(
        "sem_permissao",
        "Você não tem permissão para atribuir este papel ou o papel não é permitido para funcionários.",
      )
    }
  }

  const nome = entrada.nome
  const email = entrada.email.toLowerCase()

  if (
    estado.funcionarios.some((f) => f.email.toLowerCase() === email) ||
    estado.pacientes.some((p) => p.email?.toLowerCase() === email)
  ) {
    return falha("entrada_invalida", "Já existe um cadastro com este e-mail.")
  }

  const funcionarioId = crypto.randomUUID()
  let profissionalId: string | null = null

  if (entrada.papeis.includes("dentista")) {
    profissionalId = crypto.randomUUID()
    estado.profissionais.push({
      id: profissionalId,
      usuarioId: funcionarioId,
      nome,
      especialidade: entrada.especialidade || "Clínica Geral",
      apresentacao: "Profissional convidado pela gestão na demonstração.",
      ativo: true,
      aberturaHora: 8,
      fechamentoHora: 18,
    })
    const avaliacao = estado.servicos[0]
    if (avaliacao && !avaliacao.profissionaisHabilitados.includes(profissionalId)) {
      avaliacao.profissionaisHabilitados.push(profissionalId)
    }
  }

  const novo: FuncionarioClinica = {
    id: funcionarioId,
    nome,
    email,
    papeis: [...new Set(entrada.papeis)],
    profissionalId,
    ativo: true,
    convitePendente: true,
  }
  estado.funcionarios.push(novo)
  return sucesso(novo)
}

export function alterarStatusFuncionarioSessao(
  sessaoId: string,
  entrada: {
    funcionarioId: string
    ativo: boolean
  },
): Resultado<{
  funcionario: FuncionarioClinica
  consultasFuturasAfetadas: AgendamentoDetalhado[]
}> {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor
  const atorAtual = checkAtor.valor

  if (!atorAtual.papeis.includes("gestor")) {
    return falha("sem_permissao", "Somente o gestor pode ativar ou desativar funcionários.")
  }

  const funcionario = estado.funcionarios.find((f) => f.id === entrada.funcionarioId)
  if (!funcionario) {
    return falha("entrada_invalida", "Funcionário não encontrado.")
  }

  if (funcionario.id === atorAtual.id && !entrada.ativo) {
    return falha("entrada_invalida", "Você não pode desativar a própria conta em uso.")
  }

  funcionario.ativo = Boolean(entrada.ativo)
  let afetadasDetalhadas: AgendamentoDetalhado[] = []

  if (funcionario.profissionalId) {
    const profissional = estado.profissionais.find((p) => p.id === funcionario.profissionalId)
    if (profissional) {
      profissional.ativo = Boolean(entrada.ativo)
    }
    if (!entrada.ativo) {
      const afetadas = consultasAfetadasPorDesativacao(
        estado.consultas,
        funcionario.profissionalId,
        new Date(),
      )
      const idsAfetados = new Set(afetadas.map((a) => a.id))
      afetadasDetalhadas = listarAgendamentosVisiveis(sessaoId).filter((a) =>
        idsAfetados.has(a.id),
      )
    }
  }

  return sucesso({
    funcionario: { ...funcionario },
    consultasFuturasAfetadas: afetadasDetalhadas,
  })
}

export function salvarServicoSessao(
  sessaoId: string,
  entrada: {
    nome: string
    descricao: string
    duracaoMinutos: number
    indicacaoPreco: string
    disponivelParaAutoagendamento: boolean
    profissionaisHabilitados: string[]
  },
): Resultado<ServicoClinica> {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  if (!checkAtor.valor.papeis.includes("gestor")) {
    return falha("sem_permissao", "Somente o gestor pode configurar serviços.")
  }

  const nome = typeof entrada.nome === "string" ? entrada.nome.trim() : ""
  const descricao = typeof entrada.descricao === "string" ? entrada.descricao.trim() : ""
  const indicacaoPreco =
    typeof entrada.indicacaoPreco === "string" && entrada.indicacaoPreco.trim().length > 0
      ? entrada.indicacaoPreco.trim().slice(0, 240)
      : "Definido presencialmente após avaliação clínica. Sem cobrança online."

  if (nome.length < 3 || nome.length > 120) {
    return falha("entrada_invalida", "Informe o nome do serviço (entre 3 e 120 caracteres).")
  }
  if (!duracaoAtendimentoValida(entrada.duracaoMinutos) || entrada.duracaoMinutos > 240) {
    return falha("duracao_invalida", "A duração do serviço deve ser um inteiro positivo até 240 minutos.")
  }

  const idsProfissionaisExistentes = new Set(estado.profissionais.map((p) => p.id))
  const habilitadosValidos = Array.isArray(entrada.profissionaisHabilitados)
    ? [...new Set(entrada.profissionaisHabilitados)].filter((id) =>
        idsProfissionaisExistentes.has(id),
      )
    : []

  if (habilitadosValidos.length === 0) {
    return falha("entrada_invalida", "Selecione pelo menos um profissional válido para o serviço.")
  }

  const novo: ServicoClinica = {
    id: crypto.randomUUID(),
    nome,
    descricao: descricao.slice(0, 300) || "Serviço odontológico configurado na clínica.",
    duracaoMinutos: entrada.duracaoMinutos,
    indicacaoPreco,
    disponivelParaAutoagendamento: Boolean(entrada.disponivelParaAutoagendamento),
    profissionaisHabilitados: habilitadosValidos,
  }
  estado.servicos.push(novo)
  return sucesso(novo)
}

export function atualizarExpedienteProfissionalSessao(
  sessaoId: string,
  entrada: {
    profissionalId: string
    aberturaHora: number
    fechamentoHora: number
  },
): Resultado<ProfissionalClinica> {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  if (!checkAtor.valor.papeis.includes("gestor")) {
    return falha("sem_permissao", "Somente o gestor pode alterar o expediente.")
  }

  const profissional = estado.profissionais.find((p) => p.id === entrada.profissionalId)
  if (!profissional) {
    return falha("entrada_invalida", "Profissional não encontrado.")
  }

  if (
    !Number.isInteger(entrada.aberturaHora) ||
    !Number.isInteger(entrada.fechamentoHora) ||
    entrada.aberturaHora < 6 ||
    entrada.fechamentoHora > 22 ||
    entrada.aberturaHora >= entrada.fechamentoHora
  ) {
    return falha(
      "entrada_invalida",
      "Horário de expediente inválido (use horas inteiras entre 06h e 22h, com abertura antes do fechamento).",
    )
  }

  profissional.aberturaHora = entrada.aberturaHora
  profissional.fechamentoHora = entrada.fechamentoHora
  return sucesso({ ...profissional })
}

export function adicionarBloqueioSessao(
  sessaoId: string,
  entrada: {
    profissionalId: string
    dataISO: string
    horaInicio: number
    horaFim: number
    motivo: string
  },
): Resultado<BloqueioClinica> {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  if (!checkAtor.valor.papeis.includes("gestor")) {
    return falha("sem_permissao", "Somente o gestor pode registrar bloqueios de agenda.")
  }

  const dataCivil = lerDataISOClinica(entrada.dataISO)
  if (!dataCivil) {
    return falha("entrada_invalida", "Data do bloqueio inválida.")
  }

  const profissional = estado.profissionais.find((p) => p.id === entrada.profissionalId)
  if (!profissional) {
    return falha("entrada_invalida", "Profissional não encontrado.")
  }

  if (
    !Number.isInteger(entrada.horaInicio) ||
    !Number.isInteger(entrada.horaFim) ||
    entrada.horaInicio < 0 ||
    entrada.horaFim > 23 ||
    entrada.horaInicio >= entrada.horaFim
  ) {
    return falha("entrada_invalida", "Intervalo de horas do bloqueio inválido.")
  }

  const motivoBruto = typeof entrada.motivo === "string" ? entrada.motivo.trim() : ""
  if (motivoBruto.length > 200) {
    return falha("entrada_invalida", "O motivo do bloqueio deve ter no máximo 200 caracteres.")
  }
  const motivo = motivoBruto || "Bloqueio administrativo"

  const novo: BloqueioClinica = {
    id: crypto.randomUUID(),
    profissionalId: profissional.id,
    motivo,
    inicio: instanteClinica(dataCivil.ano, dataCivil.mes, dataCivil.dia, entrada.horaInicio, 0),
    fim: instanteClinica(dataCivil.ano, dataCivil.mes, dataCivil.dia, entrada.horaFim, 0),
  }
  estado.bloqueios.push(novo)
  return sucesso(novo)
}

export function removerBloqueioSessao(
  sessaoId: string,
  bloqueioId: string,
): Resultado<null> {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  if (!checkAtor.valor.papeis.includes("gestor")) {
    return falha("sem_permissao", "Somente o gestor pode remover bloqueios.")
  }

  const idx = estado.bloqueios.findIndex((b) => b.id === bloqueioId)
  if (idx < 0) {
    return falha("entrada_invalida", "Bloqueio não encontrado.")
  }
  estado.bloqueios.splice(idx, 1)
  return sucesso(null)
}

export function obterPainelGestorSessao(
  sessaoId: string,
  filtros: {
    diasPeriodo?: number
    profissionalId?: string
  } = {},
): Resultado<{
  indicadores: Indicadores
  periodoInicio: Date
  periodoFim: Date
  proximasConsultas: AgendamentoDetalhado[]
  consultasProfissionaisInativos: AgendamentoDetalhado[]
  consultasSemConfirmacao: AgendamentoDetalhado[]
}> {
  const estado = obterCenarioSessao(sessaoId)
  const checkAtor = garantirAtorAtivo(estado)
  if (!checkAtor.ok) return checkAtor

  if (!checkAtor.valor.papeis.includes("gestor")) {
    return falha("sem_permissao", "Acesso restrito ao perfil de gestor.")
  }

  const agora = new Date()
  const hojeRel = relogioNoFuso(agora, FUSO_CLINICA)
  const hojeCivil = { ano: hojeRel.ano, mes: hojeRel.mes, dia: hojeRel.dia }

  const dias = filtros.diasPeriodo ?? 7
  const inicioCivil = deslocarDataCivil(hojeCivil, -1)
  const fimCivil = deslocarDataCivil(hojeCivil, dias - 1)

  const periodoInicio = instanteClinica(inicioCivil.ano, inicioCivil.mes, inicioCivil.dia, 0, 0)
  const periodoFim = instanteClinica(fimCivil.ano, fimCivil.mes, fimCivil.dia, 23, 59)

  const profissionaisConsiderados = filtros.profissionalId
    ? estado.profissionais.filter((p) => p.id === filtros.profissionalId)
    : estado.profissionais

  const expedientes: ExpedienteProfissional[] = []
  for (const prof of profissionaisConsiderados) {
    const expLista: Intervalo[] = []
    const bloqLista: Intervalo[] = []
    for (let d = -1; d < dias - 1; d += 1) {
      const dataDia = deslocarDataCivil(hojeCivil, d)
      expLista.push(...expedienteDoProfissionalParaDia(prof, dataDia.ano, dataDia.mes, dataDia.dia))
      bloqLista.push(
        ...bloqueiosDoProfissionalParaDia(estado, prof, dataDia.ano, dataDia.mes, dataDia.dia),
      )
    }
    expedientes.push({
      profissionalId: prof.id,
      expediente: expLista,
      bloqueios: bloqLista,
    })
  }

  const consultasFiltradas = filtros.profissionalId
    ? estado.consultas.filter((c) => c.profissionalId === filtros.profissionalId)
    : estado.consultas

  const indicadores = calcularIndicadores({
    consultas: consultasFiltradas,
    expedientes,
    periodo: { inicio: periodoInicio, fim: periodoFim },
    agora,
  })

  const todasDetalhadas = listarAgendamentosVisiveis(sessaoId)
  const proximasConsultas = todasDetalhadas.filter(
    (c) =>
      c.inicio >= agora &&
      (c.situacao === "agendado" || c.situacao === "chegou" || c.situacao === "em_atendimento") &&
      (!filtros.profissionalId || c.profissionalId === filtros.profissionalId),
  )

  const inativosIds = new Set(estado.profissionais.filter((p) => !p.ativo).map((p) => p.id))
  const consultasProfissionaisInativos = todasDetalhadas.filter(
    (c) =>
      inativosIds.has(c.profissionalId) &&
      c.inicio >= agora &&
      ocupaAgenda(c.situacao),
  )

  const consultasSemConfirmacao = proximasConsultas.filter(
    (c) => c.situacao === "agendado" && !c.presencaConfirmada,
  )

  return sucesso({
    indicadores,
    periodoInicio,
    periodoFim,
    proximasConsultas,
    consultasProfissionaisInativos,
    consultasSemConfirmacao,
  })
}
