create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  placa text not null unique check (
    placa ~ '^[A-Z]{3}([0-9]{4}|[0-9][A-Z][0-9]{2})$'
  ),
  marca text not null check (char_length(btrim(marca)) between 1 and 60),
  modelo text not null check (char_length(btrim(modelo)) between 1 and 80),
  ano_fabricacao integer not null check (ano_fabricacao >= 1900),
  ano_modelo integer not null check (
    ano_modelo between ano_fabricacao and ano_fabricacao + 1
  ),
  cor text check (cor is null or char_length(btrim(cor)) between 1 and 40),
  combustivel text check (
    combustivel is null
    or combustivel in (
      'gasolina',
      'etanol',
      'flex',
      'diesel',
      'eletrico',
      'hibrido'
    )
  ),
  observacoes text check (
    observacoes is null or char_length(observacoes) <= 1000
  ),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.veiculos is
  'Carros e utilitários atendidos pela oficina e seu proprietário atual.';

create index veiculos_cliente_id_idx on public.veiculos (cliente_id);
create index veiculos_marca_modelo_lower_idx
  on public.veiculos (lower(marca), lower(modelo));
create index veiculos_ativo_idx on public.veiculos (ativo);

create or replace function private.validar_anos_veiculo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ano_maximo integer := extract(year from current_date)::integer + 1;
begin
  if new.ano_fabricacao > ano_maximo or new.ano_modelo > ano_maximo then
    raise exception 'Ano do veículo acima do limite permitido.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validar_anos_veiculo() from public;

create trigger veiculos_validar_anos
before insert or update of ano_fabricacao, ano_modelo on public.veiculos
for each row execute function private.validar_anos_veiculo();

create trigger veiculos_atualizado_em
before update on public.veiculos
for each row execute function private.atualizar_data_modificacao();

create table public.historico_proprietarios_veiculos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos (id) on delete restrict,
  cliente_anterior_id uuid not null references public.clientes (id) on delete restrict,
  cliente_novo_id uuid not null references public.clientes (id) on delete restrict,
  usuario_id uuid not null references public.perfis_usuarios (id) on delete restrict,
  transferido_em timestamptz not null default now(),
  check (cliente_anterior_id <> cliente_novo_id)
);

comment on table public.historico_proprietarios_veiculos is
  'Histórico imutável das transferências de proprietário dos veículos.';

create index historico_veiculos_veiculo_data_idx
  on public.historico_proprietarios_veiculos (veiculo_id, transferido_em desc);
create index historico_veiculos_cliente_anterior_idx
  on public.historico_proprietarios_veiculos (cliente_anterior_id);
create index historico_veiculos_cliente_novo_idx
  on public.historico_proprietarios_veiculos (cliente_novo_id);

alter table public.veiculos enable row level security;
alter table public.historico_proprietarios_veiculos enable row level security;

revoke all on table public.veiculos from anon, authenticated;
revoke all on table public.historico_proprietarios_veiculos from anon, authenticated;

grant select on table public.veiculos to authenticated;
grant insert (
  cliente_id,
  placa,
  marca,
  modelo,
  ano_fabricacao,
  ano_modelo,
  cor,
  combustivel,
  observacoes
) on table public.veiculos to authenticated;
grant update (
  placa,
  marca,
  modelo,
  ano_fabricacao,
  ano_modelo,
  cor,
  combustivel,
  observacoes,
  ativo
) on table public.veiculos to authenticated;
grant select on table public.historico_proprietarios_veiculos to authenticated;

create policy "equipe ativa consulta veiculos"
on public.veiculos
for select
to authenticated
using ((select private.usuario_operacional_ativo()));

create policy "equipe ativa cadastra veiculos"
on public.veiculos
for insert
to authenticated
with check (
  (select private.usuario_operacional_ativo())
  and exists (
    select 1
    from public.clientes
    where clientes.id = veiculos.cliente_id
      and clientes.ativo = true
  )
);

create policy "equipe ativa atualiza veiculos"
on public.veiculos
for update
to authenticated
using ((select private.usuario_operacional_ativo()))
with check ((select private.usuario_operacional_ativo()));

create policy "equipe ativa consulta historico de proprietarios"
on public.historico_proprietarios_veiculos
for select
to authenticated
using ((select private.usuario_operacional_ativo()));

create or replace function public.transferir_proprietario_veiculo(
  p_veiculo_id uuid,
  p_novo_cliente_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_anterior uuid;
  historico_id uuid;
begin
  if not (select private.usuario_operacional_ativo()) then
    raise exception 'Usuário sem permissão para transferir veículos.'
      using errcode = '42501';
  end if;

  select cliente_id
  into cliente_anterior
  from public.veiculos
  where id = p_veiculo_id
  for update;

  if cliente_anterior is null then
    raise exception 'Veículo não encontrado.' using errcode = 'P0002';
  end if;

  if cliente_anterior = p_novo_cliente_id then
    raise exception 'O cliente informado já é o proprietário do veículo.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.clientes
    where id = p_novo_cliente_id
      and ativo = true
  ) then
    raise exception 'O novo proprietário não existe ou está inativo.'
      using errcode = '23514';
  end if;

  update public.veiculos
  set cliente_id = p_novo_cliente_id
  where id = p_veiculo_id;

  insert into public.historico_proprietarios_veiculos (
    veiculo_id,
    cliente_anterior_id,
    cliente_novo_id,
    usuario_id
  )
  values (
    p_veiculo_id,
    cliente_anterior,
    p_novo_cliente_id,
    (select auth.uid())
  )
  returning id into historico_id;

  return historico_id;
end;
$$;

revoke all on function public.transferir_proprietario_veiculo(uuid, uuid)
  from public, anon;
grant execute on function public.transferir_proprietario_veiculo(uuid, uuid)
  to authenticated;
