# Plano de implementação — Processo de ordens de serviço

Data: 6 de setembro de 2026

Base: `docs/superpowers/specs/2026-09-06-ordens-servico-design.md`

Branch: `feature/ordens-servico`

## 1. Objetivo

Implementar o processo completo de ordens de serviço da Mundo Ar Climatização, desde a entrada do veículo até a entrega, integrando clientes, veículos, serviços e usuários. O módulo terá orçamento parcialmente autorizável, peças e materiais sem estoque, fluxo controlado de situações, histórico auditável, impressão e segurança coerente no navegador, servidor e banco.

O desenvolvimento será incremental: regras puras e testes primeiro, persistência transacional, operações de servidor, interface por etapa e, por fim, testes integrados e aceite manual.

## 2. Decisões técnicas

- Usar uma máquina de estados explícita para as situações da OS.
- Gerar o número sequencial por sequence do PostgreSQL; lacunas serão aceitáveis, duplicidades não.
- Manter UUID como chave técnica e exibir o número como `OS #0001`.
- Persistir valores em `numeric(12,2)` e manipular entradas como centavos ou strings decimais nas regras TypeScript.
- Recalcular subtotais e totais no banco; valores enviados pela interface nunca serão considerados autoridade.
- Guardar snapshots de cliente, veículo e itens para preservar documentos históricos.
- Usar uma coluna de versão incrementada nas mutações para detectar edições concorrentes.
- Centralizar mutações críticas em funções transacionais do PostgreSQL.
- Permitir leitura das tabelas à equipe ativa por RLS, mas bloquear escrita direta e exclusão.
- Conceder execução somente das funções aprovadas a usuários autenticados; cada função validará conta, perfil, situação e autoria.
- Adicionar `ordens:administrar` apenas ao administrador para desconto, retrocesso e reabertura.
- Preservar histórico somente por acréscimo.
- Preparar a impressão com HTML e CSS de impressão, sem biblioteca de PDF.

## 3. Estrutura prevista

```text
src/
  app/(sistema)/
    ordens-servico/
      page.tsx
      nova/page.tsx
      [id]/page.tsx
      [id]/imprimir/page.tsx
  features/
    ordens-servico/
      actions/
        approvals.ts
        diagnostics.ts
        intake.ts
        items.ts
        workflow.ts
      components/
        approval-panel.tsx
        delivery-form.tsx
        diagnosis-form.tsx
        intake-form.tsx
        order-detail.tsx
        order-list.tsx
        order-print.tsx
        order-summary.tsx
        quote-editor.tsx
        status-action.tsx
        timeline.tsx
      calculations.ts
      formatters.ts
      queries.ts
      schemas.ts
      state-machine.ts
      types.ts
supabase/
  migrations/*_create_service_orders.sql
scripts/
  validar-ordens-servico-rls.mjs
tests/e2e/
  ordens-servico.spec.ts
```

Os arquivos poderão ser subdivididos quando necessário, mantendo as responsabilidades acima.

## 4. Tarefa 1 — Implementar domínio, validações e cálculos

### Arquivos

- Criar `src/features/ordens-servico/types.ts`.
- Criar `src/features/ordens-servico/schemas.ts`.
- Criar `src/features/ordens-servico/state-machine.ts`.
- Criar `src/features/ordens-servico/calculations.ts`.
- Criar `src/features/ordens-servico/formatters.ts`.
- Criar os respectivos testes `*.test.ts`.

### Testes primeiro

1. Validar UUIDs, datas, quilometragem, combustível, relato, previsão e textos opcionais.
2. Rejeitar previsão anterior à entrada e quilometragem negativa.
3. Validar itens de serviço e itens manuais com limites de descrição, quantidade e valor.
4. Converter moeda brasileira sem usar ponto flutuante nas operações de domínio.
5. Calcular subtotal de serviços, subtotal de materiais, desconto, total orçado e total autorizado.
6. Rejeitar desconto negativo ou superior ao total.
7. Validar canal e decisão de autorização.
8. Aceitar somente as transições normais definidas.
9. Identificar retrocessos e reaberturas como ações administrativas.
10. Formatar número, valores, datas, placa e quilometragem.

### Implementação

- Definir constantes compartilhadas para situações, combustíveis, tipos de item, decisões, canais e formas de pagamento.
- Separar schemas por ação para não aceitar campos além dos necessários.
- Representar dinheiro como centavos nas funções puras e converter somente nas bordas.
- Retornar erros de domínio específicos e apresentáveis.

### Verificação

