# 5. Architecture Diagram

```mermaid
flowchart TB
    subgraph Client
      Browser["User Browser"]
    end

    subgraph Azure["Azure Cloud (Production)"]
      FE["Frontend\nReact + Vite\nAzure Static Web App"]
      BE["Backend\nNode.js + Express\nAzure App Service"]
      DB["PostgreSQL Database\n(Azure Flexible Server)"]
      KV["Key Vault / Env Vars"]
    end

    Browser --> FE
    FE --> BE
    BE --> DB
    BE --> KV

    subgraph Local["Local Development"]
      FE_Local["Frontend Dev Server (Vite)"]
      BE_Local["Express on localhost:3000"]
      DB_Local["PostgreSQL Local"]
    end

    Browser --> FE_Local
    FE_Local --> BE_Local
    BE_Local --> DB_Local
```

---

- **Frontend**: React + Vite. Connects via `VITE_API_BASE_URL`  
- **Backend**: Node.js + Express, binds `process.env.PORT` in Azure App Service  
- **Database**: PostgreSQL (local in dev, Azure Flexible Server in production)  
- **Secrets**: Stored in `.env` locally or Azure Key Vault in production  
- **Health Check**: `/health` endpoint  
