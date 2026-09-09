import { normalizePlate } from "./schemas";

export function formatPlate(value: string) {
  const plate = normalizePlate(value).slice(0, 7);
  return /^[A-Z]{3}[0-9]{4}$/.test(plate)
    ? plate.replace(/^([A-Z]{3})([0-9]{4})$/, "$1-$2")
    : plate;
}

export function formatVehicleYear(manufactureYear: number, modelYear: number) {
  return `${manufactureYear}/${modelYear}`;
}

export function formatFuel(value: string | null) {
  const labels: Record<string, string> = {
    gasolina: "Gasolina",
    etanol: "Etanol",
    flex: "Flex",
    diesel: "Diesel",
    eletrico: "Elétrico",
    hibrido: "Híbrido",
  };

  return value ? (labels[value] ?? value) : "Não informado";
}

export function formatVehicleDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
