# Architecture de Trackr

Ce document décrit l'architecture **actuelle** (avant modifications DevOps) et sera
mis à jour à chaque phase.

## 1. Vue d'ensemble (Docker Compose, environnement de développement)

```
                Navigateur (Windows)
          localhost:4200          localhost:8080
                │                       │
┌───────────────┼───────────────────────┼─────────────────────┐ réseau Docker
│      ┌────────▼────────┐     ┌────────▼──────────┐          │ trackr_default
│      │ frontend         │     │ backend           │  JDBC    │
│      │ Angular 21       │────▶│ Spring Boot 3.2   │──────┐   │
│      │ ng serve (dev)   │ HTTP│ Java 17           │      │   │
│      │ nginx (prod)     │ JWT │                   │      │   │
│      └─────────────────┘     └───────────────────┘      │   │
│                                                   ┌──────▼─┐ │
│                                                   │ db     │ │──▶ volume trackr_pgdata
│                                                   │ PG 15  │ │
│                                                   └────────┘ │
└─────────────────────────────────────────────────────────────┘
```

En production d'origine : frontend sur Netlify, backend sur Render, base sur Supabase.

## 2. Inventaire technique

| Composant | Technologie | Détails |
|---|---|---|
| Frontend | Angular 21.2, TypeScript 5.9, Tailwind 4 | CDK drag-drop, Chart.js, tests Vitest (101) |
| Backend | Spring Boot 3.2.5, Java 17 | Web, Data JPA, Security, Validation, Actuator |
| Authentification | JWT (jjwt 0.12.6) | Access token 15 min, refresh token 7 jours, BCrypt |
| Protection | Bucket4j | 10 req/min sur `/api/auth/**`, 60 req/min ailleurs, par IP |
| Base de données | PostgreSQL 15 (Compose), 16 (CI) | Schéma généré par Hibernate (`ddl-auto: update`) |
| Documentation API | springdoc-openapi 2.3 | `/swagger-ui/index.html` |
| Tests backend | JUnit 5, Mockito, Spring Boot Test | 126 tests |
| Conteneurs | Dockerfile + Dockerfile.dev (backend et frontend) | Builds multi-stage en prod, backend non-root |
| CI | GitHub Actions (`ci.yml`) | Tests backend et frontend, sur `main` uniquement |

## 3. Backend — organisation du code

```
com.trackr
├── controller   Auth, Project, Task, Dashboard, Health
├── service      AuthService, ProjectService, TaskService, DashboardService
├── repository   UserRepository, ProjectRepository, TaskRepository (Spring Data JPA)
├── model        User, Project, Task + enums (UserRole, TaskStatus, TaskPriority)
├── dto          Requêtes et réponses de l'API
├── security     JwtTokenProvider, JwtAuthenticationFilter, EntryPoint
├── config       SecurityConfig, RateLimitFilter, OpenApiConfig, DataSeeder (profil dev)
└── exception    GlobalExceptionHandler et exceptions métier
```

Chaîne d'une requête : `RateLimitFilter → JwtAuthenticationFilter → Controller → Service → Repository → PostgreSQL`.

## 4. API

| Domaine | Endpoints |
|---|---|
| Auth (public) | `POST /api/auth/register`, `/login`, `/refresh` |
| Projets | CRUD `/api/projects`, `/{id}/stats`, `/{id}/members` (GET, POST, DELETE) |
| Tâches | `GET /api/tasks/me`, CRUD sous `/api/projects/{id}/tasks` et `/api/tasks/{id}`, `PATCH /status`, `PATCH /position` |
| Dashboard | `GET /api/dashboard` |
| Utilisateur | `GET /api/me` |
| Santé (public) | `GET /api/health`, `GET /actuator/health` |

## 5. Configuration

| Variable | Rôle |
|---|---|
| `SPRING_DATASOURCE_URL`, `_USERNAME`, `_PASSWORD` | Connexion PostgreSQL |
| `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | Signature et durée des tokens |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées pour le frontend |
| `SPRING_PROFILES_ACTIVE` | `dev` (données de démo, SQL affiché) ou `prod` |
| `API_URL` | URL de l'API injectée **au build** du frontend |

Les valeurs locales sont dans `.env` (ignoré par Git) ; le modèle est `.env.example`.

## 6. Architecture cible (résumé)

```
Code → CI (tests, scans) → images Docker → GHCR → CD → Minikube (local)
                                                  └→ ECR → EKS + RDS (AWS, dernière phase)
                         + Prometheus / Grafana / logs centralisés
```

Le détail sera ajouté au fil des phases.
