# Especificação — Cadastro de serviços

Data: 6 de setembro de 2026

Branch: `feature/cadastro-servicos`

Base: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`

## 1. Objetivo

Entregar o catálogo de serviços da Mundo Ar Climatização. O módulo permitirá organizar, consultar e administrar os trabalhos oferecidos pela oficina e fornecerá a fonte dos itens que serão adicionados às futuras ordens de serviço.

O catálogo conterá somente serviços e mão de obra. Peças, materiais e estoque não fazem parte desta etapa.

## 2. Escopo

Incluído:

- Cadastro de serviços e mão de obra.
- Nome, categoria, descrição, valor-base opcional e situação.
- Categorias fixas adequadas à oficina.
- Listagem paginada, busca e filtros.
- Consulta detalhada.
- Inclusão, edição, inativação e reativação por administrador.
- Consulta por administrador e atendente.
- Validação no navegador, servidor e banco.
- Políticas RLS e testes automatizados.

Fora do escopo:

- Cadastro de peças e materiais.
- Estoque, compras, fornecedores ou movimentações.
- Valores diferentes por modelo de veículo.
- Tabelas promocionais, descontos ou comissões.
- Composição de ordens de serviço.
- Exclusão física de serviços.

## 3. Perfis e permissões

| Perfil | Consultar | Cadastrar | Editar | Inativar/reativar |
| --- | --- | --- | --- | --- |
| Administrador | Sim | Sim | Sim | Sim |
| Atendente | Sim | Não | Não | Não |

A interface esconderá as ações indisponíveis ao atendente. Todas as operações serão novamente autorizadas pela Server Action e pelas políticas RLS do Supabase. O controle visual nunca será considerado uma barreira de segurança suficiente.

## 4. Modelo de dados

A tabela pública `servicos` terá:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID | Chave primária gerada automaticamente |
| `nome` | Texto | Obrigatório, normalizado e limitado a 100 caracteres |
| `categoria` | Texto controlado | Obrigatória e limitada às categorias aprovadas |
| `descricao` | Texto | Opcional e limitada a 1000 caracteres |
| `valor_base` | Decimal exato | Opcional, com duas casas e nunca negativo |
| `ativo` | Booleano | Obrigatório, padrão verdadeiro |
| `criado_em` | Data e hora | Gerada automaticamente |
| `atualizado_em` | Data e hora | Atualizada automaticamente |

O valor monetário será armazenado em tipo decimal exato, nunca em ponto flutuante. A ausência de `valor_base` significa que o preço será definido durante o orçamento; não significa serviço gratuito.

## 5. Categorias

As categorias da primeira versão serão fixas:

| Identificador persistido | Rótulo apresentado |
| --- | --- |
| `climatizacao` | Climatização |
| `eletrica_automotiva` | Elétrica automotiva |
| `diagnostico` | Diagnóstico |
| `manutencao_preventiva` | Manutenção preventiva |
| `outros` | Outros |

Não haverá tabela nem tela para administrar categorias nesta versão. A lista será compartilhada pela validação, pelos formulários e pelos filtros.

## 6. Regras de negócio

- O catálogo representa serviços e mão de obra, não produtos.
- Nome e categoria formam uma combinação única em todo o catálogo, inclusive entre registros inativos.
- A comparação de duplicidade desconsiderará diferenças entre maiúsculas e minúsculas, espaços nas extremidades e sequências de espaços internos.
- O mesmo nome poderá existir em categorias diferentes.
- Serviços não serão excluídos fisicamente; somente inativados.
- O valor-base será opcional e servirá como sugestão para novos orçamentos.
- O valor praticado poderá ser ajustado na futura ordem sem modificar o catálogo.
- Futuras ordens guardarão sua própria descrição e seu próprio valor unitário. Alterações posteriores no catálogo não modificarão ordens antigas.
- Serviços inativos permanecerão disponíveis para consulta histórica, mas não poderão ser adicionados a novas ordens.
- Reativar um serviço preservará seus dados e relacionamentos.

## 7. Organização do código

- `src/features/servicos/schemas.ts`: categorias, normalização e validação.
- `src/features/servicos/formatters.ts`: apresentação monetária e das categorias.
- `src/features/servicos/types.ts`: DTOs do catálogo.
- `src/features/servicos/queries.ts`: listagem, busca, filtros e detalhe.
- `src/features/servicos/actions.ts`: inclusão, edição e mudança de situação.
- `src/features/servicos/components/`: listagem, formulário e ações.
- `src/app/(sistema)/servicos/`: páginas do módulo.
- `supabase/migrations/*_create_services.sql`: tabela, restrições, índices, gatilhos e RLS.
- `src/types/database.ts`: tipos do banco.

## 8. Rotas e interface

| Rota | Finalidade | Acesso |
| --- | --- | --- |
| `/servicos` | Catálogo, busca, filtros e paginação | Administrador e atendente |
| `/servicos/novo` | Inclusão | Administrador |
| `/servicos/[id]` | Consulta detalhada | Administrador e atendente |
| `/servicos/[id]/editar` | Edição | Administrador |

### 8.1 Listagem

A página apresentará:

- quantidade de resultados;
- busca por nome ou descrição;
- filtro por categoria;
- filtro de situação entre ativos, inativos ou todos;
- nome, categoria, descrição resumida, valor-base e situação;
- paginação baseada em parâmetros da URL;
- estados para catálogo vazio e busca sem resultado.

Em computadores, os resultados serão exibidos em tabela. Em telas estreitas, serão apresentados em cartões para evitar rolagem horizontal. O botão “Novo serviço” aparecerá somente para administradores.

### 8.2 Formulário

O formulário terá:

1. Identificação: nome e categoria.
2. Precificação: valor-base opcional com entrada monetária brasileira.
3. Detalhes: descrição opcional.

Os campos terão rótulos visíveis, indicação de obrigatoriedade, mensagens próximas ao erro, foco no primeiro campo inválido e bloqueio durante o envio.

### 8.3 Detalhes

A página mostrará todos os dados, situação e datas de registro. Administradores verão ações de edição e mudança de situação. Atendentes verão somente os dados.

Quando o valor-base estiver ausente, a interface mostrará “A definir”. Nenhuma ação de exclusão será oferecida.

## 9. Fluxos

### 9.1 Inclusão

1. Administrador abre `/servicos/novo`.
2. Informa nome, categoria e, opcionalmente, descrição e valor-base.
3. A interface valida os dados para retorno imediato.
4. A Server Action revalida sessão, perfil e conteúdo.
5. O banco aplica restrições e RLS.
6. O sistema abre o detalhe com confirmação de sucesso.

### 9.2 Edição

1. Administrador abre `/servicos/[id]/editar`.
2. O servidor carrega os dados atuais.
3. A Server Action revalida usuário, permissão e conteúdo.
4. O catálogo é atualizado sem alterar ordens antigas.
5. O sistema retorna ao detalhe com confirmação.

### 9.3 Situação

1. Administrador solicita inativação ou reativação.
2. A interface exige confirmação.
3. A Server Action revalida usuário e identificador.
4. O campo `ativo` é alterado sem exclusão física.
5. Lista e detalhe são revalidados.

## 10. Validação e normalização

- Nome: obrigatório, espaços normalizados e máximo de 100 caracteres.
- Categoria: obrigatória e pertencente à lista fixa.
- Descrição: opcional e máximo de 1000 caracteres.
- Valor-base: opcional, de zero até `9999999999,99`, com no máximo duas casas decimais.
- Valores monetários negativos, não numéricos ou acima do limite serão rejeitados.
- A entrada aceitará o formato brasileiro, e o servidor a converterá para o decimal persistido.
- Combinação duplicada de nome e categoria receberá mensagem específica.
- Identificadores inválidos serão rejeitados sem consultar ou alterar registros arbitrários.

O banco terá uma restrição ou índice único baseado no nome canônico e na categoria, impedindo que chamadas diretas contornem a regra de duplicidade.

## 11. Segurança e RLS

- Visitantes não consultarão nem alterarão serviços.
- Administradores e atendentes ativos poderão consultar.
- Somente administradores ativos poderão inserir e atualizar.
- Nenhum usuário autenticado comum poderá excluir serviços.
- Usuários inativos não terão acesso ao catálogo.
- Toda Server Action verificará a permissão apropriada antes de ler ou gravar.
- Operações normais não usarão a chave administrativa secreta.
- Mensagens de erro não revelarão SQL, chaves ou detalhes internos.

Os privilégios SQL e as políticas RLS serão testados separadamente. Esconder botões do atendente não substituirá a proteção do servidor e do banco.

## 12. Tratamento de erros

- Erros de campo serão exibidos junto ao dado inválido.
- Dados digitados serão preservados em falhas esperadas.
- Duplicidade terá mensagem orientativa para localizar ou reativar o registro existente.
- Serviço inexistente apresentará a página de não encontrado.
- Falta de autenticação redirecionará ao login.
- Falta de permissão apresentará acesso negado.
- Falhas inesperadas usarão mensagens genéricas e seguras.

## 13. Testes e critérios de aceite

Testes unitários:

- normalização de nome e descrição;
- categorias válidas e inválidas;
- conversão e formatação monetária;
- valor ausente, zero, negativo, inválido e acima do limite;
- limites dos campos.

Testes de componentes:

- formulário válido e inválido;
- preservação dos valores em erros esperados;
- listagem preenchida, vazia e sem resultados;
- representação “A definir” para preço ausente;
- ações visíveis conforme o perfil;
- confirmação da mudança de situação.

Testes de RLS e banco:

- visitante e usuário inativo sem acesso;
- administrador com consulta e gestão;
- atendente com consulta e sem gestão;
- exclusão física bloqueada;
- duplicidade rejeitada, inclusive com diferenças de caixa ou espaços e com registro inativo.

Testes ponta a ponta:

- administrador cadastra, busca, edita, inativa e reativa;
- atendente consulta, mas não acessa inclusão ou edição;
- filtros de categoria e situação funcionam;
- valor-base opcional e valor definido são apresentados corretamente;
- layout não cria rolagem horizontal em computador ou celular.

A etapa estará concluída quando o catálogo funcionar no Supabase de desenvolvimento, as permissões forem respeitadas em todas as camadas, a suíte completa passar, o build de produção concluir e nenhum segredo ou dado sintético permanecer versionado ou armazenado após os testes.
