"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  transferVehicleSchema,
  vehicleEditFormSchema,
  vehicleFormSchema,
  vehicleIdSchema,
  type VehicleEditFormData,
  type VehicleFormData,
} from "./schemas";
import type { VehicleActionState } from "./types";

function formValues(formData: FormData) {
  return {
    ownerId: formData.get("ownerId"),
    plate: formData.get("plate"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    manufactureYear: formData.get("manufactureYear"),
    modelYear: formData.get("modelYear"),
    color: formData.get("color"),
    fuel: formData.get("fuel"),
    notes: formData.get("notes"),
  };
}

function databaseValues(data: VehicleFormData | VehicleEditFormData) {
  return {
    placa: data.plate,
    marca: data.brand,
    modelo: data.model,
    ano_fabricacao: data.manufactureYear,
    ano_modelo: data.modelYear,
    cor: data.color,
    combustivel: data.fuel,
    observacoes: data.notes,
  };
}

function validationState(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): VehicleActionState {
  return {
    status: "error",
    message: "Revise os campos indicados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function persistenceError(code?: string): VehicleActionState {
  if (code === "23505") {
    return {
      status: "error",
      message: "Já existe um veículo com esta placa.",
      fieldErrors: { plate: ["Esta placa já está cadastrada."] },
    };
  }

  if (code === "23503" || code === "23514") {
    return {
      status: "error",
      message: "O proprietário ou os dados do veículo não são mais válidos.",
    };
  }

  return {
    status: "error",
    message: "Não foi possível salvar o veículo agora.",
  };
}

async function isActiveClient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function createVehicleAction(
  _previousState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  await requirePermission("veiculos:gerenciar");
  const parsed = vehicleFormSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  if (!(await isActiveClient(parsed.data.ownerId))) {
    return {
      status: "error",
      message: "Selecione um cliente ativo como proprietário.",
      fieldErrors: { ownerId: ["O cliente não existe ou está inativo."] },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .insert({
      cliente_id: parsed.data.ownerId,
      ...databaseValues(parsed.data),
    })
    .select("id")
    .single();

  if (error || !data) return persistenceError(error?.code);

  revalidatePath("/veiculos");
  revalidatePath(`/clientes/${parsed.data.ownerId}`);
  redirect(`/veiculos/${data.id}?criado=1`);
}

export async function updateVehicleAction(
  vehicleId: string,
  _previousState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  await requirePermission("veiculos:gerenciar");
  const validId = vehicleIdSchema.safeParse(vehicleId);
  if (!validId.success) {
    return { status: "error", message: "Veículo inválido." };
  }

  const values = formValues(formData);
  const parsed = vehicleEditFormSchema.safeParse({
    plate: values.plate,
    brand: values.brand,
    model: values.model,
    manufactureYear: values.manufactureYear,
    modelYear: values.modelYear,
    color: values.color,
    fuel: values.fuel,
    notes: values.notes,
  });
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .update(databaseValues(parsed.data))
    .eq("id", validId.data)
    .select("id, cliente_id")
    .maybeSingle();

  if (error) return persistenceError(error.code);
  if (!data) return { status: "error", message: "Veículo não encontrado." };

  revalidatePath("/veiculos");
  revalidatePath(`/veiculos/${validId.data}`);
  revalidatePath(`/clientes/${data.cliente_id}`);
  redirect(`/veiculos/${validId.data}?atualizado=1`);
}

export async function transferVehicleAction(
  _previousState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  await requirePermission("veiculos:gerenciar");
  const parsed = transferVehicleSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    newOwnerId: formData.get("newOwnerId"),
  });
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("veiculos")
    .select("cliente_id")
    .eq("id", parsed.data.vehicleId)
    .maybeSingle();

  if (vehicleError || !vehicle) {
    return { status: "error", message: "Veículo não encontrado." };
  }
  if (vehicle.cliente_id === parsed.data.newOwnerId) {
    return {
      status: "error",
      message: "Selecione um cliente diferente do proprietário atual.",
      fieldErrors: { newOwnerId: ["Este cliente já é o proprietário."] },
    };
  }

  const { error } = await supabase.rpc("transferir_proprietario_veiculo", {
    p_veiculo_id: parsed.data.vehicleId,
    p_novo_cliente_id: parsed.data.newOwnerId,
  });
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23514"
          ? "O novo proprietário não está disponível para a transferência."
          : "Não foi possível transferir o veículo agora.",
    };
  }

  revalidatePath("/veiculos");
  revalidatePath(`/veiculos/${parsed.data.vehicleId}`);
  revalidatePath(`/clientes/${vehicle.cliente_id}`);
  revalidatePath(`/clientes/${parsed.data.newOwnerId}`);
  redirect(`/veiculos/${parsed.data.vehicleId}?transferido=1`);
}

export async function changeVehicleStatusAction(formData: FormData) {
  await requirePermission("veiculos:gerenciar");
  const id = vehicleIdSchema.safeParse(formData.get("vehicleId"));
  const active = formData.get("active") === "true";
  if (!id.success) redirect("/veiculos");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .update({ ativo: active })
    .eq("id", id.data)
    .select("id, cliente_id")
    .maybeSingle();

  if (error || !data) redirect(`/veiculos/${id.data}?erro=situacao`);

  revalidatePath("/veiculos");
  revalidatePath(`/veiculos/${id.data}`);
  revalidatePath(`/clientes/${data.cliente_id}`);
  redirect(`/veiculos/${id.data}?situacao=${active ? "reativado" : "inativado"}`);
}
