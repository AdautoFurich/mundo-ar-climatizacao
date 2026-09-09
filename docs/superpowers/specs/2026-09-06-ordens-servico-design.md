# Especificação — Processo de ordens de serviço

Data: 6 de setembro de 2026

Branch: `feature/ordens-servico`

Base: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`

## 1. Objetivo

Entregar o processo operacional de ordens de serviço da Mundo Ar Climatização, acompanhando cada atendimento desde a entrada do veículo até sua entrega. O módulo integrará os cadastros de clientes, veículos, serviços e usuários, documentará diagnóstico, orçamento e autorização, e fornecerá a base confiável para os relatórios exigidos pelo estágio.

Toda entrada de veículo na oficina deverá gerar uma ordem, mesmo quando o atendimento começar somente como diagnóstico e ainda não houver reparo autorizado.

## 2. Escopo

Incluído:

- Abertura e numeração sequencial de ordens de serviço.
- Registro da entrada do veículo e da reclamação do cliente.
- Definição de um usuário responsável pelo atendimento.
- Diagnóstico técnico.
- Orçamento com serviços do catálogo e peças ou materiais informados manualmente.
- Aprovação ou recusa individual dos itens.
- Registro da resposta do cliente e de seu canal.
- Fluxo controlado de situações até a entrega.
- Desconto controlado pelo administrador.
- Registro simplificado da entrega e da forma de pagamento.
- Histórico auditável das ações relevantes.
- Consulta, pesquisa, filtros e impressão da ordem.
- Layout responsivo, segurança por perfil e testes automatizados.

Fora do escopo:

- Estoque, fornecedores, compras ou movimentação de peças.
- Caixa, contas a pagar, contas a receber ou conciliação.
- Parcelas, cobranças ou integração com meios de pagamento.
- Nota fiscal.
- Assinatura digital.
- Upload de fotografias ou documentos.
- Agendamento prévio.
- Exclusão física de ordens ou de seu histórico.

## 3. Perfis e permissões

| Ação | Administrador | Atendente |
| --- | --- | --- |
| Consultar ordens | Sim | Sim |
| Abrir e editar ordem no fluxo normal | Sim | Sim |
| Registrar diagnóstico e orçamento | Sim | Sim |
| Registrar autorização, execução e entrega | Sim | Sim |
| Conceder ou alterar desconto | Sim | Não |
| Retroceder uma etapa | Sim, com justificativa | Não |
| Reabrir ordem encerrada | Sim, com justificativa | Não |
| Excluir ordem ou histórico | Não | Não |

A interface exibirá apenas as ações permitidas, mas a autorização será novamente verificada no servidor e no banco. Usuários inativos não poderão operar o processo.

Cada ordem terá um usuário ativo como responsável principal. O sistema também registrará automaticamente o usuário que executar cada ação relevante; o responsável principal não substituirá essa autoria individual.

## 4. Fluxo de situações

O fluxo principal será:

`Aberta → Em diagnóstico → Aguardando aprovação → Aprovada → Em execução → Pronta para retirada → Entregue`

Situações alternativas:

- `Reprovada`: o cliente não autorizou nenhum item do orçamento.
- `Cancelada`: o atendimento foi interrompido antes da entrega, com justificativa obrigatória.

Regras de transição:

- A ordem nasce como `Aberta` após o registro válido da entrada.
- O diagnóstico deve ser preenchido antes do envio do orçamento para aprovação.
- A ordem somente ficará `Aprovada` quando houver pelo menos um item autorizado.
- Caso todos os itens sejam recusados, a ordem ficará `Reprovada`.
- Somente itens autorizados poderão entrar em execução e compor o valor final.
- O fluxo normal avançará somente pelas etapas permitidas.
- Apenas o administrador poderá retroceder etapas, sempre com justificativa.
- Ordens `Entregues`, `Reprovadas` ou `Canceladas` ficarão bloqueadas para edição.
- Apenas o administrador poderá reabrir uma ordem bloqueada, informando uma justificativa.
- Toda transição, retrocesso, cancelamento e reabertura será preservado no histórico.

## 5. Registro de entrada

A abertura da ordem conterá:

| Informação | Regra |
| --- | --- |
| Número da OS | Automático, sequencial, único e legível, como `OS #0001` |
| Cliente | Obrigatório e ativo |
| Veículo | Obrigatório, ativo e pertencente ao cliente selecionado |
| Entrada | Data e hora obrigatórias |
| Quilometragem | Obrigatória e não negativa |
| Nível de combustível | Obrigatório, em opções aproximadas predefinidas |
| Relato do cliente | Obrigatório |
| Previsão inicial | Opcional e posterior à entrada |
| Acessórios deixados | Opcional e textual |
| Avarias visíveis | Opcional e textual |
| Observações de entrada | Opcional e textual |
| Responsável | Usuário ativo obrigatório |

