# Trackr DevOps — Suivi du projet

> Dernière mise à jour : 2026-11-19 · Branche de travail : `devops/foundation`

## Vue d'ensemble

| Phase | Intitulé | État |
|---|---|---|
| A | Fork et configuration du dépôt | ✅ Terminé |
| B | Audit de l'application | ✅ Terminé |
| C | Organisation du dépôt DevOps | 🔄 En cours |
| D | Intégration continue (GitHub Actions) | ⏳ À faire |
| E | Conteneurisation Docker | ⏳ À faire |
| F | Registre de conteneurs (GHCR) | ⏳ À faire |
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

## Problèmes connus

| # | Problème | Gravité | Phase prévue |
|---|---|---|---|
| 1 | L'image frontend prod sert `index.html` de nginx ; Angular produit `index.csr.html` | 🔴 | E |
| 2 | Aucune migration de base (`ddl-auto: update` en prod) | 🔴 | Avant I |
| 3 | URL de l'API figée au build : image non portable entre environnements | 🔴 | E |
| 4 | Rate limiting en mémoire par pod ; `X-Forwarded-For` accepté sans contrôle | 🟠 | M |
| 5 | Pas de sondes liveness/readiness ni de métriques Prometheus | 🟠 | Avant I |
| 6 | 12 vulnérabilités npm (1 critique, 7 élevées) | 🟠 | D / M |
| 7 | PostgreSQL 15 en Compose, 16 en CI | 🟡 | E |
| 8 | CI limitée à `main`, sans `permissions`, sans rapports, sans build | 🟡 | D |
| 9 | Swagger public en production | 🟡 | M |
| 10 | Spring Boot 3.2.5 n'est plus maintenu en open source | 🟡 | Hors périmètre (à documenter) |

Problème local résolu : le port 8080 était occupé par le listener Oracle (`TNSLSNR`) sur la machine de développement ; Oracle a été arrêté.

## Prochaine action recommandée

Terminer la phase C (commit + Pull Request vers `develop`), puis phase D : étendre `ci.yml`.
