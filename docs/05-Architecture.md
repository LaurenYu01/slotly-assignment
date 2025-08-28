mermaid
flowchart TB
    %% --- Client ---
    subgraph Client
      Browser["User Browser"]
    end

    %% --- Azure Cloud Production ---
    subgraph Azure["Azure Cloud (Production)"]
      FE["Frontend\nReact + Vite\nAzure Static Web App"]
      BE["Backend\nNode.js + Express\nAzure App Service"]
      DB["PostgreSQL\nDatabase (Cloud)"]
      KV["Secrets\nKey Vault / Env Vars"]
    end

    Browser -->|HTTPS| FE
    FE -->|REST API| BE
    BE -->|PG protocol| DB
    BE --> KV

    %% --- Local Development ---
    subgraph Local["Local Development"]
      FE_Local["Frontend Dev Server\nVite @ localhost:5173"]
      BE_Local["Backend Dev\nExpress @ localhost:3000"]
      DB_Local["PostgreSQL\nLocal Instance"]
    end

    Browser --> FE_Local
    FE_Local -->|REST API| BE_Local
    BE_Local --> DB_Local

    
--- - Frontend uses VITE_API_BASE_URL to connect backend - Backend binds to process.env.PORT in cloud - Secrets stored in Key Vault / env vars - Health check endpoint: /health
