mermaid
flowchart TB
    subgraph Client
      Browser[User Browser]
    end

    subgraph Azure["Azure Cloud (Production)"]
      FE[Frontend: React + Vite (Azure Static Web App)]
      BE[Backend: Node.js + Express (Azure App Service)]
      DB[(PostgreSQL Database - Azure Flexible Server)]
      KV[Key Vault / Environment Variables]
    end

    subgraph Local["Local Development"]
      FE_Local[React Dev Server (Vite)]
      BE_Local[Express on localhost:3000]
      DB_Local[(PostgreSQL Local Instance)]
    end

    %% Cloud flows
    Browser --> FE
    FE --> BE
    BE --> DB
    BE --> KV

    %% Local flows
    Browser --> FE_Local
    FE_Local --> BE_Local
    BE_Local --> DB_Local
--- - **Frontend**: React + Vite. Connects to backend via VITE_API_BASE_URL - **Backend**: Node.js + Express. Listens on process.env.PORT in Azure App Service - **Database**: PostgreSQL (local in dev, Azure in production) - **Secrets**: Stored in Azure Key Vault or environment variables - **Health Check**: /health endpoint used for monitoring
