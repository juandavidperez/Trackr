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
