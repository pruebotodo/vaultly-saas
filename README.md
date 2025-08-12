# Vaultly SaaS (Full)

- `server/` Node/Express (auth con Supabase, ingestión por URL/archivo, transcripción OpenAI, resumen/categorías, Stripe).
- `web/` Vite/React (login con Supabase, UI de ingestión, tabla + detalle, búsqueda y upgrade Pro).
- `supabase.sql` Tablas y RLS.

## Variables de entorno (server)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE, OPENAI_API_KEY (opcional),
STRIPE_SECRET_KEY (opcional), STRIPE_PRICE_ID_PRO (opcional), STRIPE_WEBHOOK_SECRET (opcional),
FRONTEND_URL, NODE_VERSION=20

## Variables de entorno (web)
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE
