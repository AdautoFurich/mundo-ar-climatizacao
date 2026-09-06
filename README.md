# Mundo Ar Climatização

Sistema web de apoio à operação da oficina Mundo Ar Climatização, desenvolvido como projeto de TCC do curso de Análise e Desenvolvimento de Sistemas.

## Escopo da primeira versão

- Cadastros de clientes, veículos e serviços.
- Ordem de serviço da entrada do veículo até a entrega.
- Relatórios por período e por serviços mais realizados.
- Histórico de manutenção por veículo.
- Autenticação com perfis de administrador e atendente.

## Módulos implementados

- Autenticação e gestão de usuários.
- Dashboard operacional responsivo.
- Cadastro de clientes pessoas físicas.
- Cadastro de veículos, com transferência auditada de proprietário.

## Tecnologias

- Next.js, React e TypeScript.
- Tailwind CSS e componentes no padrão shadcn/ui.
- React Hook Form e Zod.
- Supabase PostgreSQL, Auth e Row Level Security (RLS).
- Vitest, Testing Library e Playwright.
- Vercel, GitHub e GitHub Actions.

## Executar localmente

Requisitos: Node.js 24 (ou uma versão compatível com o Next.js instalado), npm e acesso ao projeto Supabase.

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha as quatro variáveis. O arquivo local é ignorado pelo Git e nunca deve ser versionado.

```bash
npm run dev
```

A aplicação estará em `http://127.0.0.1:3000`.

## Supabase

Vincule a CLI ao projeto de desenvolvimento e aplique as migrações:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

O cadastro público fica desabilitado. Para convidar o primeiro administrador:

```bash
npm run admin:create -- --email "administrador@empresa.com" --nome "Nome completo"
```

O administrador define a própria senha pelo link recebido. Os demais funcionários são convidados pela página **Usuários**.

O provedor de e-mail padrão do plano gratuito não permite publicar modelos personalizados. O callback atual aceita os links padrão. Os modelos SSR em `supabase/templates` ficam preparados para uso futuro com SMTP próprio.

## Verificações

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:rls
npm run test:clients:rls
npm run test:vehicles:rls
```

Os comandos de teste RLS usam o projeto de desenvolvimento configurado no `.env.local`, criam dados sintéticos e os removem ao final.

## Documentação

- Especificação do sistema: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`.
- Plano do sistema: `docs/superpowers/plans/2026-08-31-mundo-ar-implementation.md`.
- Especificação de autenticação: `docs/superpowers/specs/2026-09-01-autenticacao-supabase-design.md`.
- Plano de autenticação: `docs/superpowers/plans/2026-09-01-autenticacao-supabase-implementation.md`.
- Especificação de clientes: `docs/superpowers/specs/2026-09-01-cadastro-clientes-design.md`.
- Especificação de veículos: `docs/superpowers/specs/2026-09-06-cadastro-veiculos-design.md`.
- Plano de veículos: `docs/superpowers/plans/2026-09-06-cadastro-veiculos-implementation.md`.
- Especificação de serviços: `docs/superpowers/specs/2026-09-06-cadastro-servicos-design.md`.

## Branches

- `main`: versão estável.
- `feature/*`: funcionalidades.
- `fix/*`: correções.
- `docs/*`: documentação.
- `chore/*`: configuração e manutenção.
