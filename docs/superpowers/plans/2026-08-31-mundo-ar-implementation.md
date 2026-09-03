# Plano de implementação — Sistema Mundo Ar Climatização

Data: 31 de agosto de 2026  
Base: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`  
Estratégia Git: `main` estável e branches curtas por funcionalidade, sem tags de versão

## 1. Objetivo do plano

Entregar a primeira versão do sistema web da Mundo Ar Climatização de forma incremental, mantendo cada etapa funcional, testável e demonstrável. O plano cobre ambiente, autenticação, três cadastros, ordem de serviço, três relatórios, dashboard, qualidade e publicação.

O levantamento com a oficina continuará em paralelo. Caso uma resposta altere uma regra já implementada, a mudança será tratada em branch própria e registrada na documentação.

## 2. Regras de execução

Para cada branch:

1. Atualizar a `main` local.
2. Criar a branch indicada neste plano.
3. Implementar somente o escopo da etapa.
4. Escrever ou atualizar os testes correspondentes.
5. Executar lint, verificação de tipos, testes e build.
6. Revisar o diff e remover dados temporários, logs e segredos.
7. Criar commit convencional.
8. Integrar na `main` somente após todos os critérios da etapa serem atendidos.
9. Excluir a branch integrada.

Comandos de verificação previstos:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Os nomes exatos dos scripts serão definidos na estrutura inicial e permanecerão estáveis nas etapas seguintes.

## 3. Organização planejada do código

```text
src/
  app/
    (auth)/
    (sistema)/
    api/
  components/
    layout/
    shared/
    ui/
  features/
    auth/
    clientes/
    veiculos/
    servicos/
    ordens-servico/
    relatorios/
    dashboard/
  lib/
    auth/
    supabase/
    validation/
  types/
supabase/
  migrations/
  seed.sql
tests/
  e2e/
