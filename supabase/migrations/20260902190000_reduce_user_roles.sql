update public.perfis_usuarios
set perfil = 'atendente'::public.perfil_usuario
where perfil = 'tecnico'::public.perfil_usuario;

update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{perfil}',
  '"atendente"'::jsonb,
  true
)
where raw_user_meta_data ->> 'perfil' = 'tecnico';

drop policy if exists "usuario consulta o proprio perfil"
  on public.perfis_usuarios;
drop policy if exists "administrador consulta todos os perfis"
  on public.perfis_usuarios;
drop policy if exists "administrador altera outros perfis"
  on public.perfis_usuarios;

drop trigger if exists criar_perfil_apos_usuario on auth.users;
drop function if exists private.criar_perfil_de_usuario();
drop function if exists private.usuario_eh_administrador();

alter table public.perfis_usuarios
  alter column perfil drop default;

alter type public.perfil_usuario rename to perfil_usuario_anterior;

create type public.perfil_usuario as enum (
  'administrador',
  'atendente'
);

alter table public.perfis_usuarios
  alter column perfil type public.perfil_usuario
  using perfil::text::public.perfil_usuario;

alter table public.perfis_usuarios
  alter column perfil set default 'atendente'::public.perfil_usuario;

drop type public.perfil_usuario_anterior;

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
grant execute on function private.usuario_eh_administrador() to authenticated;

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
      when perfil_informado in ('administrador', 'atendente')
        then perfil_informado::public.perfil_usuario
      else 'atendente'::public.perfil_usuario
    end
  );

  return new;
end;
$$;

revoke all on function private.criar_perfil_de_usuario() from public;

create trigger criar_perfil_apos_usuario
after insert on auth.users
for each row execute function private.criar_perfil_de_usuario();

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

comment on type public.perfil_usuario is
  'Perfis de acesso disponíveis: administrador e atendente.';
