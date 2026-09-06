# Plano de implementação — Cadastro de veículos

Data: 6 de setembro de 2026

Base: `docs/superpowers/specs/2026-09-06-cadastro-veiculos-design.md`

Branch: `feature/cadastro-veiculos`

## 1. Objetivo

Implementar o cadastro completo de veículos vinculados a clientes, com placa única, histórico transacional de proprietários, inativação lógica, integração com a página do cliente e proteção por sessão, servidor e RLS.

O módulo seguirá o padrão já validado no cadastro de clientes. Regras isoláveis serão desenvolvidas com testes primeiro, e cada etapa terminará com revisão do diff e verificações proporcionais ao risco.

## 2. Decisões confirmadas

- Atender somente carros e utilitários com placa brasileira.
- Aceitar placas antigas e Mercosul e armazená-las sem separadores, em maiúsculas.
- Manter a placa única entre todos os registros, inclusive inativos.
- Separar ano de fabricação e ano do modelo.
- Aceitar anos de 1900 até o ano corrente mais um.
- Permitir que o ano do modelo seja igual ou um ano posterior ao de fabricação, respeitando o limite superior.
- Registrar quilometragem somente nas futuras ordens de serviço.
- Manter o proprietário atual em `veiculos.cliente_id`.
- Registrar cada transferência em `historico_proprietarios_veiculos`.
- Preservar o cliente original nas ordens antigas.
- Preparar a regra de bloqueio por ordem em andamento para integração no módulo de ordens.
- Conceder as operações do módulo aos perfis administrador e atendente ativos.
- Não permitir exclusão física pela API comum.

## 3. Estrutura prevista

```text
src/
  app/(sistema)/
    clientes/[id]/page.tsx
    veiculos/
      page.tsx
      novo/page.tsx
      [id]/page.tsx
      [id]/editar/page.tsx
  components/layout/app-shell.tsx
  features/
    clientes/queries.ts
    veiculos/
      actions.ts
      formatters.ts
      queries.ts
      schemas.ts
      schemas.test.ts
      types.ts
      components/
        vehicle-form.tsx
        vehicle-form.test.tsx
        vehicle-list.tsx
        vehicle-list.test.tsx
        vehicle-status-action.tsx
        vehicle-transfer-form.tsx
        vehicle-transfer-form.test.tsx
  types/database.ts
supabase/
  migrations/20260906145000_create_vehicles.sql
scripts/
  validar-veiculos-rls.mjs
tests/e2e/
  veiculos.spec.ts
```

Os nomes poderão receber pequenos ajustes para acompanhar os padrões reais encontrados no módulo de clientes sem alterar essas responsabilidades.

## 4. Tarefa 1 — Implementar validação e normalização

### Arquivos

- Criar `src/features/veiculos/schemas.ts`.
- Criar `src/features/veiculos/schemas.test.ts`.
- Criar `src/features/veiculos/formatters.ts`.
- Criar `src/features/veiculos/types.ts`.

### Testes primeiro

1. Placa antiga válida, como `ABC-1234`, é normalizada para `ABC1234`.
2. Placa Mercosul válida, como `ABC1D23`, é aceita.
3. Placas com formato, quantidade ou caracteres inválidos são rejeitadas.
4. Marca e modelo são aparados e têm espaços internos normalizados.
5. Anos abaixo de 1900 ou acima do ano corrente mais um são rejeitados.
6. Ano do modelo anterior ou mais de um ano posterior à fabricação é rejeitado.
7. Combustível aceita somente os valores definidos ou ausência de valor.
8. Identificadores e limites de texto são validados.

### Implementação

- Criar normalizadores puros para placa e textos.
- Criar esquemas Zod de cadastro, edição, transferência e busca.
- Manter valores de formulário separados dos DTOs persistidos quando necessário.
- Criar formatador visual da placa sem mudar seu valor persistido.

### Verificação

```bash
npm run test -- src/features/veiculos/schemas.test.ts
npm run typecheck
```

## 5. Tarefa 2 — Criar banco, transferência atômica e RLS

### Arquivos

- Criar `supabase/migrations/20260906145000_create_vehicles.sql`.
- Criar `scripts/validar-veiculos-rls.mjs`.
- Atualizar `package.json` com o comando `test:vehicles:rls`.

