# Plano de implementação — Cadastro de serviços

Data: 6 de setembro de 2026

Base: `docs/superpowers/specs/2026-09-06-cadastro-servicos-design.md`

Branch: `feature/cadastro-servicos`

## 1. Objetivo

Implementar o catálogo de serviços e mão de obra da Mundo Ar Climatização, com categorias fixas, valor-base opcional, inativação lógica, permissões distintas para administrador e atendente e proteção por sessão, servidor e RLS.

O módulo seguirá os padrões validados nos cadastros de clientes e veículos. Regras isoláveis serão desenvolvidas com testes primeiro e cada etapa terminará com revisão do diff e verificações proporcionais ao risco.

## 2. Decisões confirmadas

- Cadastrar somente serviços e mão de obra.
- Não incluir peças, materiais ou estoque.
- Manter categorias fixas: climatização, elétrica automotiva, diagnóstico, manutenção preventiva e outros.
- Permitir valor-base opcional.
- Exibir “A definir” quando não houver valor-base.
- Impedir valores negativos e limitar valores monetários a duas casas decimais.
- Tornar única a combinação de nome canônico e categoria, inclusive entre registros inativos.
- Permitir o mesmo nome em categorias diferentes.
- Não excluir fisicamente serviços.
- Permitir gestão somente ao administrador.
- Permitir consulta ao administrador e ao atendente.
- Preservar descrição e valor praticado dentro das futuras ordens de serviço.

## 3. Estrutura prevista

```text
src/
  app/(sistema)/
    servicos/
      page.tsx
      novo/page.tsx
      [id]/page.tsx
      [id]/editar/page.tsx
  components/layout/app-shell.tsx
  features/
    servicos/
      actions.ts
      formatters.ts
      queries.ts
      schemas.ts
      schemas.test.ts
      types.ts
      components/
        service-form.tsx
        service-form.test.tsx
        service-list.tsx
        service-list.test.tsx
        service-status-action.tsx
supabase/
  migrations/*_create_services.sql
scripts/
  validar-servicos-rls.mjs
tests/e2e/
  servicos.spec.ts
```

Os nomes poderão receber pequenos ajustes para acompanhar os padrões existentes sem alterar as responsabilidades descritas.

## 4. Tarefa 1 — Implementar categorias, valores e validação

### Arquivos

- Criar `src/features/servicos/schemas.ts`.
- Criar `src/features/servicos/schemas.test.ts`.
- Criar `src/features/servicos/formatters.ts`.
- Criar `src/features/servicos/types.ts`.

### Testes primeiro

1. Nome obrigatório é aparado e tem espaços internos normalizados.
2. Nome vazio ou acima do limite é rejeitado.
3. Somente as cinco categorias aprovadas são aceitas.
4. Descrição vazia é convertida em ausência de valor.
5. Valor-base vazio é convertido em ausência de valor.
6. Valores brasileiros válidos, incluindo zero e centavos, são convertidos corretamente.
7. Valores negativos, não numéricos, com mais de duas casas ou acima do limite são rejeitados.
8. Valores persistidos são formatados como moeda brasileira.

### Implementação

- Centralizar identificadores e rótulos de categorias.
- Criar normalizadores puros de texto e valor monetário.
- Separar entradas de formulário dos DTOs persistidos.
- Evitar cálculos monetários com ponto flutuante.

### Verificação

```bash
npm run test -- src/features/servicos/schemas.test.ts
npm run typecheck
```

## 5. Tarefa 2 — Criar banco, restrições e RLS

### Arquivos

- Criar uma nova migração em `supabase/migrations/`.
- Criar `scripts/validar-servicos-rls.mjs`.
- Atualizar `package.json` com `test:services:rls`.
- Atualizar `src/types/database.ts`.

### Banco

1. Criar `servicos` com UUID, nome, categoria, descrição, valor-base, situação e timestamps.
2. Usar decimal exato com duas casas para `valor_base`.
3. Criar restrições de conteúdo, categoria e valor não negativo.
4. Criar unicidade por categoria e nome canônico, desconsiderando caixa e espaços redundantes.
5. Criar índices para situação, categoria e pesquisa.
6. Reutilizar o gatilho de atualização de timestamp.
7. Habilitar RLS.
8. Conceder leitura à equipe ativa e escrita somente ao administrador ativo.
9. Não conceder exclusão física.

### Testes de integração

- Visitante não consulta nem grava.
- Administrador ativo consulta, insere e atualiza.
- Atendente ativo consulta, mas não insere nem atualiza.
- Usuário inativo não consulta nem grava.
- Categoria inválida é rejeitada.
- Valor negativo é rejeitado.
- Duplicidade canônica é rejeitada mesmo com serviço inativo.
- Exclusão física é bloqueada.

### Aplicação

```bash
npx supabase db push --dry-run
npx supabase db push
npm run test:services:rls
npx supabase db lint --linked
```

A migração será revisada antes de ser aplicada. Se já tiver sido enviada ao Supabase, qualquer correção estrutural posterior será feita em uma nova migração.

## 6. Tarefa 3 — Criar consultas e Server Actions

### Arquivos

- Criar `src/features/servicos/queries.ts`.
- Criar `src/features/servicos/actions.ts`.

### Consultas

