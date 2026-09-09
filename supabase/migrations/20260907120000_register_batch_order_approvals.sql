create or replace function private.registrar_aprovacoes_ordem_impl(
  p_ordem_id uuid,
  p_decisoes jsonb,
  p_canal text,
  p_respondido_em timestamptz,
  p_observacoes text,
  p_versao integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_atual text;
  v_nova text;
  v_pendentes integer;
  v_aprovados integer;
  v_quantidade integer;
  v_itens_validos integer;
  v_decisao jsonb;
  v_item_id uuid;
  v_valor_decisao text;
begin
  if not (select private.usuario_operacional_ativo()) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select situacao into v_atual
  from public.ordens_servico
  where id = p_ordem_id and versao = p_versao
  for update;

  if v_atual is null then
    raise exception 'Ordem inexistente ou alterada por outro usuário.' using errcode = '40001';
  end if;
  if v_atual <> 'aguardando_aprovacao'
    or p_canal not in ('whatsapp', 'telefone', 'presencial')
    or p_respondido_em is null then
    raise exception 'Aprovação inválida para a situação atual.' using errcode = '23514';
  end if;
  if jsonb_typeof(p_decisoes) <> 'array' or jsonb_array_length(p_decisoes) = 0 then
    raise exception 'Informe ao menos uma decisão.' using errcode = '23514';
  end if;

  v_quantidade := jsonb_array_length(p_decisoes);
  if exists (
    select 1
    from jsonb_array_elements(p_decisoes) as item
    where coalesce(item->>'decision', '') not in ('aprovado', 'recusado')
      or coalesce(item->>'itemId', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) or exists (
    select 1
    from jsonb_array_elements(p_decisoes) as item
    group by item->>'itemId'
    having count(*) > 1
  ) then
    raise exception 'As decisões informadas são inválidas.' using errcode = '23514';
  end if;

  select count(*) into v_itens_validos
  from public.ordens_servico_itens
  where ordem_servico_id = p_ordem_id
    and removido_em is null
    and id in (
      select (item->>'itemId')::uuid
      from jsonb_array_elements(p_decisoes) as item
    );
  if v_itens_validos <> v_quantidade then
    raise exception 'Um ou mais itens não pertencem à ordem.' using errcode = 'P0002';
  end if;

  for v_decisao in select value from jsonb_array_elements(p_decisoes)
  loop
    v_item_id := (v_decisao->>'itemId')::uuid;
    v_valor_decisao := v_decisao->>'decision';
    update public.ordens_servico_itens
    set situacao_aprovacao = v_valor_decisao, atualizado_em = now()
    where id = v_item_id and ordem_servico_id = p_ordem_id and removido_em is null;

    insert into public.ordens_servico_aprovacoes (
      ordem_servico_id, item_id, decisao, canal, respondido_em, observacoes, usuario_id
    ) values (
      p_ordem_id, v_item_id, v_valor_decisao, p_canal, p_respondido_em, p_observacoes, v_usuario
    );
  end loop;

  perform private.recalcular_totais_ordem(p_ordem_id);
  select
    count(*) filter (where situacao_aprovacao = 'pendente'),
    count(*) filter (where situacao_aprovacao = 'aprovado')
  into v_pendentes, v_aprovados
  from public.ordens_servico_itens
  where ordem_servico_id = p_ordem_id and removido_em is null;

  v_nova := case
    when v_pendentes = 0 then case when v_aprovados > 0 then 'aprovada' else 'reprovada' end
    else v_atual
  end;
  update public.ordens_servico
  set situacao = v_nova,
      versao = versao + 1,
      atualizado_por = v_usuario,
      atualizado_em = now()
  where id = p_ordem_id;

  perform private.registrar_evento_ordem(
    p_ordem_id,
    'aprovacoes_registradas',
    v_atual,
    v_nova,
    case when v_quantidade = 1 then 'Resposta do cliente registrada.' else 'Respostas do cliente registradas.' end,
    null,
    jsonb_build_object('decisoes', p_decisoes, 'canal', p_canal),
    v_usuario
  );
  return p_versao + 1;
end;
$$;

create or replace function public.registrar_aprovacoes_ordem(
  p_ordem_id uuid,
  p_decisoes jsonb,
  p_canal text,
  p_respondido_em timestamptz,
  p_observacoes text,
  p_versao integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.registrar_aprovacoes_ordem_impl(
    p_ordem_id, p_decisoes, p_canal, p_respondido_em, p_observacoes, p_versao
  );
exception when serialization_failure then
  raise exception 'CONFLITO_VERSAO: a ordem foi alterada por outro usuário.' using errcode = 'P0001';
end;
$$;

revoke all on function private.registrar_aprovacoes_ordem_impl(uuid,jsonb,text,timestamptz,text,integer) from public, anon;
grant execute on function private.registrar_aprovacoes_ordem_impl(uuid,jsonb,text,timestamptz,text,integer) to authenticated;
revoke all on function public.registrar_aprovacoes_ordem(uuid,jsonb,text,timestamptz,text,integer) from public, anon;
grant execute on function public.registrar_aprovacoes_ordem(uuid,jsonb,text,timestamptz,text,integer) to authenticated;
