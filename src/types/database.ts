import type { ServiceCategory } from "@/features/servicos/schemas"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bairro: string
          cep: string
          cidade: string
          complemento: string | null
          cpf: string
          criado_em: string
          email: string | null
          estado: string
          id: string
          logradouro: string
          nome: string
          numero: string
          observacoes: string | null
          telefone_alternativo: string | null
          telefone_principal: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bairro: string
          cep: string
          cidade: string
          complemento?: string | null
          cpf: string
          criado_em?: string
          email?: string | null
          estado: string
          id?: string
          logradouro: string
          nome: string
          numero: string
          observacoes?: string | null
          telefone_alternativo?: string | null
          telefone_principal: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bairro?: string
          cep?: string
          cidade?: string
          complemento?: string | null
          cpf?: string
          criado_em?: string
          email?: string | null
          estado?: string
          id?: string
          logradouro?: string
          nome?: string
          numero?: string
          observacoes?: string | null
          telefone_alternativo?: string | null
          telefone_principal?: string
        }
        Relationships: []
      }
      historico_proprietarios_veiculos: {
        Row: {
          cliente_anterior_id: string
          cliente_novo_id: string
          id: string
          transferido_em: string
          usuario_id: string
          veiculo_id: string
        }
        Insert: {
          cliente_anterior_id: string
          cliente_novo_id: string
          id?: string
          transferido_em?: string
          usuario_id: string
          veiculo_id: string
        }
        Update: {
          cliente_anterior_id?: string
          cliente_novo_id?: string
          id?: string
          transferido_em?: string
          usuario_id?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_proprietarios_veiculos_cliente_anterior_id_fkey"
            columns: ["cliente_anterior_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_proprietarios_veiculos_cliente_novo_id_fkey"
            columns: ["cliente_novo_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_proprietarios_veiculos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_proprietarios_veiculos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          acessorios: string | null
          atualizado_em: string
          atualizado_por: string
          avarias_visiveis: string | null
          cliente_cpf: string
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          criado_em: string
          criado_por: string
          desconto: number
          entrada_em: string
          id: string
          nivel_combustivel: string
          numero: number
          observacoes_entrada: string | null
          previsao_conclusao_em: string | null
          quilometragem: number
          relato_cliente: string
          responsavel_id: string
          situacao: string
          subtotal_autorizado: number
          subtotal_materiais: number
          subtotal_orcado: number
          subtotal_servicos: number
          total_autorizado: number
          total_final: number
          total_orcado: number
          veiculo_ano_fabricacao: number
          veiculo_ano_modelo: number
          veiculo_id: string
          veiculo_marca: string
          veiculo_modelo: string
          veiculo_placa: string
          versao: number
        }
        Insert: {
          acessorios?: string | null
          atualizado_em?: string
          atualizado_por: string
          avarias_visiveis?: string | null
          cliente_cpf: string
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          criado_em?: string
          criado_por: string
          desconto?: number
          entrada_em: string
          id?: string
          nivel_combustivel: string
          numero?: number
          observacoes_entrada?: string | null
          previsao_conclusao_em?: string | null
          quilometragem: number
          relato_cliente: string
          responsavel_id: string
          situacao?: string
          subtotal_autorizado?: number
          subtotal_materiais?: number
          subtotal_orcado?: number
          subtotal_servicos?: number
          total_autorizado?: number
          total_final?: number
          total_orcado?: number
          veiculo_ano_fabricacao: number
          veiculo_ano_modelo: number
          veiculo_id: string
          veiculo_marca: string
          veiculo_modelo: string
          veiculo_placa: string
          versao?: number
        }
        Update: {
          acessorios?: string | null
          atualizado_em?: string
          atualizado_por?: string
          avarias_visiveis?: string | null
          cliente_cpf?: string
          cliente_id?: string
          cliente_nome?: string
          cliente_telefone?: string
          criado_em?: string
          criado_por?: string
          desconto?: number
          entrada_em?: string
          id?: string
          nivel_combustivel?: string
          numero?: number
          observacoes_entrada?: string | null
          previsao_conclusao_em?: string | null
          quilometragem?: number
          relato_cliente?: string
          responsavel_id?: string
          situacao?: string
          subtotal_autorizado?: number
          subtotal_materiais?: number
          subtotal_orcado?: number
          subtotal_servicos?: number
          total_autorizado?: number
          total_final?: number
          total_orcado?: number
          veiculo_ano_fabricacao?: number
          veiculo_ano_modelo?: number
          veiculo_id?: string
          veiculo_marca?: string
          veiculo_modelo?: string
          veiculo_placa?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico_aprovacoes: {
        Row: {
          canal: string
          criado_em: string
          decisao: string
          id: string
          item_id: string
          observacoes: string | null
          ordem_servico_id: string
          respondido_em: string
          usuario_id: string
        }
        Insert: {
          canal: string
          criado_em?: string
          decisao: string
          id?: string
          item_id: string
          observacoes?: string | null
          ordem_servico_id: string
          respondido_em: string
          usuario_id: string
        }
        Update: {
          canal?: string
          criado_em?: string
          decisao?: string
          id?: string
          item_id?: string
          observacoes?: string | null
          ordem_servico_id?: string
          respondido_em?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_aprovacoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_aprovacoes_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_aprovacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico_diagnosticos: {
        Row: {
          criado_em: string
          descricao: string
          id: string
          observacoes: string | null
          ordem_servico_id: string
          previsao_conclusao_em: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          descricao: string
          id?: string
          observacoes?: string | null
          ordem_servico_id: string
          previsao_conclusao_em?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          ordem_servico_id?: string
          previsao_conclusao_em?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_diagnosticos_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_diagnosticos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico_entregas: {
        Row: {
          atualizado_em: string
          criado_em: string
          entregue_em: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          ordem_servico_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          entregue_em: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          ordem_servico_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          entregue_em?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          ordem_servico_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_entregas_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: true
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_entregas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico_historico: {
        Row: {
          criado_em: string
          evento: string
          id: string
          justificativa: string | null
          metadados: Json
          ordem_servico_id: string
          resumo: string
          situacao_anterior: string | null
          situacao_posterior: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          evento: string
          id?: string
          justificativa?: string | null
          metadados?: Json
          ordem_servico_id: string
          resumo: string
          situacao_anterior?: string | null
          situacao_posterior?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          evento?: string
          id?: string
          justificativa?: string | null
          metadados?: Json
          ordem_servico_id?: string
          resumo?: string
          situacao_anterior?: string | null
          situacao_posterior?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_historico_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico_itens: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          descricao: string
          executado_em: string | null
          executado_por: string | null
          id: string
          ordem: number
          ordem_servico_id: string
          quantidade: number
          removido_em: string | null
          removido_por: string | null
          servico_id: string | null
          situacao_aprovacao: string
          subtotal: number | null
          tipo: string
          valor_unitario: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          descricao: string
          executado_em?: string | null
          executado_por?: string | null
          id?: string
          ordem?: number
          ordem_servico_id: string
          quantidade: number
          removido_em?: string | null
          removido_por?: string | null
          servico_id?: string | null
          situacao_aprovacao?: string
          subtotal?: number | null
          tipo: string
          valor_unitario: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          descricao?: string
          executado_em?: string | null
          executado_por?: string | null
          id?: string
          ordem?: number
          ordem_servico_id?: string
          quantidade?: number
          removido_em?: string | null
          removido_por?: string | null
          servico_id?: string | null
          situacao_aprovacao?: string
          subtotal?: number | null
          tipo?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_itens_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_itens_executado_por_fkey"
            columns: ["executado_por"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_itens_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_itens_removido_por_fkey"
            columns: ["removido_por"]
            isOneToOne: false
            referencedRelation: "perfis_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id: string
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: ServiceCategory
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          valor_base: number | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria: ServiceCategory
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          valor_base?: number | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: ServiceCategory
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          valor_base?: number | null
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano_fabricacao: number
          ano_modelo: number
          ativo: boolean
          atualizado_em: string
          cliente_id: string
          combustivel: string | null
          cor: string | null
          criado_em: string
          id: string
          marca: string
          modelo: string
          observacoes: string | null
          placa: string
        }
        Insert: {
          ano_fabricacao: number
          ano_modelo: number
          ativo?: boolean
          atualizado_em?: string
          cliente_id: string
          combustivel?: string | null
          cor?: string | null
          criado_em?: string
          id?: string
          marca: string
          modelo: string
          observacoes?: string | null
          placa: string
        }
        Update: {
          ano_fabricacao?: number
          ano_modelo?: number
          ativo?: boolean
          atualizado_em?: string
          cliente_id?: string
          combustivel?: string | null
          cor?: string | null
          criado_em?: string
          id?: string
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adicionar_item_ordem: {
        Args: {
          p_descricao: string
          p_ordem_id: string
          p_quantidade: number
          p_servico_id: string | null
          p_tipo: string
          p_valor_unitario: number
          p_versao: number
        }
        Returns: string
      }
      alterar_item_ordem: {
        Args: {
          p_descricao: string
          p_item_id: string
          p_ordem_id: string
          p_quantidade: number
          p_servico_id: string | null
          p_tipo: string
          p_valor_unitario: number
          p_versao: number
        }
        Returns: number
      }
      aplicar_desconto_ordem: {
        Args: { p_desconto: number; p_ordem_id: string; p_versao: number }
        Returns: number
      }
      avancar_ordem_servico: {
        Args: { p_destino: string; p_ordem_id: string; p_versao: number }
        Returns: number
      }
      cancelar_ordem_servico: {
        Args: { p_justificativa: string; p_ordem_id: string; p_versao: number }
        Returns: number
      }
      criar_ordem_servico: {
        Args: {
          p_acessorios: string | null
          p_avarias: string | null
          p_cliente_id: string
          p_entrada_em: string
          p_nivel_combustivel: string
          p_observacoes: string | null
          p_previsao_em: string | null
          p_quilometragem: number
          p_relato: string
          p_responsavel_id: string
          p_veiculo_id: string
        }
        Returns: string
      }
      entregar_ordem_servico: {
        Args: {
          p_entregue_em: string
          p_forma: string
          p_observacoes: string
          p_ordem_id: string
          p_versao: number
        }
        Returns: number
      }
      marcar_item_executado: {
        Args: {
          p_executado: boolean
          p_item_id: string
          p_ordem_id: string
          p_versao: number
        }
        Returns: number
      }
      reabrir_ordem_servico: {
        Args: { p_justificativa: string; p_ordem_id: string; p_versao: number }
        Returns: number
      }
      registrar_aprovacao_item_ordem: {
        Args: {
          p_canal: string
          p_decisao: string
          p_item_id: string
          p_observacoes: string
          p_ordem_id: string
          p_respondido_em: string
          p_versao: number
        }
        Returns: number
      }
      registrar_aprovacoes_ordem: {
        Args: {
          p_canal: string
          p_decisoes: Json
          p_observacoes: string | null
          p_ordem_id: string
          p_respondido_em: string
          p_versao: number
        }
        Returns: number
      }
      remover_item_ordem: {
        Args: { p_item_id: string; p_ordem_id: string; p_versao: number }
        Returns: number
      }
      retroceder_ordem_servico: {
        Args: {
          p_destino: string
          p_justificativa: string
          p_ordem_id: string
          p_versao: number
        }
        Returns: number
      }
      salvar_diagnostico_ordem: {
        Args: {
          p_descricao: string
          p_observacoes: string | null
          p_ordem_id: string
          p_previsao_em: string | null
          p_versao: number
        }
        Returns: number
      }
      transferir_proprietario_veiculo: {
        Args: { p_novo_cliente_id: string; p_veiculo_id: string }
        Returns: string
      }
    }
    Enums: {
      perfil_usuario: "administrador" | "atendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      perfil_usuario: ["administrador", "atendente"],
    },
  },
} as const