```bash
npm run test -- src/features/ordens-servico
npm run typecheck
```

## 5. Tarefa 2 — Criar estrutura de dados e segurança

### Arquivos

- Criar uma migração `supabase/migrations/*_create_service_orders.sql`.
- Atualizar `src/types/database.ts`.
- Atualizar `src/features/auth/permissions.ts` e seu teste.
- Criar `scripts/validar-ordens-servico-rls.mjs`.
- Adicionar `test:orders:rls` ao `package.json`.

### Tabelas

1. `ordens_servico`
   - UUID, número sequencial, cliente, veículo e responsável.
   - Situação, entrada, previsão, quilometragem, combustível e textos de entrada.
   - Snapshots essenciais do cliente e do veículo.
   - Subtotais, desconto, total orçado, total autorizado e total final.
   - Versão, datas e último usuário a alterar.
2. `ordens_servico_diagnosticos`
   - OS, descrição, observação, previsão, autoria e datas.
3. `ordens_servico_itens`
   - OS, tipo, serviço opcional, descrição snapshot, quantidade, valor unitário, subtotal, decisão atual, execução e ordenação.
4. `ordens_servico_aprovacoes`
   - OS, item, decisão, canal, observação, autoria e data.
5. `ordens_servico_entregas`
   - Uma entrega por OS, forma de pagamento, observação, autoria e data.
6. `ordens_servico_historico`
   - OS, tipo de evento, situações anterior e posterior, resumo, justificativa, metadados seguros, autoria e data.

### Restrições e índices

- Chaves estrangeiras e unicidade do número.
- Veículo e cliente coerentes no momento da abertura.
- Checks de situação, tipo, decisão, canal, combustível, valores e versão.
- Subtotais não negativos e quantidade positiva.
- Uma decisão atual por item e uma entrega por ordem.
- Índices por número, situação, cliente, veículo, responsável, entrada e previsão.
- Índices de apoio para itens, aprovações e histórico.
- Nenhuma exclusão física concedida a usuários comuns.

### Funções transacionais

- Abrir a ordem e criar o primeiro evento de histórico.
- Salvar diagnóstico e atualizar previsão.
- Incluir, editar e remover logicamente itens enquanto a etapa permitir.
- Registrar decisões por item e recalcular a situação resultante.
- Conceder desconto com verificação administrativa.
- Avançar etapa, iniciar/concluir itens e confirmar retirada.
- Cancelar, retroceder ou reabrir com justificativa e permissão adequada.
- Recalcular todos os totais a partir dos itens persistidos.
- Comparar a versão esperada e incrementá-la em cada mutação.

As funções usarão `security definer`, `search_path` vazio, nomes totalmente qualificados e validação explícita de `auth.uid()`. O privilégio de execução será revogado de `public` e concedido somente a `authenticated` quando necessário.

### RLS e testes de integração

- Visitante e usuário inativo não consultam nem executam ações.
- Administrador e atendente ativos consultam e operam o fluxo normal.
- Atendente não altera desconto, retrocede nem reabre.
- Escrita direta e exclusão falham para ambos os perfis.
- Relações inválidas, serviço inativo, responsável inativo e veículo de outro cliente são recusados.
- Transições inválidas e versões desatualizadas são recusadas.
- Duas aberturas recebem números distintos.
- O histórico não pode ser alterado nem excluído.

### Aplicação

```bash
npx supabase db push --dry-run
npx supabase db push
npm run test:orders:rls
npx supabase db lint --linked
```

A migração será revisada integralmente antes do `db push`. Depois de aplicada, correções estruturais serão feitas em novas migrações.

## 6. Tarefa 3 — Implementar consultas e opções relacionadas

### Arquivos

- Criar `src/features/ordens-servico/queries.ts`.
- Criar testes das transformações e parâmetros de busca.

### Consultas

1. Listar ordens com paginação, busca e filtros por situação, responsável e período.
2. Buscar por número, nome do cliente, veículo ou placa com entrada sanitizada.
3. Marcar atraso quando a previsão tiver vencido e a ordem ainda estiver aberta.
4. Carregar detalhe com entrada, diagnóstico, itens, aprovações, entrega e histórico.
5. Listar clientes ativos para a abertura.
6. Listar apenas veículos ativos do cliente selecionado.
7. Listar serviços ativos com seu valor-base.
8. Listar usuários ativos disponíveis como responsáveis.

As consultas retornarão DTOs mínimos, sem expor linhas brutas desnecessárias aos componentes clientes.

### Verificação

