# Navegação simplificada

## Objetivo

Reduzir a quantidade de opções simultaneamente visíveis no menu lateral da Mundo Ar Climatização, preservando todas as telas e funcionalidades existentes. A mudança se limita à organização da navegação e não altera o fluxo interno das ordens de serviço.

## Estrutura aprovada

O menu será organizado da seguinte forma:

- **Oficina**
  - Visão geral
  - Ordens de serviço
  - Cadastros
    - Clientes
    - Veículos
    - Serviços
- **Gestão**
  - Relatórios
- **Administração**
  - Usuários, visível somente para administradores
- **Rodapé**
  - Identificação de ambiente interno
  - Sair

Os itens Diagnósticos, Agenda e Configurações serão removidos do menu. Diagnósticos permanece como etapa da ordem de serviço, e os outros dois itens não possuem telas funcionais no escopo atual.

## Comportamento do grupo Cadastros

Cadastros será um agrupador expansível, implementado com controles nativos e sem dependência de JavaScript no cliente. O grupo ficará recolhido nas demais áreas e aberto por padrão em qualquer rota de Clientes, Veículos ou Serviços.

O agrupador informará seu estado expandido à tecnologia assistiva. O usuário poderá abri-lo e fechá-lo por mouse, toque ou teclado. Os filhos continuarão sendo links comuns, portanto suas rotas permanecerão acessíveis diretamente.

## Indicação de localização

O item filho correspondente à rota atual receberá `aria-current="page"` e o destaque visual já usado no sistema. Quando um filho estiver ativo, o cabeçalho Cadastros também receberá uma indicação visual discreta, sem competir com o destaque do destino atual.

O mesmo componente de navegação será usado nas versões desktop e móvel. O menu móvel manterá seu painel atual, incluindo rolagem quando a altura da tela exigir.

## Permissões e rotas

As permissões existentes não serão modificadas. Administrador e Atendente continuarão vendo as opções operacionais, enquanto Usuários permanecerá exclusivo do Administrador.

Nenhuma rota será criada, removida ou redirecionada. A mudança não exige migração do banco de dados.

## Acessibilidade e responsividade

- O controle Cadastros terá alvo de interação de pelo menos 44 pixels.
- O foco de teclado permanecerá visível.
- Ícones decorativos serão ocultados da árvore de acessibilidade.
- O estado ativo não dependerá somente de cor.
- Textos não serão truncados de forma a impedir a identificação do destino.
- O agrupador funcionará nos mesmos pontos de quebra do menu atual.

## Validação

Serão adicionados testes de componente para confirmar:

1. exibição da estrutura simplificada;
2. ausência dos itens sem tela funcional;
3. abertura padrão de Cadastros em suas rotas filhas;
4. indicação do link ativo;
5. visibilidade de Usuários conforme o perfil;
6. existência dos links reais para todas as telas preservadas.

A entrega também deverá passar por ESLint, verificação de tipos, suíte completa de testes e build de produção.

## Fora do escopo

- Alterar etapas ou regras das ordens de serviço;
- Unificar ou excluir telas de cadastro;
- Criar Agenda ou Configurações;
- Mudar papéis e permissões;
- Alterar banco de dados;
- Redesenhar o restante da interface.