docs/
```

Cada pasta em `features` concentrará componentes, esquemas Zod, casos de uso, consultas e testes da funcionalidade. Regras de negócio não ficarão presas aos componentes visuais.

## 4. Etapa 0 — Repositório remoto

### Objetivo

Criar o repositório no GitHub, vincular o repositório local e estabelecer o fluxo de integração.

### Atividades

- Criar o repositório remoto inicialmente privado.
- Adicionar o remoto `origin`.
- Enviar a branch `main`.
- Configurar a `main` como branch padrão.
- Ativar proteção da `main` quando o plano da conta permitir.
- Exigir as verificações automatizadas antes das integrações quando a CI estiver disponível.
- Registrar no `README.md` a finalidade acadêmica e o estado do projeto.

### Critério de conclusão

O histórico local estará publicado no GitHub, sem segredos, e a `main` remota corresponderá à `main` local.

## 5. Etapa 1 — Estrutura inicial

Branch: `feature/estrutura-inicial`  
Commit esperado: `chore: configura estrutura inicial`

### Objetivo

Criar uma aplicação Next.js executável com TypeScript, Tailwind, shadcn/ui e a infraestrutura inicial de testes.

### Arquivos e áreas principais

- `package.json` e arquivo de lock.
- `src/app/layout.tsx` e página inicial provisória.
- `src/app/globals.css`.
- `src/components/ui/`.
- `src/components/layout/`.
- `src/lib/utils.ts`.
- `vitest.config.*` e arquivo de configuração dos testes.
- `playwright.config.*`.
- `tests/e2e/smoke.spec.ts`.
- `.env.example`.
- `README.md`.

### Atividades

- Inicializar Next.js com App Router, TypeScript estrito, ESLint, Tailwind e diretório `src`.
- Configurar aliases de importação.
- Instalar e configurar shadcn/ui.
- Definir tokens iniciais de cor, tipografia, espaçamento e foco acessível.
- Criar o shell desktop-first com menu lateral e cabeçalho, ainda sem regras de autenticação.
- Configurar Vitest e Testing Library.
- Configurar Playwright com um teste de fumaça.
- Adicionar os scripts `typecheck`, `test` e `test:e2e`.
- Documentar instalação, variáveis e comandos.

### Testes

- Renderização do layout principal.
- Navegação básica por teclado.
- Teste de fumaça abrindo a aplicação.

### Critério de conclusão

A aplicação inicia localmente, apresenta o shell principal e passa em lint, tipos, testes e build.

## 6. Etapa 2 — Supabase e autenticação

Branch: `feature/autenticacao`  
Commit esperado: `feat: adiciona autenticação e perfis`

### Objetivo

Integrar Supabase Auth, criar perfis de usuário e proteger as áreas privadas.

### Arquivos e áreas principais

- `src/lib/supabase/client.ts`.
- `src/lib/supabase/server.ts`.
- Arquivo de proxy ou middleware compatível com a versão instalada do Next.js.
- `src/features/auth/`.
- `src/app/(auth)/login/page.tsx`.
- `src/app/(sistema)/layout.tsx`.
- `supabase/migrations/*_create_user_profiles.sql`.
- `supabase/seed.sql`.

### Atividades

- Criar ou vincular o projeto Supabase de desenvolvimento.
- Preparar clientes Supabase para navegador e servidor.
- Criar enumeração de perfis: administrador e atendente.
- Criar tabela de perfis ligada ao Supabase Auth.
- Criar políticas RLS para perfis e funções auxiliares de autorização.
- Implementar login, logout, renovação da sessão e redirecionamento.
- Bloquear rotas privadas sem sessão.
- Criar guardas de servidor para perfil e permissão.
- Criar dados locais de demonstração sem incluir senhas reais no repositório.

### Testes

- Esquema de login.
- Matriz de permissões.
- Redirecionamento de usuário não autenticado.
- Login e logout ponta a ponta.
- Bloqueio de operação incompatível com o perfil.

### Critério de conclusão

Os dois perfis entram no sistema e a autorização é aplicada na interface, no servidor e no banco.

## 7. Etapa 3 — Cadastro de clientes

Branch: `feature/cadastro-clientes`  
Commit esperado: `feat: implementa cadastro de clientes`

### Objetivo

Entregar o primeiro cadastro completo e estabelecer o padrão reutilizável para os demais.

### Arquivos e áreas principais

- `src/features/clientes/schema.ts`.
- `src/features/clientes/actions.ts`.
- `src/features/clientes/queries.ts`.
- `src/features/clientes/components/`.
- `src/app/(sistema)/clientes/`.
- `supabase/migrations/*_create_clients.sql`.

### Atividades

- Criar tabela, índices e políticas RLS.
- Criar esquema Zod e normalização de contato e documento.
- Implementar listagem paginada, busca e filtro por situação.
- Implementar inclusão, consulta, alteração e inativação.
- Exibir confirmações, erros de campo e estados vazios.
- Impedir exclusão física pela interface.

### Testes

- Validação e normalização.
- Formulário válido, inválido e com falha de servidor.
- Busca, paginação e inativação.
- Fluxo ponta a ponta de cadastro e edição.

### Critério de conclusão

Administrador e atendente gerenciam clientes.

## 8. Etapa 4 — Cadastro de veículos

Branch: `feature/cadastro-veiculos`  
Commit esperado: `feat: implementa cadastro de veículos`

### Objetivo

Gerenciar veículos vinculados aos clientes e preparar a base do histórico de manutenção.

### Arquivos e áreas principais

- `src/features/veiculos/`.
- `src/app/(sistema)/veiculos/`.
- `src/features/clientes/components/client-vehicles.*`.
- `supabase/migrations/*_create_vehicles.sql`.

### Atividades

- Criar tabela, relacionamento, índices e políticas RLS.
- Normalizar placa para letras e números maiúsculos.
- Criar unicidade para placa entre veículos ativos.
- Implementar busca por placa, modelo e cliente.
- Implementar inclusão, consulta, alteração e inativação.
- Exibir os veículos na página do cliente.

### Testes

- Normalização de placa.
- Bloqueio de placa ativa duplicada.
- Validação do vínculo com cliente.
- Fluxo ponta a ponta de cadastro, busca e edição.

### Critério de conclusão

Cada veículo ativo possui um cliente responsável e pode ser localizado por placa ou cliente.

## 9. Etapa 5 — Cadastro de serviços

Branch: `feature/cadastro-servicos`  
Commit esperado: `feat: implementa cadastro de serviços`

### Objetivo

Criar o catálogo usado na composição das ordens de serviço.

### Arquivos e áreas principais

- `src/features/servicos/`.
- `src/app/(sistema)/servicos/`.
- `supabase/migrations/*_create_services.sql`.

### Atividades

- Criar tabela, índices e políticas RLS.
- Implementar nome, descrição, categoria, valor-base e situação.
- Implementar listagem, busca, filtro por categoria e situação.
- Permitir administração somente ao administrador.
- Permitir consulta ao atendente.
- Preservar serviços inativos para o histórico.

### Testes

- Valores não negativos.
- Permissões por perfil.
- Busca, filtros, criação, edição e inativação.

### Critério de conclusão

O catálogo pode ser consultado na operação e administrado somente por quem possui permissão.

## 10. Etapa 6 — Ordem de serviço

Branch: `feature/ordens-servico`  
Commit esperado: `feat: implementa ciclo da ordem de serviço`

### Objetivo

Entregar o processo central desde a entrada do veículo até sua conclusão ou cancelamento.

### Arquivos e áreas principais

- `src/features/ordens-servico/domain/`.
- `src/features/ordens-servico/schema.ts`.
- `src/features/ordens-servico/actions.ts`.
- `src/features/ordens-servico/queries.ts`.
- `src/features/ordens-servico/components/`.
- `src/app/(sistema)/ordens-servico/`.
- `supabase/migrations/*_create_work_orders.sql`.
- `supabase/migrations/*_create_work_order_transactions.sql`.

### Atividades de banco

- Criar enumeração de status.
- Criar tabelas de ordens, itens e histórico.
- Criar sequência segura para o número da ordem.
- Criar chaves, restrições, índices e políticas RLS.
- Criar operações transacionais para mudança de status e histórico.
- Preservar descrição e valor praticado em cada item.

### Atividades de aplicação

- Criar listagem por número, cliente, placa, status e período.
- Implementar abertura com cliente, veículo, reclamação, quilometragem e observações.
- Implementar atribuição de responsável pelo atendimento e pela execução.
- Implementar diagnóstico e composição de itens.
- Calcular subtotal e total no servidor.
- Implementar autorização ou recusa com meio, data e responsável.
- Permitir execução somente de itens autorizados.
- Implementar etapas pronta, entrega e forma resumida de pagamento.
- Implementar cancelamento com justificativa.
- Exibir linha do tempo completa.
- Tornar ordens finais somente leitura para usuários comuns.
- Permitir correção administrativa auditada.
- Criar versão de impressão da ordem.

### Testes unitários

- Matriz de transições válidas e inválidas.
- Cálculo de valores.
- Itens autorizados e executados.
- Regras de prontidão, cancelamento e finalização.
- Preservação dos valores históricos.

### Testes ponta a ponta

- Ciclo completo autorizado.
- Ciclo recusado.
- Cancelamento justificado.
- Tentativas de pular etapas.
- Bloqueios por perfil.
- Impressão da ordem.

### Critério de conclusão

Uma ordem percorre todos os estados aprovados com integridade, permissões e rastreabilidade.

## 11. Etapa 7 — Relatórios

Branch: `feature/relatorios`  
Commit esperado: `feat: adiciona relatórios operacionais`

### Objetivo

Entregar os três relatórios obrigatórios do projeto acadêmico.

### Arquivos e áreas principais

- `src/features/relatorios/`.
- `src/app/(sistema)/relatorios/ordens-periodo/`.
- `src/app/(sistema)/relatorios/servicos-realizados/`.
- `src/app/(sistema)/relatorios/historico-veiculo/`.
- `supabase/migrations/*_create_report_indexes.sql`.

### Atividades

- Criar consultas paginadas e índices necessários.
- Implementar ordens por período com filtros e totais.
- Implementar serviços mais realizados usando somente itens executados de ordens finalizadas.
- Implementar histórico do veículo por placa ou seleção.
- Criar estados sem resultado e mensagens de filtro inválido.
- Criar versões para impressão.
- Aplicar permissões de relatório por perfil.

### Testes

- Intervalo de datas inclusivo e ordenação.
- Exclusão de itens não executados do ranking.
- Preservação de ordens antigas no histórico.
- Totais com conjunto de dados conhecido.
- Fluxo ponta a ponta dos três relatórios.

### Critério de conclusão

Os relatórios retornam resultados corretos, respeitam permissões e podem ser impressos.

## 12. Etapa 8 — Dashboard

Branch: `feature/dashboard`  
Commit esperado: `feat: adiciona dashboard operacional`

### Objetivo

Apresentar a situação atual da oficina e atalhos para tarefas frequentes.

### Arquivos e áreas principais

- `src/features/dashboard/`.
- `src/app/(sistema)/page.tsx`.

### Atividades

- Exibir quantidades em diagnóstico, aguardando aprovação, em execução e prontas.
- Exibir ordens recentes.
- Exibir pendências de aprovação e retirada.
- Adicionar atalhos para nova ordem e novo cliente conforme permissão.
- Usar gráfico somente se melhorar a leitura; os indicadores numéricos são suficientes para o aceite.
- Validar comportamento no tamanho de referência 1366 x 768 e em telas menores.

### Testes

- Indicadores calculados a partir de dados conhecidos.
- Exibição de alertas e estados vazios.
- Atalhos conforme o perfil.
- Layout sem sobreposição nas larguras suportadas.

### Critério de conclusão

O usuário identifica rapidamente a carga atual da oficina e acessa as principais tarefas.

## 13. Etapa 9 — Qualidade, CI e publicação

Branch: `feature/testes-e-deploy`  
Commit esperado: `ci: configura validações e deploy`

### Objetivo

Consolidar a qualidade, automatizar verificações e publicar uma versão de demonstração.

### Arquivos e áreas principais

- `.github/workflows/ci.yml`.
- Configuração de deploy da Vercel.
- Documentação de variáveis de ambiente.
- Suíte completa em `tests/e2e/`.
- `README.md`.

### Atividades

- Executar auditoria de acessibilidade nas telas principais.
- Revisar mensagens de erro, confirmações e estados de carregamento.
- Revisar políticas RLS com testes positivos e negativos.
- Garantir que logs não contenham dados sensíveis.
- Criar workflow para lint, tipos, testes e build.
- Preparar ambiente de demonstração no Supabase.
- Publicar a aplicação na Vercel.
- Configurar variáveis sem incluí-las no Git.
- Executar a suíte ponta a ponta contra o ambiente adequado.
- Atualizar README com instalação, arquitetura, perfis e demonstração.

### Testes de aceite

- Login e logout de todos os perfis.
- Três cadastros completos.
- Ordem autorizada e ordem recusada.
- Histórico auditável.
- Três relatórios com dados conhecidos.
- Bloqueios de segurança no navegador, servidor e banco.
- Funcionamento em computador e notebook.

### Critério de conclusão

A `main` passa em todas as verificações e a aplicação publicada atende aos critérios da especificação.

## 14. Dados de demonstração

O arquivo `supabase/seed.sql` deverá criar um conjunto reproduzível com:

- clientes ativos e inativos;
- veículos de marcas e modelos diferentes;
- serviços em categorias de climatização e elétrica automotiva;
- ordens em cada status;
- uma ordem recusada;
- ordens finalizadas suficientes para validar os relatórios.

As contas de teste serão criadas por procedimento documentado ou script administrativo executado fora do repositório. Senhas não serão armazenadas no Git.

## 15. Ordem e dependências

```text
Repositório remoto
  └─ Estrutura inicial
      └─ Autenticação
          ├─ Clientes
          │   └─ Veículos
          └─ Serviços
              └─ Ordens de serviço
                  ├─ Relatórios
                  └─ Dashboard
                      └─ Qualidade e deploy
```

Clientes e serviços podem ser desenvolvidos em sequência ou em paralelo por pessoas diferentes. Veículos dependem de clientes. Ordens dependem dos três cadastros e da autenticação. Relatórios e dashboard dependem das ordens.

## 16. Definição de pronto global

Uma etapa somente poderá ser integrada quando:

- o escopo e os critérios da etapa estiverem implementados;
- lint e verificação de tipos passarem;
- testes relevantes passarem;
- build de produção concluir;
- novas tabelas possuírem migração e RLS;
- erros e estados vazios estiverem tratados;
- permissões forem testadas no servidor e no banco;
- nenhum segredo ou dado pessoal real estiver no diff;
- README ou documentação técnica estiver atualizada quando necessário;
- o diff tiver sido revisado antes do commit e da integração.

## 17. Documentação acadêmica durante o desenvolvimento

Ao concluir cada módulo, serão preservados os materiais necessários ao TCC:

- requisitos funcionais efetivamente implementados;
- capturas das telas finais;
- casos de uso correspondentes;
- mudanças nos diagramas;
- dicionário das tabelas criadas;
- scripts de migração do banco;
- evidências dos relatórios;
- resultados dos testes e critérios de aceite.

Isso evita reconstruir a documentação apenas no final do projeto e mantém coerência entre o sistema entregue e o trabalho acadêmico.