### Banco

1. Criar `veiculos` com chaves, restrições de conteúdo, anos, situação e timestamps.
2. Criar restrição única global para `placa`.
3. Criar índices para cliente, marca/modelo, situação e pesquisa por placa.
4. Criar `historico_proprietarios_veiculos` com referências ao veículo, aos dois clientes e ao usuário.
5. Impedir alterações e exclusões diretas do histórico pela API comum.
6. Criar gatilho de `atualizado_em`.
7. Criar função transacional de transferência com `search_path` fixo, bloqueio da linha do veículo e validação interna de usuário, perfil e clientes.
8. Impedir transferência para o proprietário atual.
9. Habilitar RLS e conceder somente as operações necessárias.

### Testes de integração

- Anônimo não consulta nem grava.
- Administrador e atendente ativos consultam, inserem e atualizam.
- Conta inativa não gerencia veículos.
- Cliente inexistente ou inativo não recebe veículo.
- Placa duplicada é rejeitada mesmo se o primeiro veículo estiver inativo.
- Exclusão física de veículo e histórico é bloqueada.
- Transferência altera o proprietário e cria um único histórico.
- Tentativa inválida não produz atualização parcial.
- Inserção ou alteração direta do histórico é bloqueada.

### Aplicação

```bash
npx supabase db push
npm run test:vehicles:rls
```

A migração será revisada antes de ser aplicada. Correções posteriores serão feitas em nova migração se a original já tiver sido enviada ao Supabase.

## 6. Tarefa 3 — Criar consultas e tipos do banco

### Arquivos

- Atualizar `src/types/database.ts`.
- Criar `src/features/veiculos/queries.ts`.
- Ajustar `src/features/clientes/queries.ts` somente para a integração de veículos.

### Implementação

1. Tipar as tabelas e a função de transferência.
2. Listar veículos com proprietário atual, busca, situação e paginação.
3. Buscar detalhe por UUID com dados do cliente.
4. Listar histórico de proprietários em ordem decrescente.
5. Listar clientes ativos para seleção sem expor dados desnecessários.
6. Listar veículos atuais na página do cliente.
7. Retornar DTOs mínimos e mensagens seguras.

### Verificação

```bash
npm run typecheck
npm run lint
```

## 7. Tarefa 4 — Implementar Server Actions

### Arquivos

- Criar `src/features/veiculos/actions.ts`.
- Criar testes próximos às unidades que puderem ser isoladas.

### Implementação

1. Criar veículo após revalidar sessão, permissão, dados e cliente ativo.
2. Editar somente dados do veículo; não aceitar `cliente_id` na edição comum.
3. Transferir por meio da função transacional do banco.
4. Inativar e reativar sem exclusão.
5. Mapear placa duplicada, cliente inválido e estado inválido para mensagens orientativas.
6. Revalidar listas, detalhe do veículo e páginas dos clientes afetados.
7. Impedir envios duplicados na interface e validar novamente no servidor.

### Verificação

```bash
npm run test
npm run typecheck
```

## 8. Tarefa 5 — Criar formulário e páginas de inclusão e edição

### Arquivos

- Criar `src/features/veiculos/components/vehicle-form.tsx`.
- Criar `src/features/veiculos/components/vehicle-form.test.tsx`.
- Criar `src/app/(sistema)/veiculos/novo/page.tsx`.
- Criar `src/app/(sistema)/veiculos/[id]/editar/page.tsx`.

### Testes primeiro

- Renderização dos campos e valores iniciais.
- Máscara e normalização visual de placa.
- Mensagens de campos obrigatórios e anos incompatíveis.
- Cliente previamente selecionado por parâmetro válido.
- Estado pendente bloqueia reenvio.
- Erro esperado preserva dados.

### Interface

- Separar proprietário, identificação, características e observações.
- Usar seleção de clientes ativos com busca ou filtragem adequada ao volume atual.
- Usar lista controlada para combustível.
- Manter rótulos visíveis, foco no primeiro erro e alvos de interação adequados.
- Redirecionar ao detalhe após inclusão e retornar ao detalhe após edição.

## 9. Tarefa 6 — Criar listagem, detalhes e ações

