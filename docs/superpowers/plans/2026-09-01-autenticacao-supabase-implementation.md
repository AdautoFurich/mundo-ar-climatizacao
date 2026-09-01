# Plano de implementação — Autenticação e perfis

Data: 1º de setembro de 2026

Base: `docs/superpowers/specs/2026-09-01-autenticacao-supabase-design.md`

Branch: `feature/autenticacao`

## 1. Objetivo

Entregar autenticação real com Supabase, sessão SSR, recuperação de senha, três perfis, contas inativas, administração de funcionários e proteção em três níveis: interface, servidor e banco com RLS.

O trabalho seguirá testes primeiro sempre que a unidade puder ser isolada. Cada tarefa deve terminar com testes relevantes aprovados e diff revisado. Nenhuma credencial será incluída no Git.

## 2. Decisões técnicas confirmadas

- Usar `@supabase/ssr` para sessões em cookies no Next.js.
- Usar `proxy.ts`, convenção do Next.js 16, e não `middleware.ts`.
- Usar `await cookies()` nas integrações de servidor.
- Validar identidade no servidor com `getClaims()` ou `getUser()`; nunca confiar em `getSession()` para autorização.
- Manter autorização em uma camada de acesso a dados marcada como `server-only`.
- Revalidar autenticação e permissão dentro de cada Server Action.
- Usar as chaves atuais do Supabase: publishable no cliente e secret somente no servidor.
- Usar Server Actions para mutações e Route Handler somente para confirmar códigos recebidos por e-mail.
- Não usar ISR ou cache compartilhado nas rotas autenticadas.
- Não instalar nem exigir Docker nesta etapa.

## 3. Variáveis de ambiente

O arquivo `.env.example` documentará apenas nomes sem valores:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_ATENDENTE_EMAIL=
E2E_ATENDENTE_PASSWORD=
E2E_TECNICO_EMAIL=
E2E_TECNICO_PASSWORD=
```

Os valores reais ficarão em `.env.local`, já ignorado pelo Git, e nos segredos do ambiente de CI quando ele for criado. A chave secreta terá acesso somente por módulos `server-only`.

## 4. Estrutura prevista

```text
src/
  app/
    (auth)/
      login/page.tsx
      esqueci-senha/page.tsx
      atualizar-senha/page.tsx
    (sistema)/
      layout.tsx
      page.tsx
      usuarios/page.tsx
    acesso-negado/page.tsx
    conta-inativa/page.tsx
    auth/confirm/route.ts
  components/
    layout/app-shell.tsx
    shared/form-message.tsx
    ui/input.tsx
    ui/label.tsx
  features/auth/
    actions.ts
    permissions.ts
    schemas.ts
    types.ts
    components/
  features/usuarios/
    actions.ts
    queries.ts
    schemas.ts
    components/
  lib/
    env.ts
    auth/guards.ts
    supabase/client.ts
    supabase/server.ts
    supabase/admin.ts
    supabase/proxy.ts
  proxy.ts
supabase/
  config.toml
  migrations/
  tests/
scripts/
  criar-primeiro-administrador.mjs
tests/e2e/
  auth.spec.ts
  permissions.spec.ts
