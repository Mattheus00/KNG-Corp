# SGC — Planejamento do case para clínicas odontológicas

Documento inicial para discussão. As funcionalidades abaixo são propostas, não recursos já implementados.

## 1. Objetivo do projeto

Construir uma aplicação web funcional que conecte pacientes, recepção, dentistas e gestão de uma clínica odontológica. O case deve demonstrar capacidade de entender um negócio, desenhar uma experiência acessível e entregar fluxos completos com persistência, permissões e regras reais.

Proposta de valor: facilitar o agendamento, organizar a rotina da equipe e dar visibilidade à operação da clínica.

O futuro portfólio de vocês será um projeto próprio, no qual este produto aparecerá como um case com demonstração, processo, decisões técnicas e resultados verificáveis.

## 2. Premissas para a primeira versão

- Uma plataforma demonstrativa com várias clínicas isoladas por sessão. A Aurora é a clínica de exemplo, com uma unidade e vários profissionais. Cada clínica criada pelo visitante também tem uma única unidade.
- Aplicação web responsiva: paciente principalmente no celular; equipe principalmente no computador.
- Quatro perfis de acesso, com permissões verificadas no servidor.
- Dados fictícios para desenvolvimento, screenshots, vídeo e demonstração pública.
- Agendamento com confirmação imediata ao selecionar um horário disponível.
- Primeira consulta agendada como avaliação; procedimentos especializados podem ser agendados pela equipe.
- Uma aplicação única com módulos bem separados é suficiente para começar.
- Linguagem, framework e hospedagem serão escolhidos considerando o conhecimento da equipe, custos e necessidades, antes da implementação.

## 3. Perfis e responsabilidades

| Perfil | Experiência principal | Limites de acesso |
| --- | --- | --- |
| Paciente | Criar conta, agendar avaliação, consultar próximos horários, cancelar ou remarcar e editar dados básicos | Apenas seus próprios dados e agendamentos |
| Recepção | Consultar agenda da clínica, cadastrar pacientes, agendar, confirmar presença e registrar chegada | Dados operacionais necessários; sem gestão de permissões ou acesso a anotações clínicas privadas |
| Dentista | Consultar sua agenda e iniciar/finalizar atendimentos | Atendimentos e pacientes sob sua responsabilidade; não administra equipe ou finanças gerais |
| Gestor | Acompanhar indicadores, configurar serviços e horários, convidar funcionários e atribuir perfis | Acesso gerencial não implica acesso automático a todo conteúdo clínico |

Uma mesma pessoa pode acumular papéis, por exemplo gestor e dentista. As permissões devem ser explícitas. O cadastro público cria somente contas de pacientes; funcionários entram por convite autorizado.

## 4. Primeira versão: MVP demonstrável

### Site da clínica fictícia

- Página inicial com identidade visual, apresentação, serviços, equipe, localização e contatos fictícios claramente identificados.
- Botão de agendamento e acesso ao portal do paciente.
- Conteúdo e navegação adaptados ao celular.
- Identificação visível de ambiente demonstrativo.

### Portal do paciente

- Cadastro, login e recuperação de acesso.
- Escolha da avaliação, profissional quando aplicável, data e horário disponível.
- Resumo antes da confirmação e comprovante dentro da aplicação.
- Lista de consultas futuras e anteriores, sem expor prontuário clínico nesta etapa.
- Cancelamento e remarcação conforme a política configurada da clínica.
- Atualização de dados básicos de contato.

### Operação da clínica

- Agenda diária e semanal com filtros por profissional e situação.
- Cadastro e busca de pacientes; cadastro pela recepção para quem ainda não possui conta.
- Agendamento manual para contatos recebidos por telefone ou presencialmente.
- Registro de confirmação de presença, chegada, início e conclusão do atendimento.
- Registro de falta e cancelamento.
- Cadastro de serviços com duração e profissionais habilitados.
- Configuração de expediente, intervalos, férias e bloqueios.
- Consulta ao histórico operacional de alterações de um agendamento.

### Gestão

- Convites, ativação e desativação de funcionários, com atribuição de papéis.
- Dashboard calculado a partir dos agendamentos cadastrados.
- Consultas do dia, concluídas, canceladas e faltas, com filtros por período e profissional.
- Ocupação da agenda e distribuição de atendimentos por serviço.
- Lista de próximas consultas e alertas operacionais, como horários vagos.

### Qualidade mínima de entrega

- Dados persistentes: atualizar a página não perde alterações.
- Telas de carregamento, vazio, sucesso e erro.
- Formulários utilizáveis por teclado, campos identificados e erros claros.
- Experiência responsiva e apresentação consistente entre módulos.
- Validações no servidor e testes dos fluxos de maior risco.
- Demonstração com dados e credenciais próprios, sem informações reais de pacientes.

## 5. Regras que tornam o case funcional

