import { describe, expect, it } from "vitest";

import {
  normalizePlate,
  transferVehicleSchema,
  vehicleFormSchema,
} from "./schemas";

const currentYear = new Date().getFullYear();

const validVehicle = {
  ownerId: "87a32e64-7e85-49d5-b518-6a899b00ce21",
  plate: "abc-1d23",
  brand: "  Chevrolet  ",
  model: "  Onix   Plus ",
  manufactureYear: String(currentYear),
  modelYear: String(currentYear + 1),
  color: "  Branco  ",
  fuel: "flex",
  notes: "  Revisar filtro   de cabine. ",
};

describe("validação de veículos", () => {
  it("normaliza e aceita placas antiga e Mercosul", () => {
    expect(normalizePlate("abc-1234")).toBe("ABC1234");
    expect(vehicleFormSchema.safeParse({ ...validVehicle, plate: "ABC-1234" }).success).toBe(true);
    expect(vehicleFormSchema.safeParse(validVehicle).success).toBe(true);
  });

  it("rejeita placas fora dos formatos brasileiros aceitos", () => {
    for (const plate of ["AB-1234", "ABCD123", "ABC12D3", "ABC 12345"]) {
      expect(vehicleFormSchema.safeParse({ ...validVehicle, plate }).success).toBe(false);
    }
  });

  it("normaliza os dados antes da gravação", () => {
    expect(vehicleFormSchema.parse(validVehicle)).toEqual({
      ownerId: validVehicle.ownerId,
      plate: "ABC1D23",
      brand: "Chevrolet",
      model: "Onix Plus",
      manufactureYear: currentYear,
      modelYear: currentYear + 1,
      color: "Branco",
      fuel: "flex",
      notes: "Revisar filtro de cabine.",
    });
  });

  it("aceita campos opcionais vazios como nulos", () => {
    const result = vehicleFormSchema.parse({
      ...validVehicle,
      color: "",
      fuel: "",
      notes: "",
    });

    expect(result.color).toBeNull();
    expect(result.fuel).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("rejeita anos fora do intervalo permitido", () => {
    expect(
      vehicleFormSchema.safeParse({ ...validVehicle, manufactureYear: "1899" }).success,
    ).toBe(false);
    expect(
      vehicleFormSchema.safeParse({ ...validVehicle, modelYear: String(currentYear + 2) }).success,
    ).toBe(false);
  });

  it("rejeita ano do modelo incompatível com a fabricação", () => {
    expect(
      vehicleFormSchema.safeParse({
        ...validVehicle,
        manufactureYear: "2020",
        modelYear: "2019",
      }).success,
    ).toBe(false);
    expect(
      vehicleFormSchema.safeParse({
        ...validVehicle,
        manufactureYear: "2020",
        modelYear: "2022",
      }).success,
    ).toBe(false);
  });

  it("rejeita combustível não previsto", () => {
    expect(
      vehicleFormSchema.safeParse({ ...validVehicle, fuel: "gnv" }).success,
    ).toBe(false);
  });

  it("valida os participantes de uma transferência", () => {
    expect(
      transferVehicleSchema.safeParse({
        vehicleId: "17a58c52-6c6d-43a3-a5c4-e71a464b45f2",
        newOwnerId: validVehicle.ownerId,
      }).success,
    ).toBe(true);
    expect(
      transferVehicleSchema.safeParse({
        vehicleId: "inválido",
        newOwnerId: validVehicle.ownerId,
      }).success,
    ).toBe(false);
  });
});
