import type { UserRole } from "@/features/auth/types";

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          bairro: string;
          cep: string;
          cidade: string;
          complemento: string | null;
          cpf: string;
          criado_em: string;
          email: string | null;
          estado: string;
          id: string;
          logradouro: string;
          nome: string;
          numero: string;
          observacoes: string | null;
          telefone_alternativo: string | null;
          telefone_principal: string;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          bairro: string;
          cep: string;
          cidade: string;
          complemento?: string | null;
          cpf: string;
          criado_em?: string;
          email?: string | null;
          estado: string;
          id?: string;
          logradouro: string;
          nome: string;
          numero: string;
          observacoes?: string | null;
          telefone_alternativo?: string | null;
          telefone_principal: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          bairro?: string;
          cep?: string;
          cidade?: string;
          complemento?: string | null;
          cpf?: string;
          email?: string | null;
          estado?: string;
          logradouro?: string;
          nome?: string;
          numero?: string;
          observacoes?: string | null;
          telefone_alternativo?: string | null;
          telefone_principal?: string;
        };
        Relationships: [];
      };
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
