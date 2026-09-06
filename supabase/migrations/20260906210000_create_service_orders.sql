create sequence public.ordens_servico_numero_seq as bigint start with 1;

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null unique default nextval('public.ordens_servico_numero_seq'),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  veiculo_id uuid not null references public.veiculos (id) on delete restrict,
  responsavel_id uuid not null references public.perfis_usuarios (id) on delete restrict,
  situacao text not null default 'aberta' check (
    situacao in (
      'aberta', 'em_diagnostico', 'aguardando_aprovacao', 'aprovada',
      'em_execucao', 'pronta_retirada', 'entregue', 'reprovada', 'cancelada'
    )
  ),
  entrada_em timestamptz not null,
  previsao_conclusao_em timestamptz,
  quilometragem integer not null check (quilometragem between 0 and 9999999),
  nivel_combustivel text not null check (
    nivel_combustivel in ('reserva', 'um_quarto', 'metade', 'tres_quartos', 'cheio')
  ),
  relato_cliente text not null check (char_length(btrim(relato_cliente)) between 1 and 2000),
  acessorios text check (acessorios is null or char_length(acessorios) between 1 and 1000),
  avarias_visiveis text check (avarias_visiveis is null or char_length(avarias_visiveis) between 1 and 1000),
  observacoes_entrada text check (observacoes_entrada is null or char_length(observacoes_entrada) between 1 and 1000),
  cliente_nome text not null check (char_length(cliente_nome) between 2 and 120),
  cliente_cpf text not null check (cliente_cpf ~ '^[0-9]{11}$'),
  cliente_telefone text not null check (cliente_telefone ~ '^[0-9]{10,11}$'),
  veiculo_placa text not null check (veiculo_placa ~ '^[A-Z]{3}([0-9]{4}|[0-9][A-Z][0-9]{2})$'),
  veiculo_marca text not null check (char_length(veiculo_marca) between 1 and 60),
  veiculo_modelo text not null check (char_length(veiculo_modelo) between 1 and 80),
  veiculo_ano_fabricacao integer not null,
  veiculo_ano_modelo integer not null,
  subtotal_servicos numeric(12, 2) not null default 0 check (subtotal_servicos >= 0),
  subtotal_materiais numeric(12, 2) not null default 0 check (subtotal_materiais >= 0),
  subtotal_orcado numeric(12, 2) not null default 0 check (subtotal_orcado >= 0),
  subtotal_autorizado numeric(12, 2) not null default 0 check (subtotal_autorizado >= 0),
  desconto numeric(12, 2) not null default 0 check (desconto >= 0),
  total_orcado numeric(12, 2) not null default 0 check (total_orcado >= 0),
  total_autorizado numeric(12, 2) not null default 0 check (total_autorizado >= 0),
  total_final numeric(12, 2) not null default 0 check (total_final >= 0),
  versao integer not null default 1 check (versao > 0),
  criado_por uuid not null references public.perfis_usuarios (id) on delete restrict,
  atualizado_por uuid not null references public.perfis_usuarios (id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (previsao_conclusao_em is null or previsao_conclusao_em > entrada_em)
);

create table public.ordens_servico_diagnosticos (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  descricao text not null check (char_length(btrim(descricao)) between 1 and 5000),
  observacoes text check (observacoes is null or char_length(observacoes) between 1 and 2000),
  previsao_conclusao_em timestamptz,
  usuario_id uuid not null references public.perfis_usuarios (id) on delete restrict,
  criado_em timestamptz not null default now()
);

create table public.ordens_servico_itens (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  tipo text not null check (tipo in ('servico', 'material')),
  servico_id uuid references public.servicos (id) on delete restrict,
  descricao text not null check (char_length(btrim(descricao)) between 1 and 200),
  quantidade numeric(9, 3) not null check (quantidade > 0 and quantidade <= 999999.999),
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0),
  subtotal numeric(12, 2) generated always as (round(quantidade * valor_unitario, 2)) stored,
  situacao_aprovacao text not null default 'pendente' check (
    situacao_aprovacao in ('pendente', 'aprovado', 'recusado')
  ),
  executado_em timestamptz,
  executado_por uuid references public.perfis_usuarios (id) on delete restrict,
  ordem integer not null default 0 check (ordem >= 0),
  removido_em timestamptz,
  removido_por uuid references public.perfis_usuarios (id) on delete restrict,
  criado_por uuid not null references public.perfis_usuarios (id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (
    (tipo = 'servico' and servico_id is not null)
    or (tipo = 'material' and servico_id is null)
  ),
  check (
    (executado_em is null and executado_por is null)
    or (executado_em is not null and executado_por is not null)
  ),
  check (
    (removido_em is null and removido_por is null)
    or (removido_em is not null and removido_por is not null)
  )
);

