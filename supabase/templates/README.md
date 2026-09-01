# Modelos de autenticação

Os modelos `invite.html` e `recovery.html` estão preparados para o fluxo SSR com `token_hash`.

No plano gratuito, o Supabase não permite alterar os modelos enquanto o projeto usa o provedor de e-mail padrão. Até a configuração de um SMTP próprio, a aplicação usa `/auth/callback` para aceitar os links padrão por PKCE ou fragmento de sessão.

Quando um SMTP próprio for configurado, habilite estes modelos em `supabase/config.toml` e sincronize a configuração.
