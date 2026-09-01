import type { UserRole } from "@/features/auth/types";

export type Database = {
  public: {
    Tables: {
      perfis_usuarios: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          id: string;
          nome: string;
          perfil: UserRole;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          id: string;
          nome: string;
          perfil?: UserRole;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          nome?: string;
          perfil?: UserRole;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      perfil_usuario: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
