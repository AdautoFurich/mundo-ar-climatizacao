# Mundo Ar Climatização

Sistema web de apoio à operação da oficina Mundo Ar Climatização, desenvolvido como projeto de TCC do curso de Análise e Desenvolvimento de Sistemas.

## Escopo da primeira versão

- Cadastros de clientes, veículos e serviços.
- Ordem de serviço da entrada do veículo até a entrega.
- Relatório de ordens por período.
- Relatório de serviços mais realizados.
- Histórico de manutenção por veículo.

## Tecnologias

- Next.js, React e TypeScript.
- Tailwind CSS e componentes no padrão shadcn/ui.
- React Hook Form e Zod.
- Supabase PostgreSQL, Auth e RLS.
- Vitest, Testing Library e Playwright.
- Vercel, GitHub e GitHub Actions.

## Requisitos locais

- Node.js 24 ou uma versão compatível com a versão instalada do Next.js.
- npm.

## Executar o projeto

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Verificações

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha as variáveis somente quando a integração com o Supabase for iniciada. Nunca envie `.env.local` ao Git.

## Documentação

- Especificação: `docs/superpowers/specs/2026-08-31-mundo-ar-sistema-oficina-design.md`.
- Plano: `docs/superpowers/plans/2026-08-31-mundo-ar-implementation.md`.

## Branches

- `main`: versão estável.
- `feature/*`: funcionalidades.
- `fix/*`: correções.
- `docs/*`: documentação.
- `chore/*`: configuração e manutenção.
