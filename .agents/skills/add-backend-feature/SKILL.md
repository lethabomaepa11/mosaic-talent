---
name: mosaic-talent-backend-feature-builder
description: Use this skill when building or modifying mosaic-talent backend features in the ASP.NET Boilerplate architecture — entities, DTOs, application services, DbContext registration, migrations, authorization, and domain-aligned CRUD or workflow logic.
---

# mosaic-talent Backend Feature Builder

## Overview

This skill is for working on the **mosaic-talent backend** built with:

- ASP.NET Boilerplate / ABP Zero
- .NET 9
- PostgreSQL
- Entity Framework Core
- DDD layered modular monolith architecture

Use it whenever you need to add or modify a backend feature while preserving the existing architecture and layer boundaries.

The backend is organized into these main projects:

- `mosaic-talentApi.Core` → domain layer
- `mosaic-talentApi.Application` → application services and DTOs
- `mosaic-talentApi.EntityFrameworkCore` → EF Core, DbContext, migrations
- `mosaic-talentApi.Web.Core` → shared web/auth infrastructure
- `mosaic-talentApi.Web.Host` → runtime host, startup, middleware, swagger
- `mosaic-talentApi.Migrator` → migration runner
- `test/*` → tests

---

## When to Use This Skill

Use this skill when the task involves:

- adding a new entity
- creating CRUD for an HR module
- adding DTOs
- creating or updating app services
- registering new entities in `DbContext`
- adding migrations
- implementing authorization with ABP
- reviewing whether code follows the architecture
- scaffolding backend modules in the correct folders

Examples:

- “Add a JobGrade feature”
- “Create LeaveType CRUD”
- “Scaffold EmployeeDocument module”
- “Add a RecruitmentStage entity and service”
- “Generate PayrollSettings backend feature”

---

## Architecture Rules

### 1. Respect Layer Boundaries

Follow the dependency direction:

```
Web.Host -> Web.Core -> Application -> Core
Application -> EntityFrameworkCore -> Core
```

Rules:

- Never put domain logic in `Web.Host`
- Never put EF Core concerns in `Core`
- Never put HTTP or controller concerns in `Core`
- Never bypass the application layer for normal business workflows

---

### 2. Domain Layer Rules (`mosaic-talentApi.Core`)

Place entities in:

```
aspnet-core/src/mosaic-talentApi.Core/Domains/{ModuleName}/{EntityName}.cs
```

Rules:

- entities should inherit from `FullAuditedEntity<Guid>`
- use validation attributes where appropriate
- keep business rules in the domain layer where they belong
- do not place EF Core configuration here
- do not place application service logic here
- do not place API/controller logic here

---

### 3. Application Layer Rules (`MosaicTalent.Application`)

Place services in:

```
Services/{EntityName}Service/
```

Rules:

- all app services MUST be placed under `aspnet-core/src/MosaicTalent.Application/Services/...`
- each service must have an interface
- use `AsyncCrudAppService<TEntity, TDto, Guid>` for standard CRUD
- use `ApplicationService` for custom workflows
- decorate with `[AbpAuthorize]`
- DTOs should use `[AutoMap(typeof(TEntity))]`
- DTOs should not expose EF navigation properties directly

---

### 4. EF Core Layer Rules (`mosaic-talentApi.EntityFrameworkCore`)

Rules:

- every new entity must be added to the `DbContext`
- use `DbSet<TEntity>`
- configure advanced mappings in `OnModelCreating` only when annotations are not enough
- keep migrations here
- application services should prefer `IRepository<TEntity, Guid>` over direct `DbContext` usage

---

### 5. Web Layer Rules

#### `mosaic-talentApi.Web.Core`

- shared auth/web infrastructure only
- no business logic

#### `mosaic-talentApi.Web.Host`

- startup, middleware, swagger, cors
- no business logic
- do not create controllers for standard CRUD

---

## Folder Conventions

### Domain

```
mosaic-talentApi.Core/Domains/{ModuleName}/{EntityName}.cs
```

### Application

```
MosaicTalent.Application/Services/{EntityName}Service/I{EntityName}AppService.cs
MosaicTalent.Application/Services/{EntityName}Service/{EntityName}AppService.cs
MosaicTalent.Application/Services/{EntityName}Service/DTO/{EntityName}Dto.cs
```

### EF Core

```
mosaic-talentApi.EntityFrameworkCore/EntityFrameworkCore/mosaic-talentApiDbContext.cs
```

---

## Naming Conventions

| Artifact               | Pattern               |
| ---------------------- | --------------------- |
| Entity                 | `{Entity}`            |
| DTO                    | `{Entity}Dto`         |
| Service interface      | `I{Entity}AppService` |
| Service implementation | `{Entity}AppService`  |
| Service folder         | `{Entity}Service`     |

---

## Standard Workflow

### Step 1 — Understand the Feature

Determine:

- entity name
- module name
- fields
- validation
- relationships
- CRUD vs custom logic

---

### Step 2 — Create Entity

```csharp
public class {Entity} : FullAuditedEntity<Guid>
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; }
}
```

---

### Step 3 — Create DTO

```csharp
[AutoMap(typeof({Entity}))]
public class {Entity}Dto : EntityDto<Guid>
{
    public string Name { get; set; }
}
```

---

### Step 4 — Create Interface

```csharp
public interface I{Entity}AppService : IAsyncCrudAppService<{Entity}Dto, Guid>
{
}
```

---

### Step 5 — Create Service

```csharp
[AbpAuthorize]
public class {Entity}AppService
    : AsyncCrudAppService<{Entity}, {Entity}Dto, Guid>,
      I{Entity}AppService
{
    public {Entity}AppService(IRepository<{Entity}, Guid> repository)
        : base(repository)
    {
    }
}
```

---

### Step 6 — Register in DbContext

```csharp
public DbSet<{Entity}> {EntityPlural} { get; set; }
```

---

### Step 7 — Migration

```bash
cd aspnet-core
dotnet ef migrations add Add{Entity} --project src/mosaic-talentApi.EntityFrameworkCore
```

---

## Guardrails

Do NOT:

- put business logic in controllers
- use DbContext directly in services (unless justified)
- expose EF navigation directly in DTOs
- break layer boundaries
- add logic to Web.Host

---

## Output Expectations

Always return:

1. Entity
2. DTO
3. Interface
4. Service
5. DbContext update
6. Migration command
7. Assumptions

Code must be ready to paste into the project.
