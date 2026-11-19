# Trackr DevOps — Suivi du projet

> Dernière mise à jour : 2026-11-19 · Branche de travail : `devops/foundation`

## Vue d'ensemble

| Phase | Intitulé | État |
|---|---|---|
| A | Fork et configuration du dépôt | ✅ Terminé |
| B | Audit de l'application | ✅ Terminé |
| C | Organisation du dépôt DevOps | ✅ Terminé |
| D | Intégration continue (GitHub Actions) | ✅ Terminé |
| E | Conteneurisation Docker | ✅ Terminé |
| F | Registre de conteneurs (GHCR) | 🔄 En cours |
| G | Déploiement continu | ⏳ À faire |
| H | Préparation de Minikube | ⏳ À faire |
| — | Préparation K8s (Flyway, sondes, métriques) | ⏳ À faire |
| I – L | Manifests, déploiement Minikube, K8s avancé, Helm | ⏳ À faire |
| M – O | DevSecOps, Terraform, Ansible | ⏳ À faire |
| P – S | Prometheus, Grafana, logs, tests de charge | ⏳ À faire |
| T – Z | AWS (dernière étape) | ⏳ À faire |

## Phase A — Fork et configuration du dépôt ✅

- Fork : `yasminehaba/Trackr` · `upstream` = `juandavidperez/Trackr`
- Clone dans le système de fichiers WSL (`~/devopsProject/Trackr`), pas sous `/mnt/c`
- Authentification GitHub par clé SSH (ed25519)
- Branches : `main` (stable), `develop` (intégration), `devops/foundation` (travail)
- `core.autocrlf=input` configuré

## Phase B — Audit de l'application ✅

### Résultats de validation (2026-11-19)

| Vérification | Résultat |
|---|---|
| Stack dev Docker Compose (db, backend, frontend) | ✅ 3 conteneurs démarrés, db *healthy* |
| `GET /api/health` (dev et prod) | ✅ `{"status":"UP"}` |
| Connexion `admin@trackr.dev` + Kanban (dev) | ✅ Fonctionnel |
| Tests backend (JUnit 5 + Mockito) | ✅ 126/126 — BUILD SUCCESS |
| Tests frontend (Vitest) | ✅ 101/101 — 18 fichiers |
| Image backend de production | ✅ Démarre et répond |
| Image frontend de production | ❌ Sert la page « Welcome to nginx! » |

## Phase C — Organisation du dépôt ✅

- `.gitattributes` : LF imposé (CRLF pour `*.cmd`/`*.bat`), binaires marqués — vérifié avec `git ls-files --eol`
- Documents de suivi : `PROJECT_PROGRESS.md`, `ARCHITECTURE.md`, `DECISIONS.md` (ADR-001 à 007)
- README : nombres de tests corrigés (126 backend, 101 frontend)
- Commit `754ae1e` sur `devops/foundation`

## Phase D — Intégration continue 🔄

- `ci.yml` réécrit : jobs `backend`, `frontend`, `security`, `ci-status`
- Déclencheurs : push sur `main`/`develop`, PR vers `main`/`develop`, lancement manuel
- Rapports JUnit publiés en artefacts + résumé dans l'onglet *Summary* (`scripts/ci/junit-summary.py`)

### Résultats de validation (2026-11-19)

| Exécution | Événement | Résultat |
|---|---|---|
| CI #1 | PR #1 ouverte | ✅ 4/4 jobs (backend 58 s, frontend 48 s) |
| CI #2 | Test volontairement cassé (`JwtTokenProviderTest`) | ❌ backend + CI status — échec détecté |
| CI #3 | Revert du test cassé | ✅ |
| CI #4 | Fusion de la PR #1 dans `develop` | ✅ |

## Phase E — Conteneurisation Docker ✅

- Frontend : nginx non-root (`nginx-unprivileged`, port 8080), page par défaut supprimée, `index.csr.html` renommé, proxy `/api` vers le backend, `/healthz`, en-têtes de sécurité
- Backend : runtime JRE seul (Temurin 17), UID fixe 10001, `HEALTHCHECK` sur `/actuator/health`, heap adapté au conteneur
- Compose : PostgreSQL 16 partout ; en prod, seul le frontend est publié (port 80)
- Config nginx testée avec le build Angular réel : `/`, `/login`, `/projects/3` → page Trackr ; `/api/*` → backend ; `X-Forwarded-For` usurpé remplacé

### Résultats de validation (2026-11-19, `docker-compose.prod.yml`)

| Test | Résultat |
|---|---|
| Taille des images | backend 370 Mo (568 Mo avant, −35 %) · frontend 82,6 Mo (94,7 Mo avant) |
| Utilisateurs | `uid=10001(trackr)` · `uid=101(nginx)` — aucun conteneur root |
| Page servie | `<title>Trackr</title>` — bug « Welcome to nginx! » corrigé |
| Route SPA `/projects/1` | 200 |
| `/healthz` · `/api/health` via nginx | `ok` · `{"status":"UP"}` |
| Backend non exposé (port 8080) | Connexion refusée ✅ |
| Inscription + connexion via `/api` | JWT reçu (même origine, sans CORS) |
| Création de projet authentifiée | `id 1` créé |
| Persistance après `down` / `up` | Projet retrouvé (volume `trackr_pgdata` conservé) |
| Démarrage ordonné | db healthy → backend healthy (≈ 22 s) → frontend |

## Phase F — Registre de conteneurs (GHCR) 🔄

- Workflow `publish.yml` : après une CI verte sur `main`/`develop`, sur tag `vX.Y.Z` ou manuellement
- Build → test de fumée (backend avec PostgreSQL, frontend : page Trackr + route SPA, utilisateur non-root) → push
- Tags : `sha-<7>` (immuable), `develop`/`main`, `latest` (main), `X.Y.Z`/`X.Y` (release)
- `docker-compose.prod.yml` accepte `BACKEND_IMAGE` / `FRONTEND_IMAGE` pour lancer les images publiées
- Validation à faire : images visibles sur GHCR, `docker pull`, démarrage de la stack avec les images publiées

## Problèmes connus

| # | Problème | Gravité | Phase prévue |
|---|---|---|---|
| 1 | L'image frontend prod sert `index.html` de nginx ; Angular produit `index.csr.html` | 🔴 | E — corrigé et validé |
| 2 | Aucune migration de base (`ddl-auto: update` en prod) | 🔴 | Avant I |
| 3 | URL de l'API figée au build : image non portable entre environnements | 🔴 | E — corrigé et validé (`/api` relatif) |
| 4 | Rate limiting en mémoire par pod ; `X-Forwarded-For` accepté sans contrôle | 🟠 | En-tête neutralisé par nginx (E) ; stockage partagé en M |
| 5 | Pas de sondes liveness/readiness ni de métriques Prometheus | 🟠 | Avant I |
| 6 | 12 vulnérabilités npm (1 critique, 7 élevées) | 🟠 | D / M |
| 7 | PostgreSQL 15 en Compose, 16 en CI | 🟡 | E — corrigé et validé |
| 8 | CI limitée à `main`, sans `permissions`, sans rapports, sans build | 🟡 | D |
| 9 | Swagger public en production | 🟡 | M |
| 10 | Spring Boot 3.2.5 n'est plus maintenu en open source | 🟡 | Hors périmètre (à documenter) |

Problème local résolu : le port 8080 était occupé par le listener Oracle (`TNSLSNR`) sur la machine de développement ; Oracle a été arrêté.

## Prochaine action recommandée

Fusionner la PR de la phase F, vérifier la publication sur GHCR, puis lancer la stack avec les images publiées.
