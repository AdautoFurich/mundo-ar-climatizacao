"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  serviceFormSchema,
  serviceIdSchema,
  type ServiceFormData,
} from "./schemas";
import type { ServiceActionState } from "./types";

function formValues(formData: FormData) {
  return {
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
  };
}

function databaseValues(data: ServiceFormData) {
  return {
    nome: data.name,
    categoria: data.category,
    descricao: data.description,
    valor_base: data.basePrice === null ? null : Number(data.basePrice),
  };
}

function validationState(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): ServiceActionState {
  return {
    status: "error",
    message: "Revise os campos indicados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function persistenceError(code?: string): ServiceActionState {
  if (code === "23505") {
    return {
      status: "error",
      message:
        "Já existe um serviço com este nome na categoria selecionada. Localize o cadastro existente ou reative-o.",
      fieldErrors: {
        name: ["Este nome já está cadastrado nesta categoria."],
      },
    };
  }
  if (code === "23514" || code === "22003") {
    return {
      status: "error",
      message: "A categoria, o valor ou o conteúdo informado não é válido.",
    };
  }
  return {
    status: "error",
    message: "Não foi possível salvar o serviço agora.",
  };
}

export async function createServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  await requirePermission("servicos:gerenciar");
  const parsed = serviceFormSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .insert(databaseValues(parsed.data))
    .select("id")
    .single();

  if (error || !data) return persistenceError(error?.code);

  revalidatePath("/servicos");
  redirect(`/servicos/${data.id}?criado=1`);
}

export async function updateServiceAction(
  serviceId: string,
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  await requirePermission("servicos:gerenciar");
  const validId = serviceIdSchema.safeParse(serviceId);
  if (!validId.success) {
    return { status: "error", message: "Serviço inválido." };
  }

  const parsed = serviceFormSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .update(databaseValues(parsed.data))
    .eq("id", validId.data)
    .select("id")
    .maybeSingle();

  if (error) return persistenceError(error.code);
  if (!data) return { status: "error", message: "Serviço não encontrado." };

  revalidatePath("/servicos");
  revalidatePath(`/servicos/${validId.data}`);
  redirect(`/servicos/${validId.data}?atualizado=1`);
}

export async function changeServiceStatusAction(formData: FormData) {
  await requirePermission("servicos:gerenciar");
  const id = serviceIdSchema.safeParse(formData.get("serviceId"));
  const active = formData.get("active") === "true";
  if (!id.success) redirect("/servicos");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .update({ ativo: active })
    .eq("id", id.data)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect(`/servicos/${id.data}?erro=situacao`);

  revalidatePath("/servicos");
  revalidatePath(`/servicos/${id.data}`);
  redirect(`/servicos/${id.data}?situacao=${active ? "reativado" : "inativado"}`);
}
