create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (
    char_length(nome) between 1 and 100
    and nome = regexp_replace(btrim(nome), '[[:space:]]+', ' ', 'g')
  ),
  categoria text not null check (
    categoria in (
      'climatizacao',
      'eletrica_automotiva',
      'diagnostico',
      'manutencao_preventiva',
      'outros'
    )
  ),
  descricao text check (
    descricao is null
    or (
      char_length(descricao) between 1 and 1000
      and descricao = regexp_replace(btrim(descricao), '[[:space:]]+', ' ', 'g')
    )
  ),
  valor_base numeric(12, 2) check (
    valor_base is null or valor_base >= 0
  ),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.servicos is
  'Catálogo de serviços e mão de obra oferecidos pela oficina.';

comment on column public.servicos.valor_base is
  'Valor sugerido para novos orçamentos; nulo indica preço a definir.';

create unique index servicos_categoria_nome_canonico_uidx
  on public.servicos (categoria, lower(nome));
create index servicos_nome_lower_idx on public.servicos (lower(nome));
create index servicos_categoria_idx on public.servicos (categoria);
create index servicos_ativo_idx on public.servicos (ativo);

create trigger servicos_atualizado_em
before update on public.servicos
for each row execute function private.atualizar_data_modificacao();

alter table public.servicos enable row level security;

revoke all on table public.servicos from anon, authenticated;
grant select, insert, update on table public.servicos to authenticated;

create policy "equipe ativa consulta servicos"
on public.servicos
for select
to authenticated
using ((select private.usuario_operacional_ativo()));

create policy "administrador ativo cadastra servicos"
on public.servicos
for insert
to authenticated
with check ((select private.usuario_eh_administrador()));

create policy "administrador ativo atualiza servicos"
on public.servicos
for update
to authenticated
using ((select private.usuario_eh_administrador()))
with check ((select private.usuario_eh_administrador()));
