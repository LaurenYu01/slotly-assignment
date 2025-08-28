mermaid
flowchart TB
    subgraph Client
      Browser
    end

    subgraph Azure
      FE[Frontend: React + Vite (Static Web App)]
      BE[Backend: Node.js + Express (App Service)]
      DB[(PostgreSQL)]
      KV[Key Vault / Env Vars]
    end

    Browser --> FE
    FE --> BE
    BE --> DB
    BE --> KV

    subgraph Local
      FE_Local[React Dev Server]
      BE_Local[Express Localhost]
      DB_Local[(PostgreSQL Local)]
    end

    Browser --> FE_Local
    FE_Local --> BE_Local
    BE_Local --> DB_Local
--- - Frontend uses VITE_API_BASE_URL to connect backend - Backend binds to process.env.PORT in cloud - Secrets stored in Key Vault / env vars - Health check endpoint: /health