Não haverá fotos nem checklist gráfico nesta versão.

## 6. Diagnóstico

O diagnóstico registrará a análise técnica do atendimento, incluindo:

- descrição técnica obrigatória para avançar ao orçamento;
- observações opcionais;
- previsão de conclusão atualizada, quando aplicável;
- data, hora e usuário que registrou ou alterou a análise.

Alterações relevantes serão auditadas. O diagnóstico permanecerá disponível no histórico do veículo depois do encerramento da ordem.

## 7. Orçamento e itens

O orçamento aceitará dois tipos de item:

1. Serviço selecionado do catálogo ativo.
2. Peça ou material informado manualmente, sem controle de estoque.

Cada item guardará:

- tipo;
- referência opcional ao serviço cadastrado;
- descrição copiada no momento da inclusão;
- quantidade;
- valor unitário;
- subtotal calculado;
- situação de autorização;
- dados da decisão do cliente.

A descrição e o preço serão armazenados como uma fotografia histórica. Alterar posteriormente o cadastro ou o valor-base de um serviço não modificará ordens existentes.

Os cálculos serão:

- subtotal dos serviços;
- subtotal das peças e materiais;
- desconto opcional;
- total orçado;
- total autorizado e final.

Valores monetários usarão decimal exato. Quantidades e valores não poderão ser negativos, e o desconto não poderá ultrapassar o total aplicável. Apenas o administrador poderá conceder ou alterar descontos. O atendente poderá montar e atualizar os demais itens do orçamento.

## 8. Aprovação do cliente

Cada item poderá ser `Pendente`, `Aprovado` ou `Recusado`, permitindo aprovação parcial. A resposta registrará:

- decisão;
- canal: WhatsApp, telefone ou presencial;
- data e hora;
- usuário que efetuou o registro;
- observação opcional.

Não haverá anexo de conversa nem assinatura digital na primeira versão. O histórico não será apagado caso uma nova avaliação seja necessária; mudanças posteriores deverão produzir novo registro auditável.

## 9. Execução e entrega

Somente itens aprovados poderão ser marcados como executados. Antes de a ordem ficar `Pronta para retirada`, todos os itens autorizados deverão estar concluídos ou possuir tratamento explícito compatível com as regras do processo.

Na entrega serão registrados:

- data e hora;
- usuário que realizou a entrega;
- forma de pagamento;
- observação final opcional.

Esse registro não representa um módulo financeiro. Não haverá caixa, parcelamento, saldo, recebíveis ou integração de pagamento.

## 10. Modelo de dados conceitual

A persistência será normalizada em entidades relacionadas:

- `ordens_servico`: identificação, vínculos, dados de entrada, responsável, situação, previsões, valores e controle de concorrência;
- `ordens_servico_diagnosticos`: diagnóstico e autoria;
- `ordens_servico_itens`: serviços, peças e materiais com seus snapshots e valores;
- `ordens_servico_aprovacoes`: decisões do cliente por item e seus metadados;
- `ordens_servico_entregas`: encerramento e forma de pagamento;
- `ordens_servico_historico`: eventos, transições, justificativas, autoria e data.

A ordem também preservará os dados essenciais exibidos de cliente e veículo para que documentos históricos não sejam alterados por futuras edições cadastrais. As chaves estrangeiras manterão os relacionamentos para consultas e relatórios.

O número sequencial será gerado atomicamente no banco, impedindo duplicidade mesmo com aberturas simultâneas. Restrições, funções e políticas RLS protegerão invariantes que não podem depender apenas da interface.

## 11. Rotas e interface

| Rota | Finalidade |
| --- | --- |
| `/ordens-servico` | Listagem, pesquisa e filtros |
| `/ordens-servico/nova` | Registro da entrada e abertura |
| `/ordens-servico/[id]` | Visão operacional completa da ordem |
| `/ordens-servico/[id]/imprimir` | Documento preparado para impressão |

### 11.1 Listagem

A lista permitirá:

- pesquisar por número, cliente, veículo ou placa;
- filtrar por situação, responsável e período;
- identificar ordens atrasadas;
- consultar valor, previsão e última atualização;
- paginar resultados;
- distinguir lista vazia de busca sem resultados.

Em computadores, será usada uma tabela. Em telas estreitas, os resultados serão exibidos em cartões sem rolagem horizontal.

### 11.2 Nova ordem

O usuário escolherá primeiro o cliente. O campo de veículo mostrará somente veículos ativos vinculados a ele. O formulário registrará os dados de entrada e impedirá a abertura quando os relacionamentos forem inválidos.

