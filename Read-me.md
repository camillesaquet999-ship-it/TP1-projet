# But Market 360° – plateforme de courses virtuelle

## 🎯 Objectif

Cette évolution transforme le TP « Ticket de caisse » en une **application web immersive** permettant de réaliser des courses virtuelles avec :

- un **catalogue enrichi** (+30 produits) persisté en SQLite ;
- une **interface moderne animée** pour scanner, visualiser et encaisser ;
- une **IA embarquée** générant instantanément les produits absents du catalogue ;
- la production automatique d’un **ticket de caisse numérique et textuel**.

L’expérience simule un passage en caisse complet (client, caissier, panier, encaissement) et reste extensible vers d’autres canaux (PDF, API externe, etc.).

---

## ✨ Fonctionnalités principales

| Domaine | Description |
| --- | --- |
| Catalogue dynamique | 33 produits pré-chargés (épicerie, frais, boissons, hygiène, animaux) avec TVA, unité, origine et prix HT. |
| Assistant IA | Lors d’un scan d’article inconnu, un moteur heuristique catégorise le produit, génère un code, un prix cohérent, une TVA adaptée et l’ajoute à la base sans interrompre la commande. |
| Panier interactif | Ajout rapide depuis les cartes produit, mise à jour des quantités, suppression, calcul automatique HT/TVA/TTC. |
| Encaissement | Sélection du caissier, saisie du client, validation côté serveur, sauvegarde de la commande et des lignes de ticket. |
| Ticket réaliste | Vue récapitulative responsive + ticket ASCII imprimable (et option d’impression navigateur). |
| API JSON | Points d’entrée `/api/products`, `/api/lookup`, `/checkout` pour intégrer l’application à d’autres systèmes. |

---

## 🏗️ Architecture

```
app/
├── __init__.py           # Création de l’application Flask
├── ai.py                 # Génération déterministe des produits « IA »
├── database.py           # Connexion SQLite + session_scope
├── models.py             # SQLAlchemy ORM (Product, Cashier, Order, OrderItem)
├── receipts.py           # Construction du ticket ASCII
├── seed_data.py          # Chargement initial du catalogue et des caissiers
├── views.py              # Routes web et API (catalogue, IA, checkout, ticket)
├── static/
│   ├── css/style.css     # Thème néon, animations et responsive design
│   └── js/app.js         # Gestion du panier, appels API, UI dynamique
└── templates/            # Vues HTML (base, accueil, ticket)
```

- **Flask 3** pilote les routes HTML/API.
- **SQLAlchemy 2** gère les entités et la persistance.
- Le moteur IA repose sur des règles métier reproductibles (hash + bibliothèques de mots clés) pour garantir un prix réaliste et une origine cohérente.
- Les tickets sont stockés pour consultation ultérieure (`/receipt/<id>`).

---

## 🚀 Mise en route

1. **Installer les dépendances**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Lancer le serveur**

   ```bash
   flask --app app:create_app --debug run
   ```

   > À la première exécution, la base SQLite `app/store.db` est créée et alimentée automatiquement.

3. **Explorer l’expérience**

   - Rendez-vous sur `http://127.0.0.1:5000`.
   - Cliquez sur « Commencer mes courses » pour dévoiler les rayons.
   - Scannez un produit (ex. `C01`, `pâtes linguine`, `jus mangue`).
   - L’IA crée l’article si nécessaire puis l’ajoute au panier.
   - Sélectionnez un caissier, saisissez un client et encaissez pour afficher le ticket.

---

## 🧠 Comment fonctionne l’IA produit ?

1. **Analyse sémantique** du nom recherché (normalisation, recherche par mots clés).
2. **Sélection d’un gabarit** (fruits, boissons, hygiène…) avec TVA, unité et origine typiques.
3. **Génération déterministe** du prix et de l’origine via des fonctions de hachage (résultats stables).
4. **Création persistante** dans la base `products` avec le drapeau `created_by_ai`.

Ainsi, aucune commande n’est bloquée : chaque référence inconnue est créée « en direct » avec des informations commerciales plausibles.

---

## 🧪 Scénarios de test rapides

| Objectif | Action | Résultat attendu |
| --- | --- | --- |
| Ajout classique | Cliquer sur « Ajouter » pour `Coca Cola 1L` (quantité 2) | Panier mis à jour, totaux recalculés, pas d’erreur. |
| Création IA | Scanner `jus mangue passion` | Produit généré (code `DRK-*`), panier mis à jour, message vert. |
| Encaissement complet | Panier avec au moins 2 articles, choix d’un caissier, cliquer sur « Encaisser » | Redirection vers `/receipt/<id>`, ticket HTML + ASCII disponible. |
| Mise à jour panier | Modifier la quantité d’une ligne dans le panier | Totaux recalculés en temps réel. |
| Suppression | Retirer un article depuis le panier | Ligne supprimée, totaux actualisés. |

---

## 🔮 Pistes d’amélioration

- Export PDF ou envoi automatique par e-mail/SMS.
- Gestion des promotions, cartes de fidélité, paiement en ligne.
- Tableau de bord analytique (ventes par rayon, panier moyen).
- Intégration d’un moteur de recommandation produit en temps réel.

Bonnes courses dans But Market 360° !
