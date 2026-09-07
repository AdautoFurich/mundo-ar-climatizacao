import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error("Configure o arquivo .env.local antes de validar o RLS.");
}

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const adminApi = createClient(url, secretKey, options);
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = "MundoAr!Ordens2026#";
const createdUserIds = [];
const createdOrderIds = [];
const createdClientIds = [];
const createdVehicleIds = [];
const createdServiceIds = [];

async function createTestUser(label, role) {
  const email = `ordens-${label}-${runId}@mundoar.invalid`;
  const { data, error } = await adminApi.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: `Teste Ordens ${label}`, perfil: role },
  });
  if (error || !data.user) throw error ?? new Error("Usuário não criado.");
  createdUserIds.push(data.user.id);
  return { id: data.user.id, email };
}

async function authenticatedClient(email) {
  const client = createClient(url, publishableKey, options);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function createFixtures() {
  const suffix = runId.replace(/\D/g, "").slice(-8).padStart(8, "0");
  const clients = [
    {
      nome: `Cliente Ordens A ${runId}`,
      cpf: `111${suffix}`.slice(-11),
      telefone_principal: "44999990001",
      cep: "87000001",
      logradouro: "Rua de Teste",
      numero: "10",
      bairro: "Centro",
      cidade: "Maringá",
      estado: "PR",
    },
    {
      nome: `Cliente Ordens B ${runId}`,
      cpf: `222${suffix}`.slice(-11),
      telefone_principal: "44999990002",
      cep: "87000002",
      logradouro: "Avenida de Teste",
      numero: "20",
      bairro: "Centro",
      cidade: "Maringá",
      estado: "PR",
    },
  ];
  const { data: insertedClients, error: clientError } = await adminApi
    .from("clientes")
    .insert(clients)
    .select("id");
  if (clientError || insertedClients?.length !== 2) throw clientError;
  createdClientIds.push(...insertedClients.map(({ id }) => id));

  const vehicles = [
    {
      cliente_id: createdClientIds[0],
      placa: `RLS${suffix.slice(-4)}`,
      marca: "Chevrolet",
      modelo: "Onix",
      ano_fabricacao: 2022,
      ano_modelo: 2023,
    },
    {
      cliente_id: createdClientIds[1],
      placa: `TST${suffix.slice(-4)}`,
      marca: "Toyota",
      modelo: "Corolla",
      ano_fabricacao: 2021,
      ano_modelo: 2022,
    },
  ];
  const { data: insertedVehicles, error: vehicleError } = await adminApi
    .from("veiculos")
    .insert(vehicles)
    .select("id");
  if (vehicleError || insertedVehicles?.length !== 2) throw vehicleError;
  createdVehicleIds.push(...insertedVehicles.map(({ id }) => id));

  const { data: service, error: serviceError } = await adminApi
    .from("servicos")
    .insert({
      nome: `Diagnóstico RLS ${runId}`,
      categoria: "diagnostico",
      valor_base: 250,
    })
    .select("id")
    .single();
  if (serviceError || !service) throw serviceError;
  createdServiceIds.push(service.id);
}

async function cleanup() {
  if (createdOrderIds.length > 0) {
    await adminApi.from("ordens_servico").delete().in("id", createdOrderIds);
  }
  if (createdServiceIds.length > 0) {
    await adminApi.from("servicos").delete().in("id", createdServiceIds);
  }
  if (createdVehicleIds.length > 0) {
    await adminApi.from("veiculos").delete().in("id", createdVehicleIds);
  }
  if (createdClientIds.length > 0) {
    await adminApi.from("clientes").delete().in("id", createdClientIds);
  }
  if (createdUserIds.length > 0) {
    await adminApi.from("perfis_usuarios").delete().in("id", createdUserIds);
    await Promise.all(createdUserIds.map((id) => adminApi.auth.admin.deleteUser(id)));
  }
}

function orderPayload(responsibleId, clientIndex = 0, vehicleIndex = 0) {
  return {
    p_cliente_id: createdClientIds[clientIndex],
    p_veiculo_id: createdVehicleIds[vehicleIndex],
    p_responsavel_id: responsibleId,
    p_entrada_em: "2026-09-06T13:00:00-03:00",
    p_previsao_em: "2026-09-07T18:00:00-03:00",
    p_quilometragem: 84520,
    p_nivel_combustivel: "metade",
    p_relato: "Ar-condicionado não resfria.",
    p_acessorios: "Controle do alarme",
    p_avarias: null,
    p_observacoes: "Dado sintético removido automaticamente.",
  };
}

try {
  console.log("[ordens:rls] criando usuários e cadastros temporários");
  const administrator = await createTestUser("administrador", "administrador");
  const attendant = await createTestUser("atendente", "atendente");
  const inactive = await createTestUser("inativo", "atendente");
  await createFixtures();
  console.log("[ordens:rls] validando acesso e abertura concorrente");
  const { error: inactiveError } = await adminApi
    .from("perfis_usuarios")
    .update({ ativo: false })
    .eq("id", inactive.id);
  assert.ifError(inactiveError);

  const anonymousClient = createClient(url, publishableKey, options);
  const { error: anonymousReadError } = await anonymousClient
    .from("ordens_servico")
    .select("id");
  assert.ok(anonymousReadError, "Visitante não pode consultar ordens.");

  const administratorClient = await authenticatedClient(administrator.email);
  const attendantClient = await authenticatedClient(attendant.email);
  const inactiveClient = await authenticatedClient(inactive.email);
  const { data: inactiveView, error: inactiveViewError } = await inactiveClient
    .from("ordens_servico")
    .select("id");
  assert.ok(
    inactiveViewError || inactiveView?.length === 0,
    "Usuário inativo não pode consultar ordens.",
  );
  const { error: inactiveCreateError } = await inactiveClient.rpc(
    "criar_ordem_servico",
    orderPayload(inactive.id),
  );
  assert.ok(inactiveCreateError, "Usuário inativo não pode abrir ordens.");
  const { error: inactiveResponsibleError } = await administratorClient.rpc(
    "criar_ordem_servico",
    orderPayload(inactive.id),
  );
  assert.equal(inactiveResponsibleError?.code, "23514");
  const { error: privateFunctionError } = await administratorClient.rpc(
    "criar_ordem_servico_impl",
    orderPayload(administrator.id),
  );
  assert.equal(
    privateFunctionError?.code,
    "PGRST202",
    "A implementação privilegiada não deve estar exposta pela API.",
  );

  const [{ data: firstOrder, error: firstError }, { data: secondOrder, error: secondError }] =
    await Promise.all([
      administratorClient.rpc("criar_ordem_servico", orderPayload(administrator.id)),
      attendantClient.rpc("criar_ordem_servico", orderPayload(attendant.id)),
    ]);
  assert.ifError(firstError);
  assert.ifError(secondError);
  assert.ok(firstOrder && secondOrder && firstOrder !== secondOrder);
  createdOrderIds.push(firstOrder, secondOrder);
  console.log("[ordens:rls] validando bloqueios e composição da ordem");

  const { data: numberedOrders, error: numberError } = await administratorClient
    .from("ordens_servico")
    .select("id, numero")
    .in("id", [firstOrder, secondOrder]);
  assert.ifError(numberError);
  assert.equal(new Set(numberedOrders.map(({ numero }) => numero)).size, 2);

  const { error: wrongOwnerError } = await attendantClient.rpc(
    "criar_ordem_servico",
    orderPayload(attendant.id, 0, 1),
  );
  assert.equal(wrongOwnerError?.code, "23514");

  const { error: directInsertError } = await attendantClient
    .from("ordens_servico")
    .insert({});
  assert.ok(directInsertError, "Escrita direta deve ser bloqueada.");
  const { error: directUpdateError } = await administratorClient
    .from("ordens_servico")
    .update({ desconto: 1 })
    .eq("id", firstOrder);
  assert.ok(directUpdateError, "Atualização direta deve ser bloqueada.");
  const { error: directDeleteError } = await administratorClient
    .from("ordens_servico")
    .delete()
    .eq("id", firstOrder);
  assert.ok(directDeleteError, "Exclusão direta deve ser bloqueada.");

  const { data: diagnosisVersion, error: diagnosisError } = await attendantClient.rpc(
    "salvar_diagnostico_ordem",
    {
      p_ordem_id: firstOrder,
      p_descricao: "Compressor sem acionamento.",
      p_observacoes: null,
      p_previsao_em: "2026-09-07T18:00:00-03:00",
      p_versao: 1,
    },
  );
  assert.ifError(diagnosisError);
  assert.equal(diagnosisVersion, 2);

  const { data: serviceItem, error: serviceItemError } = await attendantClient.rpc(
    "adicionar_item_ordem",
    {
      p_ordem_id: firstOrder,
      p_tipo: "servico",
      p_servico_id: createdServiceIds[0],
      p_descricao: "Diagnóstico elétrico",
      p_quantidade: 1,
      p_valor_unitario: 250,
      p_versao: 2,
    },
  );
  assert.ifError(serviceItemError);
  const { data: materialItem, error: materialItemError } = await attendantClient.rpc(
    "adicionar_item_ordem",
    {
      p_ordem_id: firstOrder,
      p_tipo: "material",
      p_servico_id: null,
      p_descricao: "Conector elétrico",
      p_quantidade: 2,
      p_valor_unitario: 50,
      p_versao: 3,
    },
  );
  assert.ifError(materialItemError);

  const { error: attendantDiscountError } = await attendantClient.rpc(
    "aplicar_desconto_ordem",
    { p_ordem_id: firstOrder, p_desconto: 20, p_versao: 4 },
  );
  assert.equal(attendantDiscountError?.code, "42501");
  const { data: discountVersion, error: discountError } = await administratorClient.rpc(
    "aplicar_desconto_ordem",
    { p_ordem_id: firstOrder, p_desconto: 20, p_versao: 4 },
  );
  assert.ifError(discountError);
  assert.equal(discountVersion, 5);

  const { data: waitingVersion, error: waitingError } = await attendantClient.rpc(
    "avancar_ordem_servico",
    { p_ordem_id: firstOrder, p_destino: "aguardando_aprovacao", p_versao: 5 },
  );
  assert.ifError(waitingError);
  assert.equal(waitingVersion, 6);
  console.log("[ordens:rls] validando aprovação, execução e entrega");

  console.log("[ordens:rls] registrando aprovações em lote");
  const { data: approvalVersion, error: approvalError } = await attendantClient.rpc(
    "registrar_aprovacoes_ordem",
    {
      p_ordem_id: firstOrder,
      p_decisoes: [
        { itemId: serviceItem, decision: "aprovado" },
        { itemId: materialItem, decision: "aprovado" },
      ],
      p_canal: "whatsapp",
      p_respondido_em: "2026-09-06T16:00:00-03:00",
      p_observacoes: "Autorização sintética.",
      p_versao: 6,
    },
  );
  assert.ifError(approvalError);
  assert.equal(approvalVersion, 7);
  console.log("[ordens:rls] conferindo totais aprovados");
  const { data: approvedOrder, error: approvedOrderError } = await administratorClient
    .from("ordens_servico")
    .select("situacao, subtotal_servicos, subtotal_materiais, total_autorizado, versao")
    .eq("id", firstOrder)
    .single();
  assert.ifError(approvedOrderError);
  assert.deepEqual(approvedOrder, {
    situacao: "aprovada",
    subtotal_servicos: 250,
    subtotal_materiais: 100,
    total_autorizado: 330,
    versao: 7,
  });

  console.log("[ordens:rls] iniciando execução");
  assert.ifError((await attendantClient.rpc("avancar_ordem_servico", {
    p_ordem_id: firstOrder, p_destino: "em_execucao", p_versao: 7,
  })).error);
  console.log("[ordens:rls] concluindo primeiro item");
  assert.ifError((await attendantClient.rpc("marcar_item_executado", {
    p_ordem_id: firstOrder, p_item_id: serviceItem, p_executado: true, p_versao: 8,
  })).error);
  console.log("[ordens:rls] concluindo segundo item");
  assert.ifError((await attendantClient.rpc("marcar_item_executado", {
    p_ordem_id: firstOrder, p_item_id: materialItem, p_executado: true, p_versao: 9,
  })).error);
  console.log("[ordens:rls] preparando retirada");
  assert.ifError((await attendantClient.rpc("avancar_ordem_servico", {
    p_ordem_id: firstOrder, p_destino: "pronta_retirada", p_versao: 10,
  })).error);
  console.log("[ordens:rls] registrando entrega");
  assert.ifError((await attendantClient.rpc("entregar_ordem_servico", {
    p_ordem_id: firstOrder,
    p_forma: "pix",
    p_entregue_em: "2026-09-07T17:00:00-03:00",
    p_observacoes: null,
    p_versao: 11,
  })).error);

  const { error: attendantReopenError } = await attendantClient.rpc(
    "reabrir_ordem_servico",
    { p_ordem_id: firstOrder, p_justificativa: "Teste", p_versao: 12 },
  );
  assert.equal(attendantReopenError?.code, "42501");
  const { error: reopenError } = await administratorClient.rpc(
    "reabrir_ordem_servico",
    { p_ordem_id: firstOrder, p_justificativa: "Correção controlada.", p_versao: 12 },
  );
  assert.ifError(reopenError);
  const { error: attendantRollbackError } = await attendantClient.rpc(
    "retroceder_ordem_servico",
    {
      p_ordem_id: firstOrder,
      p_destino: "em_execucao",
      p_justificativa: "Tentativa sem permissão.",
      p_versao: 13,
    },
  );
  assert.equal(attendantRollbackError?.code, "42501");
  const { error: staleVersionError } = await administratorClient.rpc(
    "retroceder_ordem_servico",
    { p_ordem_id: firstOrder, p_destino: "em_execucao", p_justificativa: "Teste", p_versao: 12 },
  );
  assert.equal(staleVersionError?.code, "P0001");
  assert.match(staleVersionError?.message ?? "", /CONFLITO_VERSAO/);
  assert.ifError((await administratorClient.rpc("retroceder_ordem_servico", {
    p_ordem_id: firstOrder,
    p_destino: "em_execucao",
    p_justificativa: "Ajuste autorizado.",
    p_versao: 13,
  })).error);
  console.log("[ordens:rls] validando cancelamento, reabertura e histórico");

  assert.ifError((await attendantClient.rpc("cancelar_ordem_servico", {
    p_ordem_id: secondOrder, p_justificativa: "Teste de cancelamento.", p_versao: 1,
  })).error);
  assert.ifError((await administratorClient.rpc("reabrir_ordem_servico", {
    p_ordem_id: secondOrder, p_justificativa: "Retomar atendimento.", p_versao: 2,
  })).error);

  const { data: history, error: historyError } = await attendantClient
    .from("ordens_servico_historico")
    .select("id, evento")
    .eq("ordem_servico_id", firstOrder);
  assert.ifError(historyError);
  assert.ok(history.length >= 12, "O fluxo deve produzir histórico auditável.");
  const { error: historyUpdateError } = await administratorClient
    .from("ordens_servico_historico")
    .update({ resumo: "Alterado" })
    .eq("id", history[0].id);
  assert.ok(historyUpdateError, "O histórico não pode ser alterado diretamente.");
  const { error: historyDeleteError } = await administratorClient
    .from("ordens_servico_historico")
    .delete()
    .eq("id", history[0].id);
  assert.ok(historyDeleteError, "O histórico não pode ser excluído diretamente.");

  console.log(
    "RLS de ordens validado: fluxo transacional, auditoria, concorrência e ações administrativas protegidos.",
  );
} finally {
  console.log("[ordens:rls] removendo dados temporários");
  await cleanup();
}
