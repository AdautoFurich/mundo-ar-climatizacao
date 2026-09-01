import type { UserRole } from "./types";

export const PERMISSIONS = [
  "sistema:acessar",
  "usuarios:gerenciar",
  "clientes:consultar",
  "clientes:gerenciar",
  "veiculos:consultar",
  "veiculos:gerenciar",
  "servicos:consultar",
  "servicos:gerenciar",
  "ordens:consultar",
  "ordens:atender",
  "ordens:executar",
  "relatorios:consultar",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const rolePermissions = {
  administrador: PERMISSIONS,
  atendente: [
    "sistema:acessar",
    "clientes:consultar",
    "clientes:gerenciar",
    "veiculos:consultar",
    "veiculos:gerenciar",
    "servicos:consultar",
    "ordens:consultar",
    "ordens:atender",
    "relatorios:consultar",
  ],
  tecnico: [
    "sistema:acessar",
    "clientes:consultar",
    "veiculos:consultar",
    "servicos:consultar",
    "ordens:consultar",
    "ordens:executar",
  ],
} as const satisfies Record<UserRole, readonly Permission[]>;

export function can(role: UserRole, permission: Permission) {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}