1. O horário deve respeitar expediente, bloqueios e duração do serviço.
2. Um profissional não pode receber consultas sobrepostas. A confirmação deve proteger contra duas pessoas reservando o mesmo horário simultaneamente; esconder o horário na interface não basta.
3. A remarcação deve preservar o agendamento original se a nova reserva falhar.
4. Não permitir agendamento no passado. Definir o fuso da clínica e apresentar horários de forma consistente.
5. Fluxo principal: agendado → chegou → em atendimento → concluído. Cancelado e falta são desfechos alternativos, com transições permitidas por papel.
6. Confirmação de presença é uma informação separada do andamento do atendimento.
7. Ao cancelar ou remarcar, registrar autor, data, situação anterior e motivo quando aplicável.
8. Desativar um profissional com consultas futuras exige listar os agendamentos afetados e encaminhar sua remarcação; não apagar o histórico.
9. O paciente não pode acessar dados de outro paciente alterando um endereço ou identificador.
10. Bloquear ações sem permissão também no servidor, independentemente dos botões exibidos.
11. Definir como vincular uma conta criada pelo paciente a um cadastro prévio da recepção, com verificação de identidade; não vincular apenas pelo nome.
12. Se a clínica tiver limitação por cadeira ou sala, incluir esse recurso na disponibilidade. Até essa extensão, assumir explicitamente que há capacidade física para todos os profissionais simultaneamente.

## 6. Dashboard: indicadores com significado

| Indicador | Definição proposta |
| --- | --- |
| Consultas previstas | Consultas marcadas para o período, separadas por situação |
| Atendimentos concluídos | Consultas com situação concluída no período selecionado |
| Taxa de faltas | Faltas ÷ (concluídas + faltas), considerando a data prevista da consulta; não incluir consultas futuras |
| Ocupação planejada | Minutos reservados em consultas não canceladas ÷ minutos de expediente disponíveis após bloqueios |
| Cancelamentos | Quantidade e motivos de consultas canceladas no período, com critério de data explícito |
| Distribuição por serviço | Quantidade de consultas por serviço, com situação e período informados |

Quando o denominador for zero, mostrar “sem dados”, não uma porcentagem enganosa. Para ocupação por vários profissionais, somar os minutos disponíveis de todos eles. Explicar que ocupação planejada não equivale a atendimento realizado.

Faturamento fica para a etapa financeira: preço de procedimento agendado não deve ser apresentado como dinheiro recebido.

## 7. Evoluções depois do MVP

### Etapa 2 — Eficiência operacional

- Lembretes por e-mail e, depois, integração de mensagens com provedor adequado.
- Fila de espera com oferta de horários liberados e prazo para aceite.
- Agendamento recorrente de retornos, com validação de cada horário.
- Controle de cadeiras e salas compartilhadas.
- Indicadores de antecedência de agendamento e motivos de cancelamento.
- Preferências e registro das comunicações enviadas.

Para a demonstração, começar com uma caixa de notificações simuladas que permita ver o conteúdo e a situação do envio sem disparar mensagens reais.

### Etapa 3 — Gestão financeira

- Orçamentos e planos de tratamento com itens e situações.
- Registro de pagamentos, parcelas e contas a receber.
- Separação entre valor orçado, contratado, recebido e em aberto.
- Relatórios por período e exportação de dados permitidos ao perfil.
- Pagamentos online apenas após definir o fluxo, o provedor e o tratamento de falhas e estornos.

### Etapa 4 — Rotina clínica

- Anamnese, odontograma, histórico de evolução e anexos.
- Plano de tratamento por paciente.
- Permissões específicas para conteúdo clínico e trilha de acesso.

Esta etapa exige descoberta com profissionais e revisão específica dos requisitos de privacidade, guarda de documentos e operação antes do uso com pacientes reais. O MVP não se apresenta como prontuário eletrônico completo.

### Etapa 5 — Expansão

- Múltiplas unidades e, se houver intenção de comercializar como serviço, isolamento entre clínicas.
- Estoque de materiais e alertas de reposição.
- Integrações externas e relatórios avançados.
- Personalização da marca por clínica.

Não incluir inicialmente aplicativo nativo, convênios complexos, emissão fiscal ou inteligência artificial para diagnóstico. Cada um amplia bastante o escopo e não é necessário para demonstrar o fluxo principal.

## 8. Ordem de implementação e critérios de conclusão

| Entrega | Trabalho principal | Como saber que está pronta |
| --- | --- | --- |
| 1. Definição e experiência | Validar regras, mapear telas e criar protótipo navegável | É possível explicar o percurso de cada perfil e as regras de agendamento |
| 2. Fundação e acesso | Configurar projeto, autenticação, papéis, navegação e dados fictícios | Cada perfil acessa apenas suas ações e dados permitidos |
| 3. Agendamento completo | Configurar disponibilidade e implementar reserva, cancelamento e remarcação | Paciente agenda e recepção vê a mesma consulta; reservas concorrentes não duplicam o horário |
| 4. Rotina da equipe | Agenda operacional, chegada, atendimento, faltas e gestão de funcionários | Uma consulta atravessa o ciclo completo, com histórico de alterações |
| 5. Visão gerencial | Implementar indicadores e filtros | Números do painel conferem com os registros que os originam |
| 6. Publicação do case | Revisão visual, testes, ambiente de demonstração e documentação | Outra pessoa consegue explorar os três fluxos de demonstração sem ajuda |