```bash
npm run test -- src/features/ordens-servico
npm run typecheck
npm run lint
```

## 7. Tarefa 4 — Abrir e listar ordens

### Arquivos

- Criar `src/features/ordens-servico/actions/intake.ts`.
- Criar `src/features/ordens-servico/components/intake-form.tsx` e teste.
- Criar `src/features/ordens-servico/components/order-list.tsx` e teste.
- Criar `src/app/(sistema)/ordens-servico/nova/page.tsx`.
- Criar `src/app/(sistema)/ordens-servico/page.tsx`.
- Ativar “Ordens de serviço” em `src/components/layout/app-shell.tsx`.

### Abertura

- Selecionar cliente e carregar seus veículos de forma dependente.
- Preencher automaticamente o responsável atual, permitindo escolher outro usuário ativo.
- Registrar entrada, quilometragem, combustível, relato, previsão, acessórios, avarias e observações.
- Revalidar sessão, permissão e formulário na Server Action.
- Chamar somente a função transacional de abertura.
- Redirecionar ao detalhe com confirmação de sucesso.

### Listagem

- Exibir número, veículo, cliente, entrada, previsão, situação, responsável e total atual.
- Implementar busca e filtros em parâmetros da URL.
- Destacar atrasos com texto e ícone, não apenas cor.
- Usar tabela no desktop e cartões em telas estreitas.
- Incluir estados vazio, sem resultados e falha segura.

## 8. Tarefa 5 — Criar detalhe, resumo e histórico

### Arquivos

- Criar `src/features/ordens-servico/components/order-detail.tsx`.
- Criar `src/features/ordens-servico/components/order-summary.tsx`.
- Criar `src/features/ordens-servico/components/timeline.tsx`.
- Criar testes dos componentes.
- Criar `src/app/(sistema)/ordens-servico/[id]/page.tsx`.

### Interface

- Manter número, situação, cliente, veículo, responsável, previsão e valor visíveis no topo.
- Organizar entrada, diagnóstico, orçamento, execução, entrega e histórico em seções claras.
- Mostrar a próxima ação principal conforme a situação.
- Mostrar conflitos de versão com orientação para recarregar.
- Exibir autoria e horário de cada evento da linha do tempo.
- Manter ações encerradas indisponíveis até eventual reabertura.

## 9. Tarefa 6 — Implementar diagnóstico e envio à aprovação

### Arquivos

- Criar `src/features/ordens-servico/actions/diagnostics.ts`.
- Criar `src/features/ordens-servico/actions/workflow.ts`.
- Criar `src/features/ordens-servico/components/diagnosis-form.tsx` e teste.
- Criar `src/features/ordens-servico/components/status-action.tsx` e teste.

### Fluxo

1. Avançar de `Aberta` para `Em diagnóstico`.
2. Salvar descrição técnica, observação e previsão atualizada.
3. Preservar autoria e alterações no histórico.
4. Bloquear envio sem diagnóstico válido e sem itens orçamentários.
5. Avançar para `Aguardando aprovação` com confirmação.

As ações enviarão a versão conhecida da OS e tratarão conflito separadamente de erro de validação.

## 10. Tarefa 7 — Implementar orçamento e aprovação parcial

### Arquivos

- Criar `src/features/ordens-servico/actions/items.ts`.
- Criar `src/features/ordens-servico/actions/approvals.ts`.
- Criar `src/features/ordens-servico/components/quote-editor.tsx` e teste.
- Criar `src/features/ordens-servico/components/approval-panel.tsx` e teste.

### Orçamento

- Adicionar serviço ativo copiando nome e valor sugerido, que poderá ser ajustado na OS.
- Adicionar peça ou material manual com descrição, quantidade e valor unitário.
- Editar ou remover logicamente itens somente nas etapas permitidas.
- Exibir subtotais separados, desconto, total orçado e total autorizado.
- Permitir desconto somente ao administrador.

### Aprovação

- Registrar decisão individual com canal, data, responsável e observação.
- Permitir aprovação total, parcial ou recusa completa.
- Alterar a OS para `Aprovada` se houver item aprovado e nenhuma decisão pendente.
- Alterar para `Reprovada` se todos os itens forem recusados.
- Preservar cada decisão no histórico de aprovações.

## 11. Tarefa 8 — Implementar execução, entrega e exceções administrativas

### Arquivos

- Completar `src/features/ordens-servico/actions/workflow.ts`.
- Criar `src/features/ordens-servico/components/delivery-form.tsx` e teste.
- Completar `status-action.tsx` para as ações administrativas.

