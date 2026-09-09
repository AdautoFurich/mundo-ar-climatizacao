# Sistema visual — Mundo Ar Climatização

Origem: direção visual aprovada e regras gerais de interface. A busca automatizada do catálogo de design não foi executada porque o ambiente não possui Python.

## Intenção

Interface operacional para uma oficina de climatização automotiva. Deve comunicar precisão técnica, confiança e leitura rápida sem parecer um painel genérico.

## Tokens principais

- Azul compressor: `#102D3F` — marca e navegação.
- Verde operacional: `#0F766E` — ação principal e progresso.
- Verde-claro técnico: `#66D2C9` — foco da marca e estado ativo.
- Âmbar de pendência: `#A85C0E` — itens que exigem atenção. Escurecido de `#B86612` para atingir 4,5:1 sobre branco.
- Aço claro: `#EEF2F4` — fundo da aplicação.
- Tinta: `#172731` — texto principal.

## Tipografia

- Display: Archivo Narrow, carregada via `next/font/google` e exposta em `--font-display`.
- Corpo: Source Sans 3, carregada via `next/font/google` e exposta em `--font-body`.
- Ambas são self-hosted pelo Next. Nenhuma família depende do que o sistema operacional tem instalado.
- Escala de seis degraus: 11 / 12 / 14 / 16 / 20 / 30 px. Nada de conteúdo abaixo de 11 px.
- `text-2xs` (11 px) é o menor degrau, reservado a rótulos em versalete e selos.
- Dados importantes usam peso forte e alinhamento estável.

## Layout

- Desktop-first com menu lateral persistente a partir de 1024 px.
- Menu compacto em telas menores.
- Ritmo de espaçamento baseado em 4 e 8 px.
- Conteúdo operacional antes de informações secundárias.

## Assinatura

A navegação ativa recebe uma faixa vertical verde-clara, inspirada em etiquetas de acompanhamento de ordens de serviço. Essa é a única marca gráfica forte; o restante da interface permanece disciplinado.

## Acessibilidade e movimento

- Contraste mínimo de 4,5:1 para texto normal.
- Foco de teclado sempre visível.
- Ícones Lucide acompanhados por texto ou alternativa acessível.
- Alvos principais com pelo menos 44 px.
- Cor nunca é o único indicador de estado.
- Transições discretas e desativadas com `prefers-reduced-motion`.