Não fixar prazo sem conhecer tamanho da equipe, experiência e horas disponíveis. Dividir cada entrega em tarefas pequenas e revisar esforço após a primeira entrega funcional.

## 9. Backlog inicial sugerido

- P0 — Definir serviços, duração, horários e política de cancelamento da clínica fictícia.
- P0 — Desenhar os fluxos de paciente, recepção, dentista e gestor.
- P0 — Implementar autenticação, convites e autorização por papel.
- P0 — Configurar profissionais, disponibilidade e bloqueios.
- P0 — Implementar reserva protegida contra conflitos simultâneos.
- P0 — Implementar lista de consultas, cancelamento e remarcação do paciente.
- P0 — Implementar agenda e situações operacionais da equipe.
- P0 — Implementar painel com indicadores calculados dos dados reais da aplicação.
- P0 — Criar dados fictícios, acesso demonstrativo e roteiro de apresentação.
- P1 — Notificações simuladas, depois integração real de lembretes.
- P1 — Fila de espera e controle de recursos físicos.
- P2 — Financeiro, planos de tratamento e documentação clínica.

P0 compõe a primeira entrega; P1 e P2 são evoluções. Segurança, autorização e consistência da reserva fazem parte do P0.

## 10. Verificações prioritárias

- Dois usuários tentam reservar o mesmo profissional e horário: somente uma reserva é concluída.
- Paciente tenta consultar ou alterar uma consulta de outra pessoa: acesso negado.
- Recepção tenta conceder papel de gestor: acesso negado.
- Serviço de 60 minutos não cabe em uma janela livre de 30 minutos: horário não ofertado.
- Nova reserva falha durante remarcação: consulta antiga permanece válida.
- Cancelamento libera a disponibilidade correspondente e mantém o histórico.
- Dashboard com base de dados conhecida apresenta totais e taxas esperados.
- Fluxo principal funciona no celular e por teclado.

## 11. Como apresentar no portfólio

### Demonstração de aproximadamente cinco minutos

1. Mostrar o problema: agendamentos dispersos e dificuldade de acompanhar a operação.
2. Entrar como paciente e reservar uma avaliação pelo celular.
3. Entrar como recepção e visualizar a nova consulta na agenda.
4. Registrar chegada e, no perfil de dentista, concluir o atendimento.
5. Entrar como gestor e mostrar os indicadores refletindo a operação.
6. Demonstrar uma regra real: conflito de horário, bloqueio ou permissão de acesso.

### Materiais do case

- Aplicação publicada com identificação clara de demonstração.
- Contas demonstrativas por perfil ou entrada guiada em ambientes isolados.
- Dados fictícios reproduzíveis e mecanismo de restauração controlado.
- Sessões isoladas para visitantes não alterarem o cenário uns dos outros.
- README com problema, escopo implementado, instalação, configuração, decisões e testes.
- Screenshots do celular, agenda da equipe e dashboard.
- Vídeo curto do fluxo completo.
- Página de case explicando contexto, participação de cada integrante, decisões e evolução.

Resultados devem distinguir evidência de hipótese: “impede reserva simultânea do mesmo horário” pode ser demonstrado; “reduz faltas em 40%” exige dados reais. Não atribuir depoimentos ou resultados comerciais a clientes inexistentes.

### Estrutura do futuro site de vocês

- Início: proposta de valor e tipo de solução que desenvolvem.
- Projetos: imagem, problema resolvido, participação e link para cada case.
- Página do SGC: desafio, solução, fluxos, decisões e demonstração.
- Sobre: equipe, responsabilidades e forma de trabalho.
- Contato: caminho claro para conversar sobre um projeto.

O site da clínica fictícia integra o produto; o portfólio apresenta o trabalho de vocês. Ambos podem compartilhar aprendizado visual, mas têm públicos e objetivos próprios.

## 12. Próximas decisões

1. Quem desenvolverá e quais linguagens a equipe já domina?
2. Quantas horas por semana estarão disponíveis?
3. O primeiro objetivo é somente demonstração ou já existe uma clínica interessada em testar?
4. Qual será a identidade da clínica fictícia?
5. Há alguma tecnologia exigida por estudo, trabalho ou hospedagem?

Próxima ação recomendada: validar o escopo P0 e desenhar as telas do fluxo paciente → recepção → dentista → gestor antes de iniciar módulos adicionais.
