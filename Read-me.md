

#  Ticket de caisse – TP Python

##  Présentation

Ce projet consiste à développer un **système de génération de tickets de caisse** en Python.
Il s’agit d’un TP encadré visant à apprendre :

* l’utilisation de **Python** en ligne de commande,
* la **gestion de données** (catalogue produits, TVA, poids/volume),
* le **versionnement Git** et l’organisation de projet (**Trello, GitHub, branches, tags**),
* la **gestion des besoins client** (Lot 1 → Lot 2 avec nouvelles fonctionnalités).

---

##  Fonctionnalités

### Lot 1

* Catalogue produit simple (code, nom, prix HT).
* Calcul **Total HT, TVA (10%), Total TTC**.
* Affichage ticket formaté (colonnes article, quantité, prix unitaire, total HT).
* README explicatif et plan de tests.

### Lot 2

* Catalogue enrichi (code, nom, prix HT, TVA spécifique, poids/volume, origine).
* Gestion de la **TVA variable** (10% ou 20%).
* Affichage du **poids/volume unitaire** et du **poids/volume total**.
* Affichage de l’**origine** des produits.
* Ticket complet, réaliste, proche d’un ticket de caisse imprimé.
* Nouveaux tests (cas TVA mixte, poids calculé, plusieurs produits).

---

##  Structure du projet

```
.
├── main.py        # Script Lot 1
├── main2.py       # Script Lot 2
├── README.md      # Documentation
├── tests/         # (optionnel) Dossiers de tests unitaires
└── data/          # (optionnel) Base produits JSON ou CSV
```

---

##  Installation

### 1. Cloner le projet

```bash
git clone https://github.com/jb2brest/tpiut.git
cd tpiut
git checkout 2025-Lannion-3A2-SAQUET-ROINET
```

### 2. Prérequis

* Python ≥ 3.8
* Aucune dépendance externe nécessaire (utilise uniquement la bibliothèque standard).

---

##  Utilisation

### Lot 1 (TVA fixe 10%)

```bash
python3 main.py "But Market" "Lisa" "C01:2|C02:1|C03:3"
```

**Exemple de sortie** :

```
========================================
              But Market               
Vendeur : Lisa                 30/09/2025 14:12
----------------------------------------
Article              Qté  PU HT Total HT
----------------------------------------
Coca Cola              2   1.20    2.40
Biscottes              1   2.50    2.50
Crackers               3   1.80    5.40
----------------------------------------
Total HT                          10.30 €
TVA (10%)                          1.03 €
Total TTC                         11.33 €
========================================
   Merci de votre visite et à bientôt !  
========================================
```

---

### Lot 2 (TVA variable, poids/volume et origine)

```bash
python3 main.py "But Market" "Lisa" "C01:1|C02:3|C03:4"
```

**Exemple de sortie** :

```
But Market
Ticket numéro : 2200
Date : 30/09/2025

Vous avez été servi par : Lisa

NB  Desc.           Pds/vol. unit. Pds/vol. total Orig.        HT   TVA    Total
1   pack de coca    2kg            2kg            Lituanie      5€ 20%    6.0€
3   kilo de pdt     1kg            3kg            Espagne       1€ 10%    3.3€
4   pack Biscotte   950g           3.8kg          France        2€ 10%    8.8€

Total HT            16.0€
Total TVA           2.1€
Total TTC           18.1€
```

---

##  Options d’évolution

* Export du ticket en **PDF** ou **fichier texte**.
* Interface graphique (Tkinter ou PyQt).
* Base de données produits externe (CSV/JSON/SQLite).
* Gestion des réductions et promotions.

---

##  Plan de tests

### Lot 1

| Objectif                       | Commande                                      | Résultat attendu                                      |                                                          |
| ------------------------------ | --------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Ticket avec 1 produit          | `python3 main.py "But Market" "Lisa" "C01:1"` | Ticket avec Coca Cola x1, HT=1.20, TVA=0.12, TTC=1.32 |                                                          |
| Ticket avec plusieurs produits | `python3 main.py "But Market" "Lisa" "C01:2   | C02:1"`                                               | Ticket avec Coca Cola x2 + Biscottes x1, totaux corrects |
| Code invalide                  | `python3 main.py "But Market" "Lisa" "C99:1"` | Produit ignoré, ticket sans erreur                    |                                                          |

### Lot 2

| Objectif             | Commande                                      | Résultat attendu                            |         |                                                             |
| -------------------- | --------------------------------------------- | ------------------------------------------- | ------- | ----------------------------------------------------------- |
| Produit avec TVA 20% | `python3 main.py "But Market" "Lisa" "C01:1"` | Affiche TVA 20% sur Coca, total TTC correct |         |                                                             |
| Calcul poids total   | `python3 main.py "But Market" "Lisa" "C02:3"` | Poids total = 3kg                           |         |                                                             |
| Mix TVA et poids     | `python3 main.py "But Market" "Lisa" "C01:1   | C02:3                                       | C03:4"` | Affiche poids total par produit, TVA mixte, totaux corrects |

---

##  Livraison

1. **Lot 1**

   * Développement + commit
   * Livraison → `git tag 3A2-B1-lot1 && git push origin 3A2-B1-lot1`

2. **Lot 2**

   * Développement + commit
   * Livraison → `git tag 3A2-B1-lot2 && git push origin 3A2-B1-lot2`

---

##  Binôme

* **Camille Saquet**
* **Evan Roinet**

Groupe : **3A2 – Lannion 2025**


