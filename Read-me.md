# But Market Toon – magasin virtuel en 2D

## 🎯 Objectif

Cette version pousse l'ancien TP « Ticket de caisse » vers une **expérience de shopping gamifiée** : on explore un magasin 2D façon
cartoon, on remplit son panier en interagissant avec les rayons et l'on passe en caisse auprès de caissiers animés. L'assistant
IA Mia est toujours présent pour créer en direct les produits absents du catalogue – aucune commande n'est bloquée.

---

## ✨ Ce qui a été ajouté

| Domaine | Description |
| --- | --- |
| Magasin jouable | Carte 2D générée dynamiquement (ZQSD/flèches) avec murs, rayons, PNJ et caisses illustrées. |
| Rayons interactifs | Chaque étal ouvre un mini catalogue ciblé (fruits, frais, boissons…) avec ajout instantané au panier. |
| PNJ IA | Mia, chatbot intégré dans le magasin, écoute les requêtes, appelle l'IA serveur `/api/lookup` et ajoute l'article créé. |
| Passage en caisse | Interaction directe avec les caissiers : résumé panier, sélection du client, validation et ticket généré. |
| Esthétique cartoon | Nouvelle charte graphique pastel, tuiles animées, personnages stylisés et panneaux arrondis. |

---

## 🏗️ Architecture (inchangée côté serveur)

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
│   ├── css/style.css     # Thème cartoon + carte 2D
│   └── js/app.js         # Mouvement, interactions PNJ, panier et caisse
└── templates/            # Vues HTML (base, magasin, ticket)
```

---

## 🚀 Démarrage rapide

1. **Installer les dépendances**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Initialiser et lancer le serveur**

   ```bash
   flask --app app:create_app --debug run
   ```

   > La base SQLite `app/store.db` est créée et alimentée automatiquement lors du premier lancement.

3. **Explorer le magasin**

   - Rendez-vous sur `http://127.0.0.1:5000`.
   - Déplacez-vous avec **ZQSD** ou les flèches.
   - Appuyez sur **Espace** ou **Entrée** devant un rayon pour consulter les produits.
   - Parlez à **Mia 🤖** pour faire apparaître des références inédites générées par l'IA.
   - Placez-vous devant un **caissier 💳** pour finaliser la commande et afficher le ticket.

---

## 🧠 IA produit en action

1. La requête saisie auprès de Mia ou d'un scan passe par `/api/lookup`.
2. Le moteur heuristique catégorise le produit, génère code, prix, TVA et origine cohérents.
3. L'article est inséré en base et renvoyé côté client, prêt à être ajouté au panier.
4. Le ticket de caisse conserve la ligne et peut être consulté sur `/receipt/<id>`.

---

## 🧪 Scénarios de test

| Objectif | Action | Résultat attendu |
| --- | --- | --- |
| Découverte | Se déplacer jusqu'au rayon fruits et ajouter un article | Panier mis à jour et message de succès. |
| Création IA | Demander « jus mangue passion » à Mia | Produit généré, ajouté au panier, message de Mia confirmant l'invention. |
| Passage en caisse | Remplir le panier, se placer devant un caissier puis valider | Redirection vers le ticket de caisse HTML + ASCII. |
| Ajustement panier | Modifier la quantité d'une ligne dans le panneau panier | Totaux recalculés instantanément côté HUD. |
| Ticket durable | Rafraîchir `/receipt/<id>` | Ticket accessible en lecture seule. |

Bonnes courses dans But Market Toon !
