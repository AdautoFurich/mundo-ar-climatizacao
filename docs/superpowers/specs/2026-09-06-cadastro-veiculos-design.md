# Especificação — Cadastro de veículos

Data: 6 de setembro de 2026
Branch: `feature/cadastro-veiculos`
Base: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`

## 1. Objetivo

Entregar o segundo cadastro operacional da Mundo Ar Climatização. O módulo permitirá cadastrar, consultar, pesquisar, editar, transferir, inativar e reativar carros e utilitários com placa, vinculando cada veículo ao seu proprietário atual sem perder os atendimentos realizados por proprietários anteriores.

O cadastro também fornecerá a base para as futuras ordens de serviço e para o relatório de histórico de manutenção por veículo.

## 2. Escopo

Incluído:

- Cadastro de carros e utilitários com placa.
- Vínculo obrigatório com um cliente ativo.
- Placa obrigatória, normalizada e única em todo o sistema.
- Marca, modelo, ano de fabricação e ano do modelo obrigatórios.
- Cor, combustível e observações opcionais.
- Listagem paginada, busca e filtro por situação.
- Inclusão, detalhe, edição, inativação e reativação.
- Transferência para outro cliente com histórico do proprietário anterior e do novo proprietário.
- Exibição dos veículos vinculados na página de detalhes do cliente.
- Políticas RLS e validação no servidor.
- Testes unitários, de componentes, RLS e ponta a ponta.

Fora do escopo:

- Caminhões, máquinas agrícolas e veículos sem placa.
- Exclusão física de veículos.
- Armazenamento de documentos ou fotografias.
- Consulta automática de dados pela placa.
- RENAVAM e chassi.
- Controle manual de uma quilometragem atual no cadastro.
- Histórico de ordens de serviço, que será entregue com o módulo de ordens.

## 3. Permissões

| Perfil | Consultar | Cadastrar | Editar | Transferir | Inativar/reativar |
| --- | --- | --- | --- | --- | --- |
| Administrador | Sim | Sim | Sim | Sim | Sim |
| Atendente | Sim | Sim | Sim | Sim | Sim |

A interface refletirá as permissões. Toda operação será novamente autorizada no servidor e pelas políticas RLS.

## 4. Modelo de dados

### 4.1 Veículos

A tabela pública `veiculos` terá:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID | Chave primária gerada automaticamente |
| `cliente_id` | UUID | Proprietário atual; referência obrigatória a `clientes` |
| `placa` | Texto | Obrigatória, normalizada e única |
| `marca` | Texto | Obrigatória |
| `modelo` | Texto | Obrigatório |
| `ano_fabricacao` | Inteiro | Obrigatório e validado |
| `ano_modelo` | Inteiro | Obrigatório; igual ou até um ano posterior ao ano de fabricação |
| `cor` | Texto | Opcional |
| `combustivel` | Texto | Opcional; valor controlado pela aplicação |
| `observacoes` | Texto | Opcional |
| `ativo` | Booleano | Padrão verdadeiro |
| `criado_em` | Data e hora | Gerada automaticamente |
| `atualizado_em` | Data e hora | Atualizada automaticamente |

A placa será armazenada somente com letras e números em maiúsculas. A restrição única abrangerá veículos ativos e inativos para impedir que o mesmo veículo tenha cadastros e históricos fragmentados.

### 4.2 Histórico de proprietários

A tabela pública `historico_proprietarios_veiculos` terá:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID | Chave primária gerada automaticamente |
| `veiculo_id` | UUID | Veículo transferido |
| `cliente_anterior_id` | UUID | Proprietário antes da transferência |
| `cliente_novo_id` | UUID | Proprietário depois da transferência |
| `usuario_id` | UUID | Funcionário que realizou a transferência |
| `transferido_em` | Data e hora | Gerada automaticamente |

A troca do proprietário atual e a gravação do histórico ocorrerão na mesma transação. Não haverá registro de histórico durante a criação inicial, pois o primeiro proprietário estará representado pelo próprio cadastro e sua data de criação.

### 4.3 Quilometragem

A quilometragem será registrada em cada ordem de serviço, e não como um campo editável do veículo. Quando o módulo de ordens existir, a tela de detalhes mostrará automaticamente a quilometragem do atendimento mais recente e o histórico por ordem.

## 5. Regras de negócio

- Um cliente pode possuir vários veículos.
- Cada veículo possui somente um proprietário atual.
- Apenas clientes ativos podem receber um cadastro novo ou uma transferência.
- A transferência para o próprio proprietário atual não gera alteração nem histórico.
- Ordens antigas manterão seus próprios `cliente_id` e `veiculo_id`; por isso, uma transferência não mudará o cliente de atendimentos anteriores.
- Veículos não serão excluídos fisicamente, somente inativados.
- A inativação não remove nem modifica relacionamentos históricos.
- Quando as ordens de serviço forem implementadas, transferência e inativação serão bloqueadas enquanto existir uma ordem do veículo em andamento.
- A reativação manterá a placa e o proprietário atual.
- Alterações comuns, como cor ou observações, não gerarão registros no histórico de proprietários.

## 6. Organização do código

- `src/features/veiculos/schemas.ts`: normalização e validação.
- `src/features/veiculos/queries.ts`: leitura, busca, filtros, paginação, detalhe e histórico.
- `src/features/veiculos/actions.ts`: inclusão, edição, transferência, inativação e reativação.
- `src/features/veiculos/components/`: listagem, formulários, detalhes e confirmações.
- `src/app/(sistema)/veiculos/`: páginas do módulo.
- `supabase/migrations/*_create_vehicles.sql`: tabelas, índices, funções, gatilhos e RLS.
- `src/types/database.ts`: tipos do banco.

## 7. Rotas e interface

| Rota | Finalidade |
| --- | --- |
| `/veiculos` | Listagem, busca, filtro e paginação |
| `/veiculos/novo` | Inclusão com seleção do proprietário |
| `/veiculos/[id]` | Consulta detalhada e histórico de proprietários |
| `/veiculos/[id]/editar` | Edição dos dados cadastrais |

### 7.1 Listagem

- Total de resultados e ação “Novo veículo”.
- Busca por placa, marca, modelo ou proprietário.
- Filtro por veículos ativos, inativos ou todos.
- Tabela com placa, marca/modelo, ano, proprietário, situação e ações.
- Paginação por parâmetros da URL.
- Estados vazio e sem resultados.
- Em telas estreitas, cartões substituem a tabela para evitar rolagem horizontal.

### 7.2 Formulário

O formulário será dividido em:

1. Proprietário: busca e seleção de cliente ativo.
2. Identificação: placa, marca e modelo.
3. Características: anos de fabricação e modelo, cor e combustível.
4. Informações adicionais: observações.

A placa terá máscara somente visual. O servidor normalizará todos os campos antes de validar e gravar. Haverá rótulos visíveis, mensagens próximas aos campos e foco no primeiro erro.

### 7.3 Detalhes

A página mostrará dados completos, situação, proprietário atual e ações permitidas. O histórico de proprietários exibirá proprietário anterior, novo proprietário, funcionário responsável e data da transferência.

A ação “Transferir proprietário” abrirá um formulário específico, exigirá outro cliente ativo e apresentará uma confirmação antes da operação.

Quando as ordens forem implementadas, esta página também mostrará a quilometragem mais recente e o histórico de manutenção.

### 7.4 Integração com clientes

A área “Veículos do cliente”, já reservada na página de detalhes do cliente, passará a listar os veículos atualmente vinculados. A ação “Cadastrar veículo para este cliente” abrirá o formulário com o proprietário previamente selecionado.

## 8. Fluxos

### 8.1 Inclusão

1. Usuário autorizado abre `/veiculos/novo`, opcionalmente a partir de um cliente.
2. Seleciona um cliente ativo e informa os dados do veículo.
3. A interface valida para oferecer retorno imediato.
4. A Server Action revalida sessão, perfil, cliente e dados.
5. O Supabase grava o veículo conforme o RLS.
6. O sistema abre o detalhe com uma confirmação.

### 8.2 Edição

1. Usuário abre `/veiculos/[id]/editar`.
2. O servidor carrega os dados atuais.
3. A Server Action revalida sessão, permissão e conteúdo.
4. Somente os dados do veículo são atualizados; o proprietário não será alterado pelo formulário comum.

### 8.3 Transferência

1. Usuário solicita a transferência na página de detalhes.
2. Seleciona outro cliente ativo e confirma a operação.
3. O servidor revalida sessão, permissão, veículo e clientes.
4. Uma função transacional atualiza `veiculos.cliente_id` e insere o histórico.
5. Lista, detalhe do veículo e páginas dos dois clientes são revalidados.

### 8.4 Situação

1. Usuário solicita inativação ou reativação.
2. A interface exige confirmação.
3. A Server Action revalida usuário e estado atual.
4. O campo `ativo` é alterado sem excluir o veículo.
5. Lista e detalhe são revalidados.

Envios duplicados serão impedidos por estados pendentes e controles desabilitados.

## 9. Validação

- Proprietário: obrigatório, existente e ativo.
- Placa: obrigatória, aceita os formatos brasileiros antigo e Mercosul, armazenada sem separadores e em maiúsculas.
- Marca e modelo: obrigatórios, aparados e com espaços internos normalizados.
- Ano de fabricação: inteiro de 1900 até o ano corrente mais um.
- Ano do modelo: igual ao ano de fabricação ou um ano posterior.
- Cor: opcional e limitada.
- Combustível: opcional; gasolina, etanol, flex, diesel, elétrico ou híbrido.
- Observações: opcionais e limitadas.
- Placa duplicada: mensagem específica, sem detalhes internos.

O limite superior dos anos acompanhará o ano corrente mais um, permitindo o cadastro antecipado de modelos do ano seguinte. O ano do modelo também deverá respeitar esse limite superior. Os esquemas Zod serão reutilizados na interface e nas Server Actions quando aplicável.

## 10. Segurança e RLS

- Usuários ativos dos perfis administrador e atendente podem consultar veículos e históricos.
- Administrador e atendente ativos podem inserir e atualizar veículos.
- O histórico não poderá ser inserido diretamente pela API comum; será gravado pela função transacional de transferência.
- Nenhum usuário autenticado poderá excluir veículos ou históricos pela API comum.
- As políticas consultarão `perfis_usuarios`.
- Operações normais não usarão a chave administrativa secreta.
- A interface nunca receberá chaves secretas.

## 11. Tratamento de erros

- Erros de campo aparecem junto ao dado inválido.
- Dados digitados são preservados em falhas esperadas.
- Placa duplicada recebe uma mensagem orientativa.
- Cliente inexistente ou inativo impede cadastro e transferência.
- Veículo inexistente apresenta estado de não encontrado.
- Falta de autenticação redireciona ao login.
- Falta de permissão apresenta acesso negado.
- Falhas inesperadas não mostram SQL, chaves, tokens ou dados técnicos.

## 12. Testes e critérios de aceite

Testes unitários:

- Placas antigas e Mercosul válidas, inválidas e normalizadas.
- Regras dos anos de fabricação e modelo.
- Campos obrigatórios, opcionais e limites.

Testes de componentes:

- Formulário válido e inválido, mensagens e estado pendente.
- Listagem preenchida, vazia e sem resultados.
- Confirmações de transferência, inativação e reativação.

Testes de RLS e banco:

- Administrador e atendente consultam e gerenciam veículos.
- Exclusão física é bloqueada.
- Placa duplicada é rejeitada, inclusive se o registro existente estiver inativo.
- Transferência atualiza o proprietário e grava exatamente um registro histórico.
- Falha na transferência não deixa atualização parcial.

Testes ponta a ponta:

- Cadastro, busca, edição, transferência, inativação e reativação.
- Exibição dos veículos na página do cliente.
- Layout sem rolagem horizontal em desktop e celular.

A etapa estará concluída quando todas as operações funcionarem com o Supabase de desenvolvimento, o histórico de transferências for consistente, as permissões forem respeitadas, a suíte passar e nenhum segredo ou dado temporário permanecer versionado.
