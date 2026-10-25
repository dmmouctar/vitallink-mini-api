# VitalLink Mini API

Petite API REST d'exercice : **Node.js + TypeScript + Express + PostgreSQL**.
Gestion de patients **fictifs** (aucune donnée réelle).

## Prérequis
- Node.js 20 ou plus
- Docker (pour PostgreSQL) **ou** PostgreSQL installé en local

## Lancer le projet

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer PostgreSQL (crée aussi la table et 2 patients fictifs)
docker compose up -d

# 3. Configurer l'environnement
cp .env.example .env        # sous Windows : copy .env.example .env

# 4. Lancer l'API en mode développement 
npm run dev
```

L'API démarre sur http://localhost:3000.

> Sans Docker : créez une base `vitallink`, puis exécutez `sql/init.sql`
> et adaptez `DATABASE_URL` dans `.env`.

## Routes

| Méthode | URL                          | Description                          | Succès |
|---------|------------------------------|--------------------------------------|--------|
| GET     | `/health`                    | Vérifie l'API et la base             | 200    |
| GET     | `/patients?page=1&size=10`   | Liste paginée (taille max 100)       | 200    |
| GET     | `/patients/:id`              | Un patient (404 si introuvable)      | 200    |
| POST    | `/patients`                  | Crée un patient (validation zod)     | 201    |

## Tester avec curl

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/patients?page=1&size=5"
curl http://localhost:3000/patients/1

curl -X POST http://localhost:3000/patients \
  -H "Content-Type: application/json" \
  -d '{"nom":"Diallo","prenom":"Test","date_naissance":"2000-05-20"}'

# Cas d'erreur : réponse 400 avec le détail des champs invalides
curl -X POST http://localhost:3000/patients \
  -H "Content-Type: application/json" -d '{"nom":""}'
```

(Sous Windows PowerShell, utilisez Postman, que vous connaissez déjà.)

## Structure

```
src/index.ts   routes, validation, gestion d'erreurs
src/db.ts      connexion PostgreSQL (pool de connexions)
sql/init.sql   table patients + index + données fictives
```

## Choix techniques
- **Requêtes paramétrées** (`$1`, `$2`) : protection contre l'injection SQL.
- **Validation avec zod** : équivalent de Bean Validation en Spring.
- **Pagination** avec taille maximale.
- **Express 5** : les erreurs des routes `async` arrivent au gestionnaire d'erreurs central.
- **Pas de données sensibles** dans les logs ni dans les réponses d'erreur.

## Pistes d'amélioration (idées, non implémentées)
- Authentification JWT (middleware)
- Tests avec Vitest + Supertest
- Migrations (Prisma, node-pg-migrate)
- Dockeriser l'API elle-même