1. Listar serviços com paginação.
2. Buscar por nome ou descrição com entrada sanitizada.
3. Filtrar por categoria e situação.
4. Buscar detalhe por UUID.
5. Retornar DTOs mínimos e formatáveis.

### Server Actions

1. Criar serviço após revalidar sessão, perfil e conteúdo.
2. Editar serviço após revalidar administrador e identificador.
3. Inativar e reativar sem exclusão.
4. Mapear duplicidade e dados inválidos para mensagens orientativas.
5. Preservar os dados digitados em falhas esperadas.
6. Revalidar lista e detalhe após alterações.

Cada operação de escrita chamará `requirePermission("servicos:gerenciar")`. As consultas chamarão `requirePermission("servicos:consultar")`.

### Verificação

```bash
npm run test
npm run typecheck
npm run lint
```

## 7. Tarefa 4 — Implementar formulário e páginas administrativas

### Arquivos

- Criar `src/features/servicos/components/service-form.tsx`.
- Criar `src/features/servicos/components/service-form.test.tsx`.
- Criar `src/app/(sistema)/servicos/novo/page.tsx`.
- Criar `src/app/(sistema)/servicos/[id]/editar/page.tsx`.

### Testes primeiro

- Renderização dos campos e valores iniciais.
- Categorias disponíveis.
- Validação de obrigatoriedade e valor monetário.
- Conversão visual de moeda.
- Estado pendente bloqueia reenvio.
- Erro esperado preserva os dados.

### Interface

- Separar identificação, precificação e detalhes.
- Usar rótulos visíveis e mensagens próximas aos campos.
- Marcar somente nome e categoria como obrigatórios.
- Explicar que valor-base vazio será definido no orçamento.
- Redirecionar ao detalhe após inclusão e edição.
- Proteger as rotas pelo servidor; não depender apenas da ausência de links.

## 8. Tarefa 5 — Implementar catálogo, detalhes e situação

### Arquivos

- Criar `src/features/servicos/components/service-list.tsx`.
- Criar `src/features/servicos/components/service-list.test.tsx`.
- Criar `src/features/servicos/components/service-status-action.tsx`.
- Criar `src/app/(sistema)/servicos/page.tsx`.
- Criar `src/app/(sistema)/servicos/[id]/page.tsx`.
- Atualizar `src/components/layout/app-shell.tsx`.

### Testes primeiro

- Lista preenchida, vazia e sem resultados.
- Valor presente formatado e valor ausente como “A definir”.
- Filtros preservados na paginação.
- Cartões responsivos em telas estreitas.
- Ações administrativas ausentes para atendente.
- Mudança de situação exige confirmação.

### Interface

- Reutilizar a linguagem visual de clientes e veículos.
- Mostrar tabela em telas médias e grandes e cartões em telas estreitas.
- Tornar categoria e situação identificáveis por texto, não somente por cor.
- Exibir uma única ação primária por página.
- Manter alvos de interação de pelo menos 44 pixels.
- Ativar o link “Serviços” no menu lateral.

## 9. Tarefa 6 — Testes ponta a ponta e aceite

### Arquivos

- Criar `tests/e2e/servicos.spec.ts`.

### Cenários

1. Administrador cadastra serviço sem valor-base.
2. Catálogo apresenta “A definir”.
3. Administrador edita e informa um valor-base.
4. Busca e filtros localizam o serviço.
5. Duplicidade canônica é rejeitada.
6. Administrador inativa e reativa.
7. Atendente consulta o catálogo.
8. Atendente não acessa inclusão ou edição.
9. Atendente não altera diretamente pelo banco.
10. Listagem e formulários não criam rolagem horizontal.

Os testes remotos usarão dados sintéticos identificáveis e os removerão ao final, inclusive em caso de falha sempre que possível.

## 10. Documentação e suíte final

### Arquivos

- Atualizar `README.md` com o módulo e o comando RLS.

### Suíte final

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:rls
npm run test:clients:rls
npm run test:vehicles:rls
npm run test:services:rls
npx supabase db lint --linked
```

### Revisão

- Conferir autorização em todas as Server Actions e páginas administrativas.
- Conferir privilégios SQL, políticas RLS e caminhos negativos.
- Confirmar que atendente não possui escrita no catálogo.
- Confirmar que exclusão física não foi concedida.
- Confirmar que nenhuma operação normal usa chave administrativa.
- Buscar segredos, logs e dados pessoais reais no diff.
- Executar `git diff --check` e revisar todas as mudanças.

## 11. Estratégia de commits

Commits convencionais e separados por responsabilidade:

1. `docs: planeja cadastro de servicos`
2. `feat: adiciona dominio de servicos`
3. `feat: adiciona estrutura de dados de servicos`
4. `feat: adiciona operacoes de servicos`
5. `feat: adiciona interface de servicos`
6. `test: cobre cadastro de servicos`
7. `docs: documenta cadastro de servicos`

O push e a integração remota serão realizados somente quando solicitados.

## 12. Definição de pronto

O módulo estará pronto quando as regras da especificação estiverem implementadas, a migração tiver sido aplicada ao Supabase de desenvolvimento, administrador e atendente tiverem exatamente as permissões previstas, a suíte completa passar, o build concluir e o repositório não contiver segredos ou dados sintéticos persistentes.
