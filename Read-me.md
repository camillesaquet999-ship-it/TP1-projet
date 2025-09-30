# But Market 360° – magasin virtuel en 3D

## 🎯 Objectif

Cette évolution du TP « Ticket de caisse » propulse l'expérience dans une **visite libre en 3D** : on s'immerge dans un supermarché
cartoon entièrement modélisé, on déambule à la première personne comme dans un jeu vidéo et l'on interagit avec les rayons, Mia
l'IA et les caissiers pour finaliser ses achats. Mia continue de générer en direct les produits manquants pour garantir que
chaque commande aboutisse sans friction.

---

## ✨ Ce qui a été ajouté

| Domaine | Description |
| --- | --- |
| Magasin jouable | Scène 3D temps réel (Three.js) avec déplacements libres au clavier, pointer lock et collisions contre les rayons. |
| Rayons interactifs | Six allées matérialisées en volume ouvrent des catalogues ciblés avec ajout instantané au panier. |
| PNJ IA | Mia flotte dans l'espace 3D, répond aux requêtes et crée à la volée les produits introuvables via `/api/lookup`. |
| Passage en caisse | Comptoirs 3D animés : s'approcher d'un caissier active la modale de paiement et imprime le ticket. |
| Identité cartoon | Éclairage néon, signalétique flottante, labels HUD projetés en 3D et overlay immersif d'entrée/sortie. |

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
│   ├── css/style.css     # Thème cartoon pastel + scène 3D et overlays HUD
│   └── js/app.js         # Moteur 3D (Three.js), déplacements, interactions PNJ, panier et caisse
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

   - Rendez-vous sur `http://127.0.0.1:5000` et cliquez sur « Entrer » pour activer la visite 3D.
   - Orientez-vous avec la **souris**, déplacez-vous avec **ZQSD/WASD** ou les flèches (maintenez **Shift** pour accélérer).
   - Approchez-vous d'un rayon et pressez **E** (ou Espace/Entrée) pour ouvrir les produits correspondants.
   - Discutez avec **Mia 🤖** pour générer instantanément tout article manquant dans la base.
   - Avancez vers un **caissier 💳** pour lancer la caisse animée et imprimer le ticket.

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

Bonnes courses immersives dans But Market 360° !
