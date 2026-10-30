# SGC — Sistema de Gestão de Clínicas (`Aurora Clínica Odontológica`)

WebApp responsivo e acessível para gestão de clínica odontológica (**MVP / P0**), desenvolvido com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4** e **Zod 4** em um monorepo `pnpm` (`@sgc/backend` + `@sgc/frontend`).

---

## 1. Como executar o projeto localmente

### Pré-requisitos
- **Node.js** 20+ (com `corepack` habilitado)
- **pnpm** `10.x` ou `11.x`

### Passo a passo

1. **Instalar as dependências na raiz do monorepo:**
   ```bash
   pnpm install
   ```
   *(Caso utilize o Corepack no Windows: `corepack pnpm install`)*

2. **Iniciar o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

3. **Acessar no navegador:**
   Abra [http://localhost:3000](http://localhost:3000).

---

## 2. Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o WebApp Next.js em modo de desenvolvimento (`http://localhost:3000`) |
| `pnpm build` | Gera o build de produção do frontend e valida rotas/tipos |
| `pnpm typecheck` | Executa a verificação estrita do TypeScript em `@sgc/backend` e `@sgc/frontend` |
| `pnpm test` | Executa a suíte de testes de domínio, cenário e segurança com Vitest |
| `pnpm test:e2e` | Executa os testes ponta a ponta (Playwright) das jornadas e permissões |

---

## 3. Como testar os 4 perfis na demonstração

Cada visitante recebe uma **sessão demonstrativa isolada** via cookie `HttpOnly` (`sgc_sessao_id`). A barra superior fixa permite alternar em **1 clique** no seletor **`Visão:`** ou restaurar os dados originais clicando em **`↺ Resetar`**:

1. **Paciente (`Mariana Costa` — `/paciente`)**
   - Autoagendamento em 3 passos (procedimento → especialista e data → horário disponível) com resumo e comprovante imediato.
   - Consulta de agendamentos futuros e histórico, remarcação atômica, cancelamento com motivo e atualização de dados cadastrais.
2. **Recepção (`Carlos Eduardo Moura` — `/recepcao`)**
   - Painel operacional da agenda da clínica com filtros rápidos por situação, profissional e busca textual.
   - Confirmação de presença, registro de chegada (`Na recepção`), remarcação, cancelamento, registro de falta, histórico de alterações auditável e cadastro de pacientes.
3. **Dentista (`Dra. Helena Martins` / `Dr. Rafael Albuquerque` — `/dentista`)**
   - Destaque imediato para pacientes aguardando chamada na recepção ou em atendimento na cadeira.
   - Início e conclusão de atendimento em 1 clique e acesso restrito exclusivamente à própria agenda e aos pacientes sob sua responsabilidade (RBAC).
4. **Gestor (`Roberto Vasconcelos` — `/gestor`)**
   - **Indicadores**: consultas previstas, atendimentos concluídos, taxa de faltas, ocupação planejada, cancelamentos por motivo, distribuição por procedimento e alertas da agenda.
   - **Equipe**: convite de funcionários, atribuição cumulativa de papéis e ativação/desativação imediata com sinalização de consultas futuras afetadas.
   - **Serviços**: cadastro de procedimentos, duração, indicação transparente de valor e habilitação para autoagendamento.
   - **Expediente**: configuração de horário de abertura/fechamento por especialista e bloqueios de agenda.

---

## 4. Estrutura do monorepo

```text
SGC/
├── AGENTS.md                 # Diretrizes técnicas, escopo, segurança, acessibilidade e Git
├── PLANEJAMENTO-SGC.md       # Especificação funcional detalhada do produto
├── README.md                 # Instruções de execução e uso
├── .env.example              # Exemplo de variáveis de ambiente (sem segredos)
├── backend/                  # @sgc/backend — domínio, serviços, validações Zod e dados isolados por sessão
│   ├── src/
│   │   ├── auth/             # Verificação de sessão, papéis (RBAC) e escopo por registro
│   │   ├── data/             # Cenário demonstrativo isolado por sessão (LRU/TTL)
│   │   ├── domain/           # Disponibilidade, situações de atendimento e cálculo de indicadores
│   │   ├── services/         # Casos de uso (agendamentos, remarcação atômica, simular banco)
│   │   └── validation/       # Esquemas Zod compartilhados e validação estrita no servidor
│   └── tests/                # 9 suítes Vitest (regras de negócio, concorrência e segurança)
└── frontend/                 # @sgc/frontend — WebApp Next.js (App Router)
    ├── src/
    │   ├── app/              # Rotas (/ , /paciente, /recepcao, /dentista, /gestor, /acesso, /privacidade, /termos) e Server Actions
    │   ├── components/       # Componentes de interface do WebApp
    │   └── lib/              # Sessão HttpOnly e formatadores no fuso America/Sao_Paulo
    └── e2e/                  # Testes Playwright
```

---

## 5. Segurança e conformidade (MVP)

- **Autorização (RBAC) no servidor**: todas as operações validam sessão ativa e permissões no backend; contas desativadas têm acesso revogado imediatamente.
- **Prevenção de escalação de privilégio e enumeração**: pacientes não podem alterar a situação de consultas para estados clínicos exclusivos da equipe; o cadastro público atribui apenas o papel `paciente`.
- **Minimização de dados (LGPD)**: coleta restrita a nome, e-mail e telefone operacional; UUIDs internos de funcionários são anonimizados na visão do paciente.
- **Isolamento e limites de memória**: sessões demonstrativas isoladas por UUID v4 com expiração (TTL) e teto de sessões em memória (LRU), protegidas por cabeçalhos HTTP (`CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