### Execução

- Avançar de `Aprovada` para `Em execução`.
- Permitir marcar somente itens aprovados como executados.
- Exigir todos os itens autorizados concluídos antes de `Pronta para retirada`.

### Entrega

- Registrar forma de pagamento, observação, data e usuário.
- Avançar atomicamente para `Entregue`.
- Bloquear edições posteriores.

### Exceções

- Cancelar com justificativa.
- Retroceder etapa somente como administrador e com justificativa.
- Reabrir ordem entregue, reprovada ou cancelada somente como administrador e com justificativa.
- Preservar situação anterior, nova situação, autoria e motivo no histórico.

## 12. Tarefa 9 — Implementar impressão

### Arquivos

- Criar `src/features/ordens-servico/components/order-print.tsx` e teste.
- Criar `src/app/(sistema)/ordens-servico/[id]/imprimir/page.tsx`.
- Atualizar `src/app/globals.css` com regras `@media print` estritamente necessárias.

### Documento

- Identificação e contato da oficina.
- Número, situação e datas da OS.
- Dados snapshot do cliente e do veículo.
- Entrada, relato e diagnóstico.
- Itens, decisões, subtotais, desconto e totais.
- Entrega e observações.
- Campos de assinatura do cliente e do responsável.
- Ocultação da navegação e controles durante a impressão.

O resultado será verificado na tela e na pré-visualização de impressão do navegador.

## 13. Tarefa 10 — Testes ponta a ponta e aceite

### Arquivos

- Criar `tests/e2e/ordens-servico.spec.ts`.

### Cenários

1. Administrador abre uma OS com cliente e veículo ativos.
2. Veículo de outro cliente e cadastros inativos são recusados.
3. Atendente registra diagnóstico e monta orçamento com serviço e material.
4. Cliente aprova todos os itens e a OS é entregue.
5. Aprovação parcial calcula corretamente o total autorizado.
6. Recusa total encerra como `Reprovada`.
7. Atendente não concede desconto, retrocede nem reabre.
8. Administrador concede desconto e registra justificativas administrativas.
9. Conflito de versão não sobrescreve alterações.
10. Busca, filtros, atraso, impressão e histórico funcionam.
11. Listagem e detalhe não criam rolagem horizontal em desktop, celular, paisagem ou fonte ampliada.

Os testes remotos criarão dados sintéticos identificáveis e os removerão ao final, respeitando a ordem das chaves estrangeiras mesmo em caso de falha.

## 14. Documentação e suíte final

### Arquivos

- Atualizar `README.md` com o processo e o comando de RLS.
- Atualizar documentação funcional caso uma decisão aprovada precise ser esclarecida durante a implementação.

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
npm run test:orders:rls
npx supabase db lint --linked
```

### Revisão final

- Conferir cada transição e caminho negativo.
- Conferir que cálculos do banco e da interface produzem o mesmo resultado.
- Conferir privilégios SQL, RLS, funções e autorização administrativa.
- Confirmar que escrita direta, exclusão e alteração do histórico estão bloqueadas.
- Confirmar que snapshots não mudam quando cadastros relacionados são editados.
- Confirmar que nenhuma ação normal usa chave administrativa.
- Buscar segredos, logs e dados pessoais reais no diff.
- Executar `git diff --check` e revisar todas as mudanças.
- Realizar inspeção visual do desktop, celular, paisagem, fonte ampliada e impressão.

## 15. Estratégia de commits

Commits convencionais e separados por responsabilidade:

1. `docs: planeja processo de ordens de servico`
2. `feat: adiciona dominio de ordens de servico`
3. `feat: adiciona estrutura de dados de ordens`
4. `feat: permite abrir e consultar ordens`
5. `feat: adiciona detalhe e diagnostico da ordem`
6. `feat: adiciona orcamento e aprovacoes`
7. `feat: adiciona execucao e entrega da ordem`
8. `feat: adiciona impressao da ordem de servico`
9. `test: cobre processo de ordens de servico`
10. `docs: documenta processo de ordens de servico`

O push e a integração remota serão realizados somente quando solicitados.

## 16. Definição de pronto

O processo estará pronto quando todas as regras da especificação estiverem implementadas, a migração tiver sido aplicada ao Supabase de desenvolvimento, o fluxo completo funcionar para os dois perfis com as restrições previstas, cálculos e histórico forem confiáveis, a impressão estiver utilizável, a suíte e o build passarem e o usuário concluir os testes manuais na operação simulada da oficina.
