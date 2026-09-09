# Plano de implementação — Navegação simplificada

Data: 7 de setembro de 2026

Base: `docs/superpowers/specs/2026-09-07-navegacao-simplificada-design.md`

Branch: `feature/navegacao-simplificada`

## 1. Objetivo

Simplificar o menu lateral sem alterar rotas, permissões ou o fluxo das ordens de serviço. Clientes, Veículos e Serviços serão reunidos no agrupador expansível Cadastros; itens sem telas funcionais serão removidos.

## 2. Decisões confirmadas

- Manter Visão geral e Ordens de serviço como destinos diretos.
- Agrupar Clientes, Veículos e Serviços em Cadastros.
- Abrir Cadastros por padrão quando uma rota filha estiver ativa.
- Manter Relatórios como destino direto na seção Gestão.
- Exibir Usuários somente ao Administrador.
- Remover Diagnósticos, Agenda e Configurações do menu.
- Preservar ambiente interno e Sair no rodapé.
- Reutilizar o mesmo componente nos menus desktop e móvel.
- Não alterar rotas, banco, papéis ou permissões.

## 3. Tarefa 1 — Cobrir a estrutura aprovada com testes

### Arquivos

- Atualizar `src/components/layout/app-shell.test.tsx` ou criar o teste equivalente junto ao componente.

### Testes primeiro

1. Administrador visualiza Visão geral, Ordens de serviço, Cadastros, Relatórios e Usuários.
2. Atendente visualiza a mesma navegação operacional, sem Usuários.
3. Diagnósticos, Agenda e Configurações não aparecem.
4. Cadastros contém links para Clientes, Veículos e Serviços.
5. Cadastros inicia aberto em qualquer rota filha e recolhido nas demais rotas.
6. O link filho atual recebe `aria-current="page"`.
7. A estrutura é renderizada tanto no menu desktop quanto no menu móvel.

### Verificação

```bash
npm test -- --run src/components/layout
```

## 4. Tarefa 2 — Refatorar a navegação lateral

### Arquivos

- Atualizar `src/components/layout/app-shell.tsx`.

### Implementação

1. Separar destinos diretos dos grupos de destinos.
2. Remover os três itens sem rota funcional.
3. Criar Cadastros com `details` e `summary`, preservando semântica nativa.
4. Calcular o estado ativo do grupo a partir do caminho atual.
5. Abrir o grupo por padrão quando Clientes, Veículos ou Serviços estiver ativo.
6. Manter os links filhos como rotas comuns do Next.js.
7. Preservar o controle de permissão de Usuários.
8. Manter a estrutura compartilhada por desktop e móvel.

### Acessibilidade

- Preservar foco visível.
- Manter alvo de interação de pelo menos 44 pixels.
- Usar `aria-current="page"` somente no destino atual.
- Ocultar ícones decorativos da árvore de acessibilidade.
- Exibir chevron que reflita visualmente a abertura do grupo.
- Não depender somente da cor para indicar o item atual.

## 5. Tarefa 3 — Ajustar estilos e validar responsividade

### Arquivos

- Atualizar `src/app/globals.css` somente se os seletores atuais não forem suficientes.

### Verificações

1. Menu desktop sem rolagem desnecessária na altura de referência.
2. Menu móvel operável com toque e teclado.
3. Rótulos completos em larguras estreitas.
4. Grupo aberto não encobre Ambiente interno nem Sair.
5. Indicação ativa coerente nas rotas de lista, detalhe, inclusão e edição.
6. Nenhuma mudança visual fora da navegação.

## 6. Suíte final

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Também serão executados `git diff --check` e uma revisão do diff para confirmar que nenhuma rota, permissão ou funcionalidade foi alterada incidentalmente.

## 7. Estratégia de commits

1. `docs: planeja navegacao simplificada`
2. `feat: simplifica navegacao lateral`

O push será realizado somente quando solicitado.

## 8. Definição de pronto

A navegação estará pronta quando o menu aprovado funcionar em desktop e celular, os itens sem tela tiverem sido removidos, Cadastros abrir corretamente, as permissões permanecerem intactas e a suíte completa passar.