```

Os nomes poderão sofrer pequenos ajustes exigidos pelas APIs instaladas, sem mudar as responsabilidades definidas.

## 5. Tarefa 1 — Criar e vincular o projeto Supabase

### Ações

1. Confirmar ou criar a conta Supabase do responsável.
2. Criar o projeto privado `mundo-ar-climatizacao-dev` na região adequada ao Brasil.
3. Gerar e guardar a senha do banco fora do repositório.
4. Obter URL, publishable key e secret key pelo painel.
5. Criar `.env.local` sem exibir os valores em logs ou respostas.
6. Inicializar a pasta Supabase com `npx supabase init`.
7. Autenticar a CLI e vincular o projeto com `npx supabase link`.
8. Configurar Site URL e URLs locais permitidas para convite e recuperação.
9. Desabilitar cadastro público.

### Verificações

- `git status --short` não mostra `.env.local`.
- `npx supabase projects list` identifica o projeto vinculado.
- Uma consulta segura confirma conectividade sem imprimir chaves.

### Dependência humana

Se a conta exigir login, confirmação por e-mail ou 2FA, o usuário concluirá essa etapa no navegador. A criação do projeto somente ocorrerá após a confirmação explícita da tela e da região escolhida.

## 6. Tarefa 2 — Instalar dependências e validar ambiente

### Arquivos

- Modificar `package.json`.
- Modificar `package-lock.json`.
- Modificar `.env.example`.
- Criar `src/lib/env.ts` e seu teste.

### Ações

1. Instalar `@supabase/supabase-js`, `@supabase/ssr` e `server-only`.
2. Manter React Hook Form, Zod e os testes já instalados.
3. Criar validação de variáveis públicas e privadas, sem retornar valores sensíveis.
4. Fazer os módulos de servidor falharem com mensagem segura quando a configuração estiver incompleta.

### Testes primeiro

- Variáveis públicas ausentes são detectadas.
- Chave secreta ausente é detectada somente ao criar o cliente administrativo.
- Nenhuma mensagem de erro contém o valor de uma chave.

### Verificações

```bash
npm run test
npm run typecheck
```

## 7. Tarefa 3 — Criar esquema, funções e RLS

### Arquivos

- Criar `supabase/migrations/<timestamp>_create_user_profiles.sql`.
- Criar `supabase/tests/perfis_usuarios_rls.test.sql` como evidência executável quando houver ambiente Postgres de testes.
- Criar teste de integração equivalente para o projeto remoto, sem Docker.

### Banco

1. Criar enum `perfil_usuario` com `administrador`, `atendente` e `tecnico`.
2. Criar `public.perfis_usuarios`, cuja chave primária referencia `auth.users(id)`.
3. Adicionar nome, perfil, ativo, criado_em e atualizado_em.
4. Criar restrições para nome não vazio e timestamps válidos.
5. Criar trigger de atualização de `atualizado_em`.
6. Criar trigger de `auth.users` para gerar o perfil a partir de metadados de convite.
7. Fixar `search_path` em qualquer função com privilégios elevados.
8. Criar helper privado para verificar administrador sem provocar recursão de políticas.
9. Habilitar RLS, revogar privilégios padrão e conceder somente operações necessárias.

### Políticas

- Usuário autenticado pode consultar o próprio perfil, inclusive para detectar inativação.
- Administrador ativo pode consultar todos os perfis.
- Administrador ativo pode alterar nome, perfil e situação de outras contas.
- Administrador não pode inativar a própria conta pela aplicação.
- Usuários comuns não podem inserir, alterar ou excluir perfis diretamente.
- Usuário anônimo não possui acesso à tabela.
- Exclusão física não é concedida a nenhum perfil da aplicação.

### Testes primeiro

- Anônimo não lê nem grava.
- Atendente e técnico leem somente o próprio perfil.
- Administrador lista e altera outras contas.
- Atendente não promove a si próprio.
- Administrador não inativa a própria conta.
- Conta inativa não adquire privilégios administrativos.
- Trigger cria exatamente um perfil com enum válido.

### Aplicação

```bash
npx supabase db push
```

A migração será revisada antes do envio ao projeto remoto. Alterações posteriores serão feitas por nova migração, nunca editando silenciosamente uma migração já aplicada.

## 8. Tarefa 4 — Criar clientes Supabase e renovação de sessão

### Arquivos

- Criar `src/lib/supabase/client.ts`.
- Criar `src/lib/supabase/server.ts`.
- Criar `src/lib/supabase/admin.ts`.
- Criar `src/lib/supabase/proxy.ts`.
- Criar `src/proxy.ts`.

### Ações

1. Criar cliente de navegador com publishable key.
2. Criar cliente por requisição no servidor com `await cookies()`.
3. Criar cliente administrativo em módulo `server-only` com persistência de sessão desativada.
4. Implementar `updateSession` no proxy com cópia correta dos cookies e cabeçalhos de não cache.
5. Excluir arquivos estáticos do matcher.
6. Renovar sessão e realizar apenas redirecionamentos rápidos no proxy.
7. Não considerar o proxy como única barreira de autorização.

### Testes primeiro

- Matcher ignora arquivos estáticos.
- Rotas públicas permanecem acessíveis sem sessão.
- Rotas privadas sem identidade válida direcionam ao login.
- Cliente administrativo não pode ser importado por componente cliente.

## 9. Tarefa 5 — Implementar domínio de autenticação e permissões

### Arquivos

- Criar `src/features/auth/types.ts`.
- Criar `src/features/auth/schemas.ts`.
- Criar `src/features/auth/permissions.ts`.
- Criar `src/lib/auth/guards.ts`.
- Criar testes próximos aos módulos.

### Ações

1. Definir tipos de perfil e usuário visível pela interface.
2. Criar schemas de login, recuperação e atualização de senha.
3. Criar matriz central de permissões.
4. Implementar `getCurrentUser`, `requireUser` e `requirePermission` em DAL `server-only`.
5. Validar identidade com `getClaims()` ou `getUser()` e carregar perfil mínimo pelo banco.
6. Bloquear perfil inexistente ou inativo.
7. Retornar DTO mínimo, sem tokens ou registros completos.

### Testes primeiro

- E-mail é normalizado.
- Senha respeita a política definida.
- Os três perfis recebem somente permissões esperadas.
- Perfil inativo é rejeitado.
- Guarda diferencia não autenticado de não autorizado.

## 10. Tarefa 6 — Reorganizar rotas públicas e privadas

### Arquivos

- Mover o dashboard atual para `src/app/(sistema)/page.tsx`.
- Criar `src/app/(sistema)/layout.tsx`.
- Modificar `src/components/layout/app-shell.tsx`.
- Criar `src/app/acesso-negado/page.tsx`.
- Criar `src/app/conta-inativa/page.tsx`.

### Ações

1. Manter o layout raiz neutro.
2. Aplicar `AppShell` somente ao grupo privado.
3. Carregar usuário e perfil no layout privado pelo servidor.
4. Substituir nome e perfil simulados pelos dados reais.
5. Transformar navegação em links reais e exibir itens conforme permissão.
6. Implementar logout como mutação POST por Server Action.
7. Preservar acessibilidade, foco visível e adaptação básica para telas menores.

### Testes primeiro

- Layout privado recebe DTO mínimo do usuário.
- Menu exibe Usuários somente para administrador.
- Logout não é executado por GET.
- Dashboard atual continua renderizando dentro do shell.

## 11. Tarefa 7 — Implementar login e logout

### Arquivos

- Criar `src/app/(auth)/layout.tsx`.
- Criar `src/app/(auth)/login/page.tsx`.
- Criar `src/features/auth/actions.ts`.
- Criar `src/features/auth/components/login-form.tsx`.
- Criar componentes compartilhados de campo e mensagem quando necessários.

### Ações

1. Criar tela pública coerente com a identidade visual existente.
2. Validar dados no navegador para usabilidade e novamente na Server Action.
3. Autenticar com `signInWithPassword`.
4. Usar mensagem genérica para credenciais inválidas.
5. Verificar perfil ativo antes de concluir o acesso.
6. Redirecionar ao dashboard e impedir redirecionamento aberto por parâmetro externo.
7. Implementar logout com nova verificação de sessão e limpeza dos cookies.

### Testes primeiro

- Campos obrigatórios e formato do e-mail.
- Estado pendente impede envio repetido.
- Credenciais inválidas não revelam existência do e-mail.
- Login válido redireciona ao dashboard.
- Logout retorna ao login.

## 12. Tarefa 8 — Implementar convite e recuperação de senha

### Arquivos

- Criar `src/app/(auth)/esqueci-senha/page.tsx`.
- Criar `src/app/(auth)/atualizar-senha/page.tsx`.
- Criar `src/app/auth/confirm/route.ts`.
- Criar formulários e testes em `src/features/auth/components/`.

### Ações

1. Solicitar recuperação com `resetPasswordForEmail` e resposta neutra.
2. Criar callback que valida `token_hash`, tipo permitido e destino interno.
3. Trocar o código por sessão usando o fluxo PKCE recomendado.
4. Atualizar senha somente quando houver sessão de recuperação válida.
5. Rejeitar links inválidos, expirados ou com redirecionamento externo.
6. Usar a mesma rota de confirmação para convites, direcionando à definição da senha.
7. Configurar modelos de e-mail e allow list de redirecionamento no Supabase.

### Testes primeiro

- Solicitação sempre retorna mensagem neutra.
- Destino externo é rejeitado.
- Token inválido mostra orientação recuperável.
- Senhas divergentes ou fracas são recusadas.
- Senha válida é atualizada e permite novo login.

## 13. Tarefa 9 — Implementar administração de usuários

### Arquivos

- Criar `src/features/usuarios/schemas.ts`.
- Criar `src/features/usuarios/queries.ts`.
- Criar `src/features/usuarios/actions.ts`.
- Criar componentes em `src/features/usuarios/components/`.
- Criar `src/app/(sistema)/usuarios/page.tsx`.

### Ações

1. Criar listagem de funcionários com nome, e-mail, perfil e situação.
2. Obter e-mail pela Admin API somente no servidor e devolver DTO mínimo.
3. Criar formulário de convite com nome, e-mail e perfil.
4. Verificar permissão administrativa antes de usar a secret key.
5. Enviar metadados validados para o trigger criar o perfil na mesma criação do usuário.
6. Implementar ativação e inativação com cliente da sessão, sujeitas a RLS.
7. Impedir autoinativação e exclusão física.
8. Tratar convite duplicado e falha do provedor sem expor detalhes internos.

### Testes primeiro

- Somente administrador abre a página.
- Entrada inválida não chama a Admin API.
- Atendente e técnico não convidam nem alteram contas.
- Convite válido gera perfil correspondente.
- Administrador altera outra conta, mas não inativa a própria.
- Retornos ao navegador não contêm metadados internos ou tokens.

## 14. Tarefa 10 — Bootstrap, dados de teste e documentação

### Arquivos

- Criar `scripts/criar-primeiro-administrador.mjs`.
- Criar ou atualizar `supabase/seed.sql` somente com dados não sensíveis.
- Atualizar `README.md`.
- Atualizar `.env.example`.

### Ações

1. Criar script local que convida o primeiro administrador usando variáveis efêmeras.
2. Falhar se já existir administrador, salvo opção explícita e segura.
3. Não aceitar senha em argumento de linha de comando nem gravá-la em arquivo.
4. Documentar criação do projeto, aplicação de migrações, bootstrap e URLs de redirecionamento.
5. Documentar como criar contas exclusivas de teste sem versionar senhas.
6. Registrar limitações do e-mail padrão e necessidade de SMTP próprio para produção.

### Verificações

- Busca por padrões de segredo no diff.
- Execução do bootstrap em ambiente de desenvolvimento.
- Primeiro administrador conclui o convite e entra no sistema.

## 15. Tarefa 11 — Testes ponta a ponta e aceite

### Arquivos

- Atualizar `tests/e2e/smoke.spec.ts`.
- Criar `tests/e2e/auth.spec.ts`.
- Criar `tests/e2e/permissions.spec.ts`.
- Ajustar `playwright.config.ts` se necessário.

### Cenários

1. Visitante abre login e não acessa dashboard.
2. Administrador entra, vê Usuários e sai.
3. Atendente entra e não vê nem acessa Usuários.
4. Técnico entra e não vê nem acessa Usuários.
5. Administrador convida um funcionário.
6. Recuperação de senha conclui com link válido.
7. Conta inativada perde acesso.
8. Rotas de autenticação funcionam no tamanho desktop de referência e sem rolagem horizontal indevida.

### Suíte final

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Testes que dependem do projeto remoto usarão somente contas dedicadas e variáveis locais. Dados criados pelos testes terão identificação própria e serão removidos de forma controlada.

## 16. Revisão de segurança

Antes do commit final da implementação:

- Verificar que `SUPABASE_SECRET_KEY` aparece somente em módulo `server-only`.
- Verificar que nenhum Client Component recebe registro bruto de usuário.
- Verificar autorização dentro de todas as Server Actions.
- Verificar que o proxy não é a única barreira de acesso.
- Verificar que `getSession()` não é usado para decisões de autorização.
- Verificar grants, RLS e casos negativos.
- Verificar que callbacks aceitam apenas destinos internos.
- Verificar que respostas de recuperação não permitem enumeração de e-mails.
- Verificar que senha, token e chave não aparecem em logs, testes, screenshots ou commits.
- Verificar que rotas autenticadas não usam cache público ou ISR.

## 17. Estratégia de commits

Os commits de implementação serão pequenos e convencionais, por exemplo:

1. `feat: configura supabase e perfis de usuario`
2. `feat: adiciona login e protecao de rotas`
3. `feat: adiciona recuperacao de senha`
4. `feat: adiciona administracao de usuarios`
5. `test: cobre autenticacao e permissoes`
6. `docs: documenta configuracao de autenticacao`

A branch somente será enviada e integrada após a suíte final, a revisão do diff e a confirmação de que não há segredos versionados.

## 18. Definição de pronto

A etapa estará pronta quando todos os dez critérios da especificação forem atendidos, o primeiro administrador estiver funcional, os três perfis forem demonstráveis, os testes positivos e negativos passarem e o código estiver pronto para Pull Request sem credenciais ou dados pessoais reais.
