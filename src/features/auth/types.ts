export const USER_ROLES = [
  "administrador",
  "atendente",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_ACTION_STATE: ActionState = { status: "idle" };
