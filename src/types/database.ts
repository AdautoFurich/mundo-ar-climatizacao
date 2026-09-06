import type { UserRole } from "@/features/auth/types";
import type { ServiceCategory } from "@/features/servicos/schemas";

export type Database = {
  public: {
    Tables: {
      historico_proprietarios_veiculos: {
        Row: {
          cliente_anterior_id: string;
          cliente_novo_id: string;
          id: string;
          transferido_em: string;
          usuario_id: string;
          veiculo_id: string;
        };
        Insert: {
          cliente_anterior_id: string;
          cliente_novo_id: string;
          id?: string;
          transferido_em?: string;
          usuario_id: string;
          veiculo_id: string;
        };
        Update: {
          cliente_anterior_id?: string;
          cliente_novo_id?: string;
          transferido_em?: string;
          usuario_id?: string;
          veiculo_id?: string;
        };
        Relationships: [];
      };
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
      veiculos: {
        Row: {
          ano_fabricacao: number;
          ano_modelo: number;
          ativo: boolean;
          atualizado_em: string;
          cliente_id: string;
          combustivel: string | null;
          cor: string | null;
          criado_em: string;
          id: string;
          marca: string;
          modelo: string;
          observacoes: string | null;
          placa: string;
        };
        Insert: {
          ano_fabricacao: number;
          ano_modelo: number;
          ativo?: boolean;
          atualizado_em?: string;
          cliente_id: string;
          combustivel?: string | null;
          cor?: string | null;
          criado_em?: string;
          id?: string;
          marca: string;
          modelo: string;
          observacoes?: string | null;
          placa: string;
        };
        Update: {
          ano_fabricacao?: number;
          ano_modelo?: number;
          ativo?: boolean;
          atualizado_em?: string;
          cliente_id?: string;
          combustivel?: string | null;
          cor?: string | null;
          marca?: string;
          modelo?: string;
          observacoes?: string | null;
          placa?: string;
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
      servicos: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          categoria: ServiceCategory;
          criado_em: string;
          descricao: string | null;
          id: string;
          nome: string;
          valor_base: number | null;
        };
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          categoria: ServiceCategory;
          criado_em?: string;
          descricao?: string | null;
          id?: string;
          nome: string;
          valor_base?: number | null;
        };
        Update: {
          ativo?: boolean;
          categoria?: ServiceCategory;
          descricao?: string | null;
          nome?: string;
          valor_base?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      transferir_proprietario_veiculo: {
        Args: {
          p_novo_cliente_id: string;
          p_veiculo_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      perfil_usuario: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
