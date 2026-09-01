create type public.perfil_usuario as enum (
  'administrador',
  'atendente',
  'tecnico'
);

create table public.perfis_usuarios (
  id uuid primary key references auth.users (id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  perfil public.perfil_usuario not null default 'tecnico',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis_usuarios is
  'Dados operacionais e perfil de acesso dos funcionários.';

create schema if not exists private;

create or replace function private.usuario_eh_administrador()
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
      and perfil = 'administrador'
      and ativo = true
  );
$$;

revoke all on function private.usuario_eh_administrador() from public;
grant usage on schema private to authenticated;
grant execute on function private.usuario_eh_administrador() to authenticated;

create or replace function private.atualizar_data_modificacao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger perfis_usuarios_atualizado_em
before update on public.perfis_usuarios
for each row execute function private.atualizar_data_modificacao();

create or replace function private.criar_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  perfil_informado text;
begin
  perfil_informado := new.raw_user_meta_data ->> 'perfil';

  insert into public.perfis_usuarios (id, nome, perfil)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
      split_part(coalesce(new.email, 'usuario'), '@', 1)
    ),
    case
      when perfil_informado in ('administrador', 'atendente', 'tecnico')
        then perfil_informado::public.perfil_usuario
      else 'tecnico'::public.perfil_usuario
    end
  );

  return new;
end;
$$;

revoke all on function private.criar_perfil_de_usuario() from public;

create trigger criar_perfil_apos_usuario
after insert on auth.users
for each row execute function private.criar_perfil_de_usuario();

alter table public.perfis_usuarios enable row level security;

revoke all on table public.perfis_usuarios from anon, authenticated;
grant select, update on table public.perfis_usuarios to authenticated;

create policy "usuario consulta o proprio perfil"
on public.perfis_usuarios
for select
to authenticated
using ((select auth.uid()) = id);

create policy "administrador consulta todos os perfis"
on public.perfis_usuarios
for select
to authenticated
using ((select private.usuario_eh_administrador()));

create policy "administrador altera outros perfis"
on public.perfis_usuarios
for update
to authenticated
using (
  (select private.usuario_eh_administrador())
  and id <> (select auth.uid())
)
with check (
  (select private.usuario_eh_administrador())
  and id <> (select auth.uid())
);