### 11.3 Detalhes

O cabeçalho manterá visíveis número, situação, cliente, veículo, responsável, previsão e valor atual. O restante será organizado nas seções de entrada, diagnóstico, orçamento e autorizações, execução, entrega e histórico.

Os comandos disponíveis mudarão conforme a situação e o perfil do usuário. Confirmações serão exigidas para transições sensíveis, recusas, cancelamentos, retrocessos e reaberturas.

### 11.4 Impressão

A visualização imprimível conterá:

- identificação da oficina e da OS;
- dados do cliente e do veículo;
- entrada, relato e diagnóstico;
- serviços, peças, materiais, autorizações e valores;
- situação e observações relevantes;
- campos para assinatura do cliente e do responsável pela oficina.

O navegador permitirá imprimir ou salvar como PDF. Geração avançada de documentos não faz parte desta versão.

## 12. Validações e consistência

- O veículo deve pertencer ao cliente selecionado.
- Novas ordens só aceitarão clientes, veículos, serviços e responsáveis ativos.
- Quilometragem, quantidades e valores devem respeitar seus limites.
- O desconto não poderá tornar o total negativo nem ultrapassar o limite permitido.
- Apenas itens aprovados entrarão no valor final e na execução.
- Diagnóstico e orçamento deverão cumprir os requisitos antes do avanço de etapa.
- Transições inválidas serão recusadas no servidor e no banco.
- Operações concorrentes não gerarão números repetidos nem atualizações silenciosamente perdidas.
- Identificadores inválidos serão recusados antes de alterações.
- Registros históricos não serão excluídos fisicamente.

Para evitar sobrescrita acidental, atualizações sensíveis verificarão a versão ou a data de atualização conhecida pelo usuário. Caso outra pessoa tenha alterado a ordem, a interface solicitará a recarga dos dados.

## 13. Segurança e auditoria

- Visitantes e usuários inativos não terão acesso às ordens.
- Administradores e atendentes ativos poderão operar apenas as ações autorizadas.
- Descontos, retrocessos, reaberturas e correções protegidas exigirão perfil de administrador.
- O servidor verificará sessão, perfil, situação atual e conteúdo de cada operação.
- O banco aplicará RLS, privilégios e restrições compatíveis.
- Operações comuns não usarão chave administrativa secreta.
- Alterações de situação, diagnóstico, itens, autorizações, desconto e entrega registrarão autoria e momento.
- O histórico será somente de acréscimo para usuários normais.
- Mensagens de erro não revelarão SQL, chaves ou detalhes internos.

## 14. Tratamento de erros

- Erros de campo serão exibidos próximos aos dados inválidos.
- Dados digitados serão preservados em falhas recuperáveis.
- Conflitos de atualização informarão que a ordem foi modificada por outro usuário.
- Tentativas de transição inválida receberão orientação sobre a etapa necessária.
- Falta de autenticação redirecionará ao login.
- Falta de permissão apresentará acesso negado.
- Ordem inexistente apresentará a página de não encontrado.
- Falhas inesperadas usarão mensagens genéricas e seguras.

## 15. Testes e critérios de aceite

Testes unitários cobrirão:

- validações e normalizações dos dados de entrada;
- cálculos de subtotais, desconto, total orçado e total autorizado;
- decisões parciais de aprovação;
- regras e transições da máquina de estados;
- formatação do número, datas, quilometragem e valores.

Testes de componentes cobrirão:

- abertura válida e inválida;
- seleção dependente de cliente e veículo;
- inclusão e edição de serviços, peças e materiais;
- permissões e comandos disponíveis por situação;
- estados vazios, carregamento, erro e conflito;
- representação em tabela e cartões responsivos.

Testes de banco e RLS cobrirão:

- bloqueio de visitantes e usuários inativos;
- operações normais de administrador e atendente;
- desconto, retrocesso e reabertura exclusivos do administrador;
- rejeição de relações, valores e transições inválidas;
- numeração única sob concorrência;
- bloqueio de exclusão e proteção do histórico.

Testes ponta a ponta cobrirão:

- abertura da OS a partir de cliente e veículo existentes;
- diagnóstico, orçamento e aprovação total;
- aprovação parcial e recusa completa;
- execução, preparação para retirada e entrega;
- cancelamento e reabertura administrativa;
- impressão da ordem;
- pesquisa, filtros e identificação de atraso;
- ausência de rolagem horizontal em computador e celular.

A etapa estará concluída quando o fluxo completo funcionar no Supabase de desenvolvimento, as regras forem protegidas em todas as camadas, a suíte automatizada e o build de produção passarem, a impressão estiver utilizável e os testes manuais do usuário confirmarem o processo real da oficina.
