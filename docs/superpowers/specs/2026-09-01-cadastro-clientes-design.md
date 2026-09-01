# Especificação — Cadastro de clientes

Data: 1º de setembro de 2026  
Branch: `feature/cadastro-clientes`  
Base: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`

## 1. Objetivo

Entregar o primeiro cadastro operacional completo da Mundo Ar Climatização e estabelecer um padrão reutilizável para veículos e serviços. O módulo permitirá cadastrar, consultar, pesquisar, editar, inativar e reativar clientes pessoas físicas, respeitando os perfis administrador, atendente e técnico.

## 2. Escopo

Incluído:

- Cadastro exclusivo de pessoas físicas.
- CPF obrigatório, válido e único.
- Nome completo e telefone principal obrigatórios.
- Telefone alternativo e e-mail opcionais.
- Endereço estruturado.
- Observações.
- Listagem paginada, busca e filtro por situação.
- Inclusão, detalhe, edição, inativação e reativação.
- Área reservada para os futuros veículos vinculados.
- Políticas RLS e validação no servidor.
- Testes unitários, de componentes, RLS e ponta a ponta.

Fora do escopo:

- Pessoas jurídicas e CNPJ.
- Exclusão física.
- Importação ou exportação.
- Consulta automática de CEP.
- Cadastro de veículos.
- Mensagens por e-mail ou WhatsApp.
- Auditoria detalhada de alterações.

## 3. Permissões

| Perfil | Consultar | Cadastrar | Editar | Inativar/reativar |
| --- | --- | --- | --- | --- |
| Administrador | Sim | Sim | Sim | Sim |
| Atendente | Sim | Sim | Sim | Sim |
| Técnico | Sim | Não | Não | Não |

A interface refletirá as permissões, mas toda operação será novamente autorizada no servidor e pelo RLS.

## 4. Modelo de dados

A tabela pública `clientes` terá:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID | Chave primária gerada automaticamente |
| `nome` | Texto | Obrigatório |
| `cpf` | Texto | Obrigatório, 11 dígitos e único |
| `telefone_principal` | Texto | Obrigatório, somente dígitos |
| `telefone_alternativo` | Texto | Opcional, somente dígitos |
| `email` | Texto | Opcional, normalizado para minúsculas |
| `cep` | Texto | Obrigatório, 8 dígitos |
| `logradouro` | Texto | Obrigatório |
| `numero` | Texto | Obrigatório |
| `complemento` | Texto | Opcional |
| `bairro` | Texto | Obrigatório |
| `cidade` | Texto | Obrigatório |
| `estado` | Texto | Obrigatório, 2 letras maiúsculas |
| `observacoes` | Texto | Opcional |
| `ativo` | Booleano | Padrão verdadeiro |
| `criado_em` | Data e hora | Gerada automaticamente |
| `atualizado_em` | Data e hora | Atualizada automaticamente |

O CPF será armazenado sem pontuação. Um índice único impedirá duplicidade, inclusive entre clientes inativos. A inativação preservará relacionamentos históricos. Índices apoiarão nome, CPF, telefone e situação.

## 5. Organização do código

- `src/features/clientes/schemas.ts`: validação e normalização.
- `src/features/clientes/queries.ts`: leitura, busca, filtro, paginação e detalhe.
- `src/features/clientes/actions.ts`: inclusão, edição, inativação e reativação.
- `src/features/clientes/components/`: tabela, filtros, formulário, detalhes e confirmações.
- `src/app/(sistema)/clientes/`: páginas do módulo.
- `supabase/migrations/*_create_clients.sql`: tabela, índices, gatilho e RLS.
- `src/types/database.ts`: tipos do banco.

Rotas:

| Rota | Finalidade |
| --- | --- |
| `/clientes` | Listagem, busca, filtro e paginação |
| `/clientes/novo` | Inclusão |
| `/clientes/[id]` | Consulta detalhada |
| `/clientes/[id]/editar` | Edição |

## 6. Interface

O módulo seguirá o dashboard: menu azul-marinho, cabeçalho branco, cartões claros, verde-climatização como ação e ícones Lucide.

### 6.1 Listagem

- Título e total de resultados.
- Ação “Novo cliente” para administrador e atendente.
- Busca por nome, CPF, telefones ou e-mail.
- Filtro: ativos, inativos ou todos.
- Tabela com nome, CPF, contatos, cidade/estado, situação e ações.
- Paginação por parâmetros de URL.
- Estados vazio e sem resultados.

### 6.2 Formulário

Quatro seções:

1. Dados pessoais: nome e CPF.
2. Contato: telefone principal, telefone alternativo e e-mail.
3. Endereço: CEP, logradouro, número, complemento, bairro, cidade e estado.
4. Informações adicionais: observações.

Máscaras serão somente visuais. O servidor normalizará CPF, CEP e telefones antes de validar e gravar. Haverá rótulos visíveis, erros próximos aos campos e foco no primeiro erro.

### 6.3 Detalhes

Mostrará dados completos, situação e ações permitidas. A seção “Veículos do cliente” ficará informativa até a etapa seguinte.

### 6.4 Responsividade

Desktop usará tabela. Telas estreitas usarão cartões para impedir rolagem horizontal da página. Controles manterão foco visível e dimensões adequadas para toque.

## 7. Validação

- Nome: obrigatório, aparado e com espaços internos normalizados.
- CPF: obrigatório, 11 dígitos, verificadores válidos, não repetido e único.
- Telefone principal: obrigatório, 10 ou 11 dígitos.
- Telefone alternativo: opcional; se informado, 10 ou 11 dígitos.
- E-mail: opcional; se informado, formato válido e minúsculas.
- CEP: obrigatório, 8 dígitos.
- Logradouro, número, bairro, cidade e estado: obrigatórios.
- Estado: 2 letras, convertido para maiúsculas.
- Complemento e observações: opcionais e limitados.
- CPF duplicado: mensagem específica, sem detalhes internos.

Os esquemas Zod serão reutilizados na interface e nas Server Actions quando aplicável.

## 8. Fluxos

### 8.1 Inclusão

1. Usuário autorizado abre `/clientes/novo`.
2. Preenche e envia o formulário.
3. A interface valida para feedback imediato.
4. A Server Action revalida sessão, perfil e dados.
5. O Supabase grava conforme o RLS.
6. O sistema abre o detalhe com confirmação.

### 8.2 Edição

1. Usuário autorizado abre `/clientes/[id]/editar`.
2. O servidor carrega os dados.
3. A Server Action revalida sessão, permissão e conteúdo.
4. O registro é atualizado e o detalhe é revalidado.

### 8.3 Situação

1. Usuário solicita inativação ou reativação.
2. A interface exige confirmação.
3. A Server Action revalida usuário e estado.
4. `ativo` é alterado sem excluir o registro.
5. Lista e detalhe são revalidados.

Envio duplicado será impedido por estado pendente e controles desabilitados.

## 9. RLS

- Usuários ativos autorizados podem consultar.
- Administrador e atendente ativos podem inserir e atualizar.
- Técnico não pode inserir nem atualizar.
- Nenhum usuário autenticado pode excluir clientes pela API comum.
- As políticas consultam `perfis_usuarios`.
- Operações normais não usam a chave administrativa secreta.

## 10. Erros

- Erros de campo aparecem junto ao campo.
- Dados digitados são preservados em falhas esperadas.
- CPF duplicado recebe mensagem orientativa.
- Registro inexistente retorna estado de não encontrado.
- Falta de autenticação redireciona ao login.
- Falta de permissão retorna acesso negado.
- Falhas inesperadas não mostram SQL, tokens ou dados sensíveis.

## 11. Testes e aceitação

Testes unitários:

- CPF válido, inválido, repetido e normalizado.
- Telefones, CEP, e-mail, nome e estado.
- Esquema completo e permissões.

Testes de componentes:

- Formulário, erros, estado pendente.
- Listagem preenchida, vazia e sem resultados.
- Confirmação de inativação e reativação.

Testes de RLS:

- Administrador e atendente consultam e gerenciam.
- Técnico consulta e não grava.
- Exclusão física é bloqueada.
- CPF duplicado é rejeitado.
- Inativação preserva o registro.

Testes ponta a ponta:

- Cadastro, busca, edição, inativação e reativação.
- Técnico somente consulta.
- Layout sem rolagem horizontal em desktop e celular.

A etapa estará concluída quando as permissões forem respeitadas, todas as operações funcionarem com o Supabase real, a suíte passar e não houver segredos ou dados temporários versionados.