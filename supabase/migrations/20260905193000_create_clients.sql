create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  cpf text not null unique check (cpf ~ '^[0-9]{11}$'),
  telefone_principal text not null check (telefone_principal ~ '^[0-9]{10,11}$'),
  telefone_alternativo text check (
    telefone_alternativo is null
    or telefone_alternativo ~ '^[0-9]{10,11}$'
  ),
  email text check (
    email is null
    or (
      char_length(email) <= 254
      and email = lower(email)
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  cep text not null check (cep ~ '^[0-9]{8}$'),
  logradouro text not null check (char_length(btrim(logradouro)) between 1 and 160),
  numero text not null check (char_length(btrim(numero)) between 1 and 20),
  complemento text check (complemento is null or char_length(complemento) <= 80),
  bairro text not null check (char_length(btrim(bairro)) between 1 and 100),
  cidade text not null check (char_length(btrim(cidade)) between 1 and 100),
  estado text not null check (estado ~ '^[A-Z]{2}$'),
  observacoes text check (observacoes is null or char_length(observacoes) <= 1000),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.clientes is
  'Clientes pessoas físicas atendidos pela oficina.';

create index clientes_nome_lower_idx on public.clientes (lower(nome));
create index clientes_telefone_principal_idx on public.clientes (telefone_principal);
create index clientes_telefone_alternativo_idx on public.clientes (telefone_alternativo);
create index clientes_email_lower_idx on public.clientes (lower(email));
create index clientes_ativo_idx on public.clientes (ativo);

create trigger clientes_atualizado_em
before update on public.clientes
for each row execute function private.atualizar_data_modificacao();

create or replace function private.usuario_operacional_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis_usuarios
    where id = (select auth.uid())
      and ativo = true
      and perfil in ('administrador', 'atendente')
  );
$$;

revoke all on function private.usuario_operacional_ativo() from public;
grant execute on function private.usuario_operacional_ativo() to authenticated;

alter table public.clientes enable row level security;

revoke all on table public.clientes from anon, authenticated;
grant select, insert, update on table public.clientes to authenticated;

create policy "equipe ativa consulta clientes"
on public.clientes
for select
to authenticated
using ((select private.usuario_operacional_ativo()));

create policy "equipe ativa cadastra clientes"
on public.clientes
for insert
to authenticated
with check ((select private.usuario_operacional_ativo()));

create policy "equipe ativa atualiza clientes"
on public.clientes
for update
to authenticated
using ((select private.usuario_operacional_ativo()))
with check ((select private.usuario_operacional_ativo()));
