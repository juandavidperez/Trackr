# Décisions d'architecture (ADR)

Chaque décision importante est notée ici avec son contexte et ses conséquences,
pour pouvoir la justifier plus tard (soutenance, entretien, nouveau membre de l'équipe).

---

## ADR-001 — Développer dans WSL 2 avec Docker Desktop

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** la machine de développement est sous Windows 11. Les outils DevOps (Docker, kubectl, Minikube, Helm, Terraform) et les conteneurs sont Linux.
- **Décision :** travailler dans Ubuntu 24.04 sous WSL 2, avec le moteur de Docker Desktop via l'intégration WSL. Le code vit dans le système de fichiers Linux (`~`), pas sous `/mnt/c`.
- **Conséquences :** builds et volumes rapides, scripts shell en LF, commandes identiques à celles de la CI (Ubuntu). Il faut éviter les binaires Windows présents dans le PATH (`mvn`, `npm` sous `/mnt/c`).

## ADR-002 — Modèle de branches

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Décision :** `main` (stable, démontrable) ← `develop` (intégration) ← branches de travail `devops/*` et `feature/*`. Fusion uniquement par Pull Request.
- **Conséquences :** `main` reste toujours déployable ; chaque PR déclenchera la CI (phase D).

## ADR-003 — Authentification Git par clé SSH

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** le push HTTPS avec un token a échoué (403, droits du token insuffisants).
- **Décision :** clé SSH ed25519 dédiée à la machine.
- **Conséquences :** pas de token à stocker ni à renouveler ; la clé privée ne quitte jamais la machine.

## ADR-004 — Exécuter builds et tests dans des conteneurs

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** Java et Node ne sont pas installés dans WSL ; les versions Windows de Maven et npm sont dans le PATH.
- **Décision :** lancer Maven et Node via les images du projet (`docker compose run` / `exec`).
- **Conséquences :** mêmes versions qu'en CI et en production ; rien à installer localement.

## ADR-005 — Structure du dépôt créée au fil des phases

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** la structure cible prévoit `k8s/`, `helm/`, `terraform/`, `monitoring/`, etc.
- **Décision :** ne pas créer de dossiers vides ; chaque dossier est créé dans la phase qui lui donne un contenu. Le code applicatif (`backend/`, `frontend/`) n'est pas déplacé.
- **Conséquences :** pas de fichiers `.gitkeep` inutiles ; la structure du dépôt reflète ce qui fonctionne réellement.

## ADR-006 — Normaliser les fins de ligne avec `.gitattributes`

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** un script shell en CRLF échoue dans un conteneur Linux (`/bin/sh^M: not found`). `core.autocrlf` ne s'applique qu'à une machine.
- **Décision :** fichier `.gitattributes` versionné : LF par défaut, CRLF pour `*.cmd`/`*.bat`, binaires marqués.
- **Conséquences :** comportement identique pour tout contributeur, quel que soit son OS ou sa configuration Git.

## ADR-007 — Minikube avant AWS

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Décision :** valider entièrement le déploiement Kubernetes sur Minikube avant de créer toute ressource AWS payante.
- **Conséquences :** apprentissage et corrections gratuits ; les ressources AWS ne sont créées qu'après validation locale et accord explicite sur les coûts.

## ADR-008 — Conception de la CI GitHub Actions

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Décisions :**
  - Déclenchement sur push vers `main`/`develop` et sur Pull Request : les branches de travail sont testées via leur PR, sans exécution en double.
  - `permissions: contents: read` au niveau du workflow (moindre privilège).
  - Actions tierces épinglées par **SHA de commit** (avec la version en commentaire) : un tag peut être déplacé par un attaquant, un SHA non.
  - `mvnw verify` au lieu de `test` : compile, teste et produit le `.jar`.
  - Version de Node lue depuis `frontend/.nvmrc` : une seule source de vérité.
  - Scan Trivy (dépendances + secrets) en mode rapport : les vulnérabilités existantes seront traitées en phase M, puis le job deviendra bloquant.
  - Job `ci-status` unique pour la protection de branche.
- **Reporté :** analyse de qualité de code (SonarCloud) et couverture de tests, à évaluer en phase M.

## ADR-009 — Le frontend appelle l'API par un chemin relatif `/api`

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** l'URL de l'API était écrite dans le bundle Angular au moment du build (`http://localhost:8080/api`). Une image construite pour un environnement ne fonctionnait pas dans un autre, ce qui empêche de déployer la même image (tag immuable) partout.
- **Décision :** l'image utilise `/api`. nginx, dans le même conteneur que le frontend, fait proxy vers le backend dont l'adresse est lue au démarrage (`BACKEND_URL`). En Kubernetes, l'Ingress pourra aussi router `/api` directement vers le backend.
- **Conséquences :** une seule image pour Compose, Minikube et EKS ; plus de CORS en production (même origine) ; le backend n'a plus besoin d'être exposé publiquement. Le déploiement Netlify d'origine garde son mécanisme `API_URL`.

## ADR-010 — Images de production durcies

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Décisions :**
  - Backend : runtime `eclipse-temurin:17-jre-alpine` (JRE seul, sans JDK ni Maven), utilisateur à UID numérique fixe `10001`.
  - Frontend : `nginxinc/nginx-unprivileged` (UID 101, port 8080) au lieu de `nginx` qui démarre en root.
  - `HEALTHCHECK` dans les deux images ; `-XX:MaxRAMPercentage=75` pour que la JVM respecte la limite mémoire du conteneur.
  - nginx écrase `X-Forwarded-For` avec l'IP qu'il voit : un client ne peut plus usurper une IP pour contourner le rate limiting.
- **Conséquences :** images plus petites, compatibles avec `runAsNonRoot` en Kubernetes (phase I) ; ports internes à 8080 pour les deux services.

## ADR-011 — Publication des images sur GHCR

- **Date :** 2026-11-19 · **Statut :** acceptée
- **Contexte :** les images doivent être construites une fois, testées, puis déployées telles quelles (Minikube, puis EKS).
- **Décisions :**
  - Registre : GitHub Container Registry (`ghcr.io/<owner>/trackr-backend|frontend`), authentifié par le `GITHUB_TOKEN` du workflow (`packages: write` limité au job de publication) : aucun secret à créer.
  - Déclenchement par `workflow_run` après une CI **réussie** sur un **push** vers `main`/`develop` : le code d'une PR n'est jamais publié.
  - Le tag `sha-<7>` est immuable et c'est lui qu'on déploie ; `develop`, `main` et `latest` sont des tags mobiles de confort ; `X.Y.Z` pour les releases.
  - Un test de fumée s'exécute sur l'image construite avant tout push : une image qui ne démarre pas n'est jamais publiée.
- **Limite connue :** un tag `vX.Y.Z` est publié sans attendre la CI. Il doit être posé sur un commit de `main` déjà validé (procédure formalisée en phase G).
