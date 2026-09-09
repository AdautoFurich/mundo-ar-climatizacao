"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  clientFormSchema,
  clientIdSchema,
  type ClientFormData,
} from "./schemas";
import type { ClientActionState } from "./types";

function formValues(formData: FormData) {
  return {
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    primaryPhone: formData.get("primaryPhone"),
    alternatePhone: formData.get("alternatePhone"),
    email: formData.get("email"),
    zipCode: formData.get("zipCode"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
    notes: formData.get("notes"),
  };
}

function databaseValues(data: ClientFormData) {
  return {
    nome: data.name,
    cpf: data.cpf,
    telefone_principal: data.primaryPhone,
    telefone_alternativo: data.alternatePhone,
    email: data.email,
    cep: data.zipCode,
    logradouro: data.street,
    numero: data.number,
    complemento: data.complement,
    bairro: data.neighborhood,
    cidade: data.city,
    estado: data.state,
    observacoes: data.notes,
  };
}

function validationState(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): ClientActionState {
  return {
    status: "error",
    message: "Revise os campos indicados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function persistenceError(code?: string): ClientActionState {
  if (code === "23505") {
    return {
      status: "error",
      message: "Já existe um cliente com este CPF.",
      fieldErrors: { cpf: ["Este CPF já está cadastrado."] },
    };
  }

  return {
    status: "error",
    message: "Não foi possível salvar o cliente agora.",
  };
}

export async function createClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  await requirePermission("clientes:gerenciar");
  const parsed = clientFormSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert(databaseValues(parsed.data))
    .select("id")
    .single();

  if (error || !data) return persistenceError(error?.code);

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}?criado=1`);
}

export async function updateClientAction(
  clientId: string,
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  await requirePermission("clientes:gerenciar");
  const validId = clientIdSchema.safeParse(clientId);
  if (!validId.success) {
    return { status: "error", message: "Cliente inválido." };
  }

  const parsed = clientFormSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .update(databaseValues(parsed.data))
    .eq("id", validId.data)
    .select("id")
    .maybeSingle();

  if (error) return persistenceError(error.code);
  if (!data) return { status: "error", message: "Cliente não encontrado." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${validId.data}`);
  redirect(`/clientes/${validId.data}?atualizado=1`);
}

export async function changeClientStatusAction(formData: FormData) {
  await requirePermission("clientes:gerenciar");
  const id = clientIdSchema.safeParse(formData.get("clientId"));
  const active = formData.get("active") === "true";
  if (!id.success) redirect("/clientes");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .update({ ativo: active })
    .eq("id", id.data)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect(`/clientes/${id.data}?erro=situacao`);

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id.data}`);
  redirect(`/clientes/${id.data}?situacao=${active ? "reativado" : "inativado"}`);
}