create table public.ordens_servico_aprovacoes (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  item_id uuid not null references public.ordens_servico_itens (id) on delete cascade,
  decisao text not null check (decisao in ('aprovado', 'recusado')),
  canal text not null check (canal in ('whatsapp', 'telefone', 'presencial')),
  respondido_em timestamptz not null,
  observacoes text check (observacoes is null or char_length(observacoes) between 1 and 1000),
  usuario_id uuid not null references public.perfis_usuarios (id) on delete restrict,
  criado_em timestamptz not null default now()
);

create table public.ordens_servico_entregas (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null unique references public.ordens_servico (id) on delete cascade,
  forma_pagamento text not null check (
    forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'outro')
  ),
  entregue_em timestamptz not null,
  observacoes text check (observacoes is null or char_length(observacoes) between 1 and 2000),
  usuario_id uuid not null references public.perfis_usuarios (id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.ordens_servico_historico (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references public.ordens_servico (id) on delete cascade,
  evento text not null check (char_length(evento) between 1 and 60),
  situacao_anterior text,
  situacao_posterior text,
  resumo text not null check (char_length(btrim(resumo)) between 1 and 500),
  justificativa text check (justificativa is null or char_length(justificativa) between 1 and 1000),
  metadados jsonb not null default '{}'::jsonb check (jsonb_typeof(metadados) = 'object'),
  usuario_id uuid not null references public.perfis_usuarios (id) on delete restrict,
  criado_em timestamptz not null default now(),
  check (
    situacao_anterior is null or situacao_anterior in (
      'aberta', 'em_diagnostico', 'aguardando_aprovacao', 'aprovada',
      'em_execucao', 'pronta_retirada', 'entregue', 'reprovada', 'cancelada'
    )
  ),
  check (
    situacao_posterior is null or situacao_posterior in (
      'aberta', 'em_diagnostico', 'aguardando_aprovacao', 'aprovada',
      'em_execucao', 'pronta_retirada', 'entregue', 'reprovada', 'cancelada'
    )
  )
);

comment on table public.ordens_servico is 'Atendimentos da oficina desde a entrada do veículo até a entrega.';
comment on table public.ordens_servico_historico is 'Histórico imutável das ações relevantes das ordens de serviço.';

create index ordens_servico_situacao_idx on public.ordens_servico (situacao);
create index ordens_servico_cliente_idx on public.ordens_servico (cliente_id);
create index ordens_servico_veiculo_idx on public.ordens_servico (veiculo_id);
create index ordens_servico_responsavel_idx on public.ordens_servico (responsavel_id);
create index ordens_servico_entrada_idx on public.ordens_servico (entrada_em desc);
create index ordens_servico_previsao_idx on public.ordens_servico (previsao_conclusao_em);
create index ordens_servico_itens_ordem_idx on public.ordens_servico_itens (ordem_servico_id, ordem);
create index ordens_servico_aprovacoes_item_idx on public.ordens_servico_aprovacoes (item_id, criado_em desc);
create index ordens_servico_historico_ordem_idx on public.ordens_servico_historico (ordem_servico_id, criado_em desc);

create or replace function private.registrar_evento_ordem(
  p_ordem_id uuid,
  p_evento text,
  p_anterior text,
  p_posterior text,
  p_resumo text,
  p_justificativa text,
  p_metadados jsonb,
  p_usuario_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ordens_servico_historico (
    ordem_servico_id, evento, situacao_anterior, situacao_posterior,
    resumo, justificativa, metadados, usuario_id
  ) values (
    p_ordem_id, p_evento, p_anterior, p_posterior,
    p_resumo, p_justificativa, coalesce(p_metadados, '{}'::jsonb), p_usuario_id
  );
$$;

create or replace function private.recalcular_totais_ordem(p_ordem_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_servicos numeric(12, 2);
  v_materiais numeric(12, 2);
  v_autorizado numeric(12, 2);
  v_desconto numeric(12, 2);
  v_orcado numeric(12, 2);
  v_aplicavel numeric(12, 2);
begin
  select
    coalesce(sum(subtotal) filter (where tipo = 'servico'), 0),
    coalesce(sum(subtotal) filter (where tipo = 'material'), 0),
    coalesce(sum(subtotal) filter (where situacao_aprovacao = 'aprovado'), 0)
  into v_servicos, v_materiais, v_autorizado
  from public.ordens_servico_itens
  where ordem_servico_id = p_ordem_id and removido_em is null;

  select desconto into v_desconto
  from public.ordens_servico where id = p_ordem_id;
  v_orcado := v_servicos + v_materiais;
  v_aplicavel := case when v_autorizado > 0 then v_autorizado else v_orcado end;

  if v_desconto > v_aplicavel then
    raise exception 'O desconto ultrapassa o subtotal aplicável.' using errcode = '23514';
  end if;

  update public.ordens_servico set
    subtotal_servicos = v_servicos,
    subtotal_materiais = v_materiais,
    subtotal_orcado = v_orcado,
    subtotal_autorizado = v_autorizado,
    total_orcado = greatest(v_orcado - v_desconto, 0),
    total_autorizado = greatest(v_autorizado - v_desconto, 0),
    total_final = greatest(v_autorizado - v_desconto, 0)
  where id = p_ordem_id;
end;
$$;

create or replace function private.criar_ordem_servico_impl(
  p_cliente_id uuid, p_veiculo_id uuid, p_responsavel_id uuid,
  p_entrada_em timestamptz, p_previsao_em timestamptz, p_quilometragem integer,
  p_nivel_combustivel text, p_relato text, p_acessorios text,
  p_avarias text, p_observacoes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_cliente public.clientes%rowtype;
  v_veiculo public.veiculos%rowtype;
  v_ordem_id uuid;
begin
  if not (select private.usuario_operacional_ativo()) then
    raise exception 'Usuário sem permissão para abrir ordens.' using errcode = '42501';
  end if;
  select * into v_cliente from public.clientes where id = p_cliente_id and ativo = true;
  if v_cliente.id is null then raise exception 'Cliente inexistente ou inativo.' using errcode = '23514'; end if;
  select * into v_veiculo from public.veiculos where id = p_veiculo_id and cliente_id = p_cliente_id and ativo = true;
  if v_veiculo.id is null then raise exception 'Veículo inválido para o cliente.' using errcode = '23514'; end if;
  if not exists (select 1 from public.perfis_usuarios where id = p_responsavel_id and ativo = true) then
    raise exception 'Responsável inexistente ou inativo.' using errcode = '23514';
  end if;
  if p_previsao_em is not null and p_previsao_em <= p_entrada_em then
    raise exception 'A previsão deve ser posterior à entrada.' using errcode = '23514';
  end if;

  insert into public.ordens_servico (
    cliente_id, veiculo_id, responsavel_id, entrada_em, previsao_conclusao_em,
    quilometragem, nivel_combustivel, relato_cliente, acessorios,
    avarias_visiveis, observacoes_entrada, cliente_nome, cliente_cpf,
    cliente_telefone, veiculo_placa, veiculo_marca, veiculo_modelo,
    veiculo_ano_fabricacao, veiculo_ano_modelo, criado_por, atualizado_por
  ) values (
    p_cliente_id, p_veiculo_id, p_responsavel_id, p_entrada_em, p_previsao_em,
    p_quilometragem, p_nivel_combustivel, p_relato, p_acessorios,
    p_avarias, p_observacoes, v_cliente.nome, v_cliente.cpf,
    v_cliente.telefone_principal, v_veiculo.placa, v_veiculo.marca, v_veiculo.modelo,
    v_veiculo.ano_fabricacao, v_veiculo.ano_modelo, v_usuario, v_usuario
  ) returning id into v_ordem_id;

  perform private.registrar_evento_ordem(
    v_ordem_id, 'ordem_aberta', null, 'aberta', 'Ordem de serviço aberta.',
    null, '{}'::jsonb, v_usuario
  );
  return v_ordem_id;
end;
$$;

create or replace function private.salvar_diagnostico_ordem_impl(
  p_ordem_id uuid, p_descricao text, p_observacoes text,
  p_previsao_em timestamptz, p_versao integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_situacao text;
  v_entrada timestamptz;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao, entrada_em into v_situacao, v_entrada from public.ordens_servico
  where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao not in ('aberta', 'em_diagnostico') then raise exception 'A situação atual não permite diagnóstico.' using errcode = '23514'; end if;
  if p_previsao_em is not null and p_previsao_em <= v_entrada then raise exception 'Previsão inválida.' using errcode = '23514'; end if;

  insert into public.ordens_servico_diagnosticos (
    ordem_servico_id, descricao, observacoes, previsao_conclusao_em, usuario_id
  ) values (p_ordem_id, p_descricao, p_observacoes, p_previsao_em, v_usuario);

  update public.ordens_servico set
    situacao = 'em_diagnostico', previsao_conclusao_em = coalesce(p_previsao_em, previsao_conclusao_em),
    versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now()
  where id = p_ordem_id;
  perform private.registrar_evento_ordem(
    p_ordem_id, 'diagnostico_registrado', v_situacao, 'em_diagnostico',
    'Diagnóstico técnico registrado.', null, '{}'::jsonb, v_usuario
  );
  return p_versao + 1;
end;
$$;

create or replace function private.adicionar_item_ordem_impl(
  p_ordem_id uuid, p_tipo text, p_servico_id uuid, p_descricao text,
  p_quantidade numeric, p_valor_unitario numeric, p_versao integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_situacao text;
  v_item_id uuid;
  v_ordem_item integer;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_situacao from public.ordens_servico
  where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao not in ('em_diagnostico', 'aguardando_aprovacao') then raise exception 'A situação atual não permite alterar o orçamento.' using errcode = '23514'; end if;
  if p_tipo = 'servico' and not exists (select 1 from public.servicos where id = p_servico_id and ativo = true) then
    raise exception 'Serviço inexistente ou inativo.' using errcode = '23514';
  end if;
  if (p_tipo = 'servico' and p_servico_id is null) or (p_tipo = 'material' and p_servico_id is not null) or p_tipo not in ('servico', 'material') then
    raise exception 'Tipo e referência do item são incompatíveis.' using errcode = '23514';
  end if;
  select coalesce(max(ordem), -1) + 1 into v_ordem_item
  from public.ordens_servico_itens where ordem_servico_id = p_ordem_id;
  insert into public.ordens_servico_itens (
    ordem_servico_id, tipo, servico_id, descricao, quantidade,
    valor_unitario, ordem, criado_por
  ) values (
    p_ordem_id, p_tipo, p_servico_id, p_descricao, p_quantidade,
    p_valor_unitario, v_ordem_item, v_usuario
  ) returning id into v_item_id;
  perform private.recalcular_totais_ordem(p_ordem_id);
  update public.ordens_servico set versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'item_adicionado', v_situacao, v_situacao, 'Item adicionado ao orçamento.', null, jsonb_build_object('item_id', v_item_id), v_usuario);
  return v_item_id;
end;
$$;

create or replace function private.alterar_item_ordem_impl(
  p_ordem_id uuid, p_item_id uuid, p_tipo text, p_servico_id uuid,
  p_descricao text, p_quantidade numeric, p_valor_unitario numeric, p_versao integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_situacao text;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_situacao from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao not in ('em_diagnostico', 'aguardando_aprovacao') then raise exception 'A situação atual não permite alterar o orçamento.' using errcode = '23514'; end if;
  if p_tipo = 'servico' and not exists (select 1 from public.servicos where id = p_servico_id and ativo = true) then raise exception 'Serviço inexistente ou inativo.' using errcode = '23514'; end if;
  if (p_tipo = 'servico' and p_servico_id is null) or (p_tipo = 'material' and p_servico_id is not null) or p_tipo not in ('servico', 'material') then raise exception 'Tipo e referência do item são incompatíveis.' using errcode = '23514'; end if;
  update public.ordens_servico_itens set
    tipo = p_tipo, servico_id = p_servico_id, descricao = p_descricao,
    quantidade = p_quantidade, valor_unitario = p_valor_unitario,
    situacao_aprovacao = 'pendente', executado_em = null, executado_por = null,
    atualizado_em = now()
  where id = p_item_id and ordem_servico_id = p_ordem_id and removido_em is null;
  if not found then raise exception 'Item não encontrado.' using errcode = 'P0002'; end if;
  perform private.recalcular_totais_ordem(p_ordem_id);
  update public.ordens_servico set versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'item_alterado', v_situacao, v_situacao, 'Item do orçamento alterado.', null, jsonb_build_object('item_id', p_item_id), v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.remover_item_ordem_impl(p_ordem_id uuid, p_item_id uuid, p_versao integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid()); v_situacao text;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_situacao from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao not in ('em_diagnostico', 'aguardando_aprovacao') then raise exception 'A situação atual não permite alterar o orçamento.' using errcode = '23514'; end if;
  update public.ordens_servico_itens set removido_em = now(), removido_por = v_usuario, atualizado_em = now()
  where id = p_item_id and ordem_servico_id = p_ordem_id and removido_em is null;
  if not found then raise exception 'Item não encontrado.' using errcode = 'P0002'; end if;
  perform private.recalcular_totais_ordem(p_ordem_id);
  update public.ordens_servico set versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'item_removido', v_situacao, v_situacao, 'Item removido do orçamento.', null, jsonb_build_object('item_id', p_item_id), v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.aplicar_desconto_ordem_impl(p_ordem_id uuid, p_desconto numeric, p_versao integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid()); v_situacao text;
begin
  if not (select private.usuario_eh_administrador()) then raise exception 'Somente o administrador pode alterar descontos.' using errcode = '42501'; end if;
  select situacao into v_situacao from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao not in ('em_diagnostico', 'aguardando_aprovacao') or p_desconto < 0 then raise exception 'Desconto inválido para a situação atual.' using errcode = '23514'; end if;
  update public.ordens_servico set desconto = p_desconto where id = p_ordem_id;
  perform private.recalcular_totais_ordem(p_ordem_id);
  update public.ordens_servico set versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'desconto_alterado', v_situacao, v_situacao, 'Desconto do orçamento alterado.', null, jsonb_build_object('desconto', p_desconto), v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.avancar_ordem_servico_impl(p_ordem_id uuid, p_destino text, p_versao integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid()); v_atual text;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_atual from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_atual is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_atual = 'aberta' and p_destino = 'em_diagnostico' then null;
  elsif v_atual = 'em_diagnostico' and p_destino = 'aguardando_aprovacao' then
    if not exists (select 1 from public.ordens_servico_diagnosticos where ordem_servico_id = p_ordem_id)
      or not exists (select 1 from public.ordens_servico_itens where ordem_servico_id = p_ordem_id and removido_em is null)
    then raise exception 'Informe o diagnóstico e ao menos um item.' using errcode = '23514'; end if;
  elsif v_atual = 'aprovada' and p_destino = 'em_execucao' then null;
  elsif v_atual = 'em_execucao' and p_destino = 'pronta_retirada' then
    if exists (select 1 from public.ordens_servico_itens where ordem_servico_id = p_ordem_id and removido_em is null and situacao_aprovacao = 'aprovado' and executado_em is null)
    then raise exception 'Conclua todos os itens autorizados.' using errcode = '23514'; end if;
  else raise exception 'Transição de situação inválida.' using errcode = '23514';
  end if;
  update public.ordens_servico set situacao = p_destino, versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'situacao_alterada', v_atual, p_destino, 'Situação da ordem atualizada.', null, '{}'::jsonb, v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.registrar_aprovacao_item_ordem_impl(
  p_ordem_id uuid, p_item_id uuid, p_decisao text, p_canal text,
  p_respondido_em timestamptz, p_observacoes text, p_versao integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid()); v_atual text; v_nova text;
  v_pendentes integer; v_aprovados integer;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_atual from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_atual is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_atual <> 'aguardando_aprovacao' or p_decisao not in ('aprovado', 'recusado') or p_canal not in ('whatsapp', 'telefone', 'presencial') then raise exception 'Aprovação inválida para a situação atual.' using errcode = '23514'; end if;
  update public.ordens_servico_itens set situacao_aprovacao = p_decisao, atualizado_em = now()
  where id = p_item_id and ordem_servico_id = p_ordem_id and removido_em is null;
  if not found then raise exception 'Item não encontrado.' using errcode = 'P0002'; end if;
  insert into public.ordens_servico_aprovacoes (ordem_servico_id, item_id, decisao, canal, respondido_em, observacoes, usuario_id)
  values (p_ordem_id, p_item_id, p_decisao, p_canal, p_respondido_em, p_observacoes, v_usuario);
  perform private.recalcular_totais_ordem(p_ordem_id);
  select count(*) filter (where situacao_aprovacao = 'pendente'), count(*) filter (where situacao_aprovacao = 'aprovado')
  into v_pendentes, v_aprovados from public.ordens_servico_itens where ordem_servico_id = p_ordem_id and removido_em is null;
  v_nova := case when v_pendentes = 0 then case when v_aprovados > 0 then 'aprovada' else 'reprovada' end else v_atual end;
  update public.ordens_servico set situacao = v_nova, versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'aprovacao_registrada', v_atual, v_nova, 'Resposta do cliente registrada.', null, jsonb_build_object('item_id', p_item_id, 'decisao', p_decisao, 'canal', p_canal), v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.marcar_item_executado_impl(p_ordem_id uuid, p_item_id uuid, p_executado boolean, p_versao integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid()); v_situacao text;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_situacao from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao <> 'em_execucao' then raise exception 'A ordem não está em execução.' using errcode = '23514'; end if;
  update public.ordens_servico_itens set executado_em = case when p_executado then now() else null end,
    executado_por = case when p_executado then v_usuario else null end, atualizado_em = now()
  where id = p_item_id and ordem_servico_id = p_ordem_id and removido_em is null and situacao_aprovacao = 'aprovado';
  if not found then raise exception 'Item autorizado não encontrado.' using errcode = 'P0002'; end if;
  update public.ordens_servico set versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, case when p_executado then 'item_executado' else 'execucao_item_reaberta' end, v_situacao, v_situacao, case when p_executado then 'Item marcado como executado.' else 'Execução do item reaberta.' end, null, jsonb_build_object('item_id', p_item_id), v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.entregar_ordem_servico_impl(p_ordem_id uuid, p_forma text, p_entregue_em timestamptz, p_observacoes text, p_versao integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid()); v_situacao text;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_situacao from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_situacao is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_situacao <> 'pronta_retirada' then raise exception 'A ordem não está pronta para retirada.' using errcode = '23514'; end if;
  insert into public.ordens_servico_entregas (ordem_servico_id, forma_pagamento, entregue_em, observacoes, usuario_id)
  values (p_ordem_id, p_forma, p_entregue_em, p_observacoes, v_usuario)
  on conflict (ordem_servico_id) do update set forma_pagamento = excluded.forma_pagamento,
    entregue_em = excluded.entregue_em, observacoes = excluded.observacoes,
    usuario_id = excluded.usuario_id, atualizado_em = now();
  update public.ordens_servico set situacao = 'entregue', versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'ordem_entregue', v_situacao, 'entregue', 'Veículo entregue ao cliente.', null, jsonb_build_object('forma_pagamento', p_forma), v_usuario);
  return p_versao + 1;
end;
$$;

create or replace function private.cancelar_ordem_servico_impl(p_ordem_id uuid, p_justificativa text, p_versao integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_usuario uuid := (select auth.uid()); v_atual text;
begin
  if not (select private.usuario_operacional_ativo()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select situacao into v_atual from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_atual is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_atual in ('entregue', 'reprovada', 'cancelada') then raise exception 'A ordem já está encerrada.' using errcode = '23514'; end if;
  update public.ordens_servico set situacao = 'cancelada', versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'ordem_cancelada', v_atual, 'cancelada', 'Ordem de serviço cancelada.', p_justificativa, '{}'::jsonb, v_usuario);
  return p_versao + 1;
end; $$;

create or replace function private.retroceder_ordem_servico_impl(p_ordem_id uuid, p_destino text, p_justificativa text, p_versao integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_usuario uuid := (select auth.uid()); v_atual text; v_fluxo text[] := array['aberta','em_diagnostico','aguardando_aprovacao','aprovada','em_execucao','pronta_retirada'];
begin
  if not (select private.usuario_eh_administrador()) then raise exception 'Somente o administrador pode retroceder etapas.' using errcode = '42501'; end if;
  select situacao into v_atual from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_atual is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if array_position(v_fluxo, v_atual) is null or array_position(v_fluxo, p_destino) is null or array_position(v_fluxo, p_destino) >= array_position(v_fluxo, v_atual) then raise exception 'Retrocesso inválido.' using errcode = '23514'; end if;
  update public.ordens_servico set situacao = p_destino, versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'etapa_retrocedida', v_atual, p_destino, 'Etapa da ordem retrocedida pelo administrador.', p_justificativa, '{}'::jsonb, v_usuario);
  return p_versao + 1;
end; $$;

create or replace function private.reabrir_ordem_servico_impl(p_ordem_id uuid, p_justificativa text, p_versao integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_usuario uuid := (select auth.uid()); v_atual text; v_destino text;
begin
  if not (select private.usuario_eh_administrador()) then raise exception 'Somente o administrador pode reabrir ordens.' using errcode = '42501'; end if;
  select situacao into v_atual from public.ordens_servico where id = p_ordem_id and versao = p_versao for update;
  if v_atual is null then raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001'; end if;
  if v_atual = 'entregue' then v_destino := 'pronta_retirada';
  elsif v_atual = 'reprovada' then v_destino := 'aguardando_aprovacao';
  elsif v_atual = 'cancelada' then
    select situacao_anterior into v_destino from public.ordens_servico_historico
    where ordem_servico_id = p_ordem_id and evento = 'ordem_cancelada' order by criado_em desc limit 1;
  else raise exception 'A ordem não está encerrada.' using errcode = '23514'; end if;
  if v_destino is null or v_destino in ('entregue', 'reprovada', 'cancelada') then raise exception 'Não foi possível determinar a etapa de reabertura.' using errcode = '23514'; end if;
  update public.ordens_servico set situacao = v_destino, versao = versao + 1, atualizado_por = v_usuario, atualizado_em = now() where id = p_ordem_id;
  perform private.registrar_evento_ordem(p_ordem_id, 'ordem_reaberta', v_atual, v_destino, 'Ordem de serviço reaberta pelo administrador.', p_justificativa, '{}'::jsonb, v_usuario);
  return p_versao + 1;
end; $$;

-- Invólucros públicos sem privilégios de proprietário; a lógica privilegiada permanece privada.
create or replace function public.criar_ordem_servico(p_cliente_id uuid, p_veiculo_id uuid, p_responsavel_id uuid, p_entrada_em timestamptz, p_previsao_em timestamptz, p_quilometragem integer, p_nivel_combustivel text, p_relato text, p_acessorios text, p_avarias text, p_observacoes text)
returns uuid language sql security invoker set search_path = '' as $$ select private.criar_ordem_servico_impl(p_cliente_id,p_veiculo_id,p_responsavel_id,p_entrada_em,p_previsao_em,p_quilometragem,p_nivel_combustivel,p_relato,p_acessorios,p_avarias,p_observacoes); $$;
create or replace function public.salvar_diagnostico_ordem(p_ordem_id uuid,p_descricao text,p_observacoes text,p_previsao_em timestamptz,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.salvar_diagnostico_ordem_impl(p_ordem_id,p_descricao,p_observacoes,p_previsao_em,p_versao); $$;
create or replace function public.adicionar_item_ordem(p_ordem_id uuid,p_tipo text,p_servico_id uuid,p_descricao text,p_quantidade numeric,p_valor_unitario numeric,p_versao integer)
returns uuid language sql security invoker set search_path = '' as $$ select private.adicionar_item_ordem_impl(p_ordem_id,p_tipo,p_servico_id,p_descricao,p_quantidade,p_valor_unitario,p_versao); $$;
create or replace function public.alterar_item_ordem(p_ordem_id uuid,p_item_id uuid,p_tipo text,p_servico_id uuid,p_descricao text,p_quantidade numeric,p_valor_unitario numeric,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.alterar_item_ordem_impl(p_ordem_id,p_item_id,p_tipo,p_servico_id,p_descricao,p_quantidade,p_valor_unitario,p_versao); $$;
create or replace function public.remover_item_ordem(p_ordem_id uuid,p_item_id uuid,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.remover_item_ordem_impl(p_ordem_id,p_item_id,p_versao); $$;
create or replace function public.aplicar_desconto_ordem(p_ordem_id uuid,p_desconto numeric,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.aplicar_desconto_ordem_impl(p_ordem_id,p_desconto,p_versao); $$;
create or replace function public.avancar_ordem_servico(p_ordem_id uuid,p_destino text,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.avancar_ordem_servico_impl(p_ordem_id,p_destino,p_versao); $$;
create or replace function public.registrar_aprovacao_item_ordem(p_ordem_id uuid,p_item_id uuid,p_decisao text,p_canal text,p_respondido_em timestamptz,p_observacoes text,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.registrar_aprovacao_item_ordem_impl(p_ordem_id,p_item_id,p_decisao,p_canal,p_respondido_em,p_observacoes,p_versao); $$;
create or replace function public.marcar_item_executado(p_ordem_id uuid,p_item_id uuid,p_executado boolean,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.marcar_item_executado_impl(p_ordem_id,p_item_id,p_executado,p_versao); $$;
create or replace function public.entregar_ordem_servico(p_ordem_id uuid,p_forma text,p_entregue_em timestamptz,p_observacoes text,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.entregar_ordem_servico_impl(p_ordem_id,p_forma,p_entregue_em,p_observacoes,p_versao); $$;
create or replace function public.cancelar_ordem_servico(p_ordem_id uuid,p_justificativa text,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.cancelar_ordem_servico_impl(p_ordem_id,p_justificativa,p_versao); $$;
create or replace function public.retroceder_ordem_servico(p_ordem_id uuid,p_destino text,p_justificativa text,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.retroceder_ordem_servico_impl(p_ordem_id,p_destino,p_justificativa,p_versao); $$;
create or replace function public.reabrir_ordem_servico(p_ordem_id uuid,p_justificativa text,p_versao integer)
returns integer language sql security invoker set search_path = '' as $$ select private.reabrir_ordem_servico_impl(p_ordem_id,p_justificativa,p_versao); $$;

alter table public.ordens_servico enable row level security;
alter table public.ordens_servico_diagnosticos enable row level security;
alter table public.ordens_servico_itens enable row level security;
alter table public.ordens_servico_aprovacoes enable row level security;
alter table public.ordens_servico_entregas enable row level security;
alter table public.ordens_servico_historico enable row level security;

revoke all on public.ordens_servico, public.ordens_servico_diagnosticos,
  public.ordens_servico_itens, public.ordens_servico_aprovacoes,
  public.ordens_servico_entregas, public.ordens_servico_historico
  from anon, authenticated;
grant select on public.ordens_servico, public.ordens_servico_diagnosticos,
  public.ordens_servico_itens, public.ordens_servico_aprovacoes,
  public.ordens_servico_entregas, public.ordens_servico_historico
  to authenticated;

create policy "equipe ativa consulta ordens" on public.ordens_servico for select to authenticated using ((select private.usuario_operacional_ativo()));
create policy "equipe ativa consulta diagnosticos" on public.ordens_servico_diagnosticos for select to authenticated using ((select private.usuario_operacional_ativo()));
create policy "equipe ativa consulta itens" on public.ordens_servico_itens for select to authenticated using ((select private.usuario_operacional_ativo()));
create policy "equipe ativa consulta aprovacoes" on public.ordens_servico_aprovacoes for select to authenticated using ((select private.usuario_operacional_ativo()));
create policy "equipe ativa consulta entregas" on public.ordens_servico_entregas for select to authenticated using ((select private.usuario_operacional_ativo()));
create policy "equipe ativa consulta historico de ordens" on public.ordens_servico_historico for select to authenticated using ((select private.usuario_operacional_ativo()));

revoke all on all functions in schema private from public, anon;
grant execute on function private.criar_ordem_servico_impl(uuid,uuid,uuid,timestamptz,timestamptz,integer,text,text,text,text,text),
  private.salvar_diagnostico_ordem_impl(uuid,text,text,timestamptz,integer),
  private.adicionar_item_ordem_impl(uuid,text,uuid,text,numeric,numeric,integer),
  private.alterar_item_ordem_impl(uuid,uuid,text,uuid,text,numeric,numeric,integer),
  private.remover_item_ordem_impl(uuid,uuid,integer),
  private.aplicar_desconto_ordem_impl(uuid,numeric,integer),
  private.avancar_ordem_servico_impl(uuid,text,integer),
  private.registrar_aprovacao_item_ordem_impl(uuid,uuid,text,text,timestamptz,text,integer),
  private.marcar_item_executado_impl(uuid,uuid,boolean,integer),
  private.entregar_ordem_servico_impl(uuid,text,timestamptz,text,integer),
  private.cancelar_ordem_servico_impl(uuid,text,integer),
  private.retroceder_ordem_servico_impl(uuid,text,text,integer),
  private.reabrir_ordem_servico_impl(uuid,text,integer)
  to authenticated;

revoke all on function public.criar_ordem_servico(uuid,uuid,uuid,timestamptz,timestamptz,integer,text,text,text,text,text),
  public.salvar_diagnostico_ordem(uuid,text,text,timestamptz,integer),
  public.adicionar_item_ordem(uuid,text,uuid,text,numeric,numeric,integer),
  public.alterar_item_ordem(uuid,uuid,text,uuid,text,numeric,numeric,integer),
  public.remover_item_ordem(uuid,uuid,integer),
  public.aplicar_desconto_ordem(uuid,numeric,integer),
  public.avancar_ordem_servico(uuid,text,integer),
  public.registrar_aprovacao_item_ordem(uuid,uuid,text,text,timestamptz,text,integer),
  public.marcar_item_executado(uuid,uuid,boolean,integer),
  public.entregar_ordem_servico(uuid,text,timestamptz,text,integer),
  public.cancelar_ordem_servico(uuid,text,integer),
  public.retroceder_ordem_servico(uuid,text,text,integer),
  public.reabrir_ordem_servico(uuid,text,integer)
  from public, anon;
grant execute on function public.criar_ordem_servico(uuid,uuid,uuid,timestamptz,timestamptz,integer,text,text,text,text,text),
  public.salvar_diagnostico_ordem(uuid,text,text,timestamptz,integer),
  public.adicionar_item_ordem(uuid,text,uuid,text,numeric,numeric,integer),
  public.alterar_item_ordem(uuid,uuid,text,uuid,text,numeric,numeric,integer),
  public.remover_item_ordem(uuid,uuid,integer),
  public.aplicar_desconto_ordem(uuid,numeric,integer),
  public.avancar_ordem_servico(uuid,text,integer),
  public.registrar_aprovacao_item_ordem(uuid,uuid,text,text,timestamptz,text,integer),
  public.marcar_item_executado(uuid,uuid,boolean,integer),
  public.entregar_ordem_servico(uuid,text,timestamptz,text,integer),
  public.cancelar_ordem_servico(uuid,text,integer),
  public.retroceder_ordem_servico(uuid,text,text,integer),
  public.reabrir_ordem_servico(uuid,text,integer)
  to authenticated;