### Arquivos

- Criar `src/features/veiculos/components/vehicle-list.tsx`.
- Criar `src/features/veiculos/components/vehicle-list.test.tsx`.
- Criar `src/features/veiculos/components/vehicle-status-action.tsx`.
- Criar `src/features/veiculos/components/vehicle-transfer-form.tsx`.
- Criar `src/features/veiculos/components/vehicle-transfer-form.test.tsx`.
- Criar `src/app/(sistema)/veiculos/page.tsx`.
- Criar `src/app/(sistema)/veiculos/[id]/page.tsx`.
- Atualizar `src/components/layout/app-shell.tsx` para ativar o link Veículos.

### Testes primeiro

- Lista preenchida, vazia e sem resultados.
- Busca e filtros refletidos nos parâmetros da URL.
- Cartões responsivos em telas estreitas.
- Detalhe exibe proprietário e dados completos.
- Histórico vazio e preenchido.
- Transferência exige outro cliente e confirmação.
- Inativação e reativação exigem confirmação.

### Interface

- Reutilizar estrutura visual, paginação, mensagens e estados do módulo de clientes.
- Exibir placa formatada, marca/modelo, anos, proprietário e situação.
- Não exibir ação de exclusão.
- Deixar futuras quilometragens e ordens claramente identificadas como integração posterior, sem controles inoperantes.

## 10. Tarefa 7 — Integrar veículos aos detalhes do cliente

### Arquivos

- Atualizar `src/app/(sistema)/clientes/[id]/page.tsx`.
- Criar componente compartilhado somente se a página ficar grande ou duplicada.

### Implementação

1. Substituir a área reservada por uma lista dos veículos atualmente vinculados.
2. Exibir situação e link para o detalhe de cada veículo.
3. Adicionar “Cadastrar veículo para este cliente” com o cliente preenchido.
4. Tratar cliente sem veículos.
5. Não misturar antigos proprietários na lista de veículos atuais.

## 11. Tarefa 8 — Testes ponta a ponta e aceite

### Arquivos

- Criar `tests/e2e/veiculos.spec.ts`.
- Atualizar testes visuais somente onde a navegação mudar.

### Cenários

1. Administrador cadastra veículo para cliente ativo.
2. Veículo aparece na busca por placa e na página do cliente.
3. Atendente edita dados sem trocar proprietário pela edição comum.
4. Transferência move o veículo para outro cliente e preserva o histórico.
5. Placa duplicada é rejeitada.
6. Veículo é inativado e reativado.
7. Exclusão física permanece bloqueada.
8. Listagem e formulários não criam rolagem horizontal indevida.

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
npx supabase db lint --linked
```

Os testes remotos usarão dados sintéticos identificáveis e os removerão ao final, inclusive em caso de falha sempre que possível.

## 12. Documentação e revisão final

### Arquivos

- Atualizar `README.md` com o novo comando RLS e o estado do módulo.
- Manter a especificação e este plano como referência do TCC.

### Revisão

- Conferir autorização em todas as Server Actions.
- Conferir RLS, grants e caminhos negativos.
- Confirmar que a chave administrativa não é usada nas operações normais.
- Confirmar que nenhuma exclusão física foi concedida.
- Buscar segredos, logs e dados pessoais reais no diff.
- Executar `git diff --check` e revisar todas as mudanças.

## 13. Estratégia de commits

Commits convencionais e separados por responsabilidade:

1. `docs: planeja cadastro de veiculos`
2. `feat: adiciona estrutura de dados de veiculos`
3. `feat: adiciona operacoes de veiculos`
4. `feat: adiciona interface de veiculos`
5. `feat: integra veiculos aos clientes`
6. `test: cobre cadastro de veiculos`
7. `docs: documenta cadastro de veiculos`

O push e a integração remota serão realizados somente quando solicitados ou quando houver autorização explícita para essa etapa externa.

## 14. Definição de pronto

O módulo estará pronto quando as regras da especificação estiverem implementadas, a migração tiver sido aplicada ao Supabase de desenvolvimento, o histórico de transferências for atômico, as duas funções de usuário forem respeitadas, todos os testes passarem, o build concluir e o repositório não contiver segredos nem dados pessoais reais.
