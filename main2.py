#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TP Python - Ticket de caisse (Lot 2)
------------------------------------
Affiche un ticket réaliste avec :
- TVA variable par produit
- Poids/volume unitaire et total
- Origine
"""

import sys
from datetime import datetime

# --- Base de données des produits ---
PRODUITS = {
    "C01": {"nom": "pack de coca", "poids": "2kg", "prix_ht": 5.0, "tva": 0.20, "origine": "Lituanie"},
    "C02": {"nom": "kilo de pdt", "poids": "1kg", "prix_ht": 1.0, "tva": 0.10, "origine": "Espagne"},
    "C03": {"nom": "pack Biscotte", "poids": "950g", "prix_ht": 2.0, "tva": 0.10, "origine": "France"},
    "C04": {"nom": "Café soluble", "poids": "250g", "prix_ht": 3.0, "tva": 0.10, "origine": "Roumanie"},
    "C05": {"nom": "Crakers", "poids": "125g", "prix_ht": 4.0, "tva": 0.20, "origine": "Angleterre"},
    "C06": {"nom": "Eau", "poids": "1,5L", "prix_ht": 6.0, "tva": 0.10, "origine": "Suisse"},
    "C07": {"nom": "Pain", "poids": "250g", "prix_ht": 1.0, "tva": 0.10, "origine": "France"},
}


def generer_ticket(magasin: str, vendeur: str, items: str, numero: int = 2200) -> str:
    """
    Génère un ticket de caisse réaliste avec TVA variable et poids total.
    """
    lignes = []
    total_ht = 0
    total_tva = 0

    # --- En-tête ---
    lignes.append(f"{magasin}")
    lignes.append(f"Ticket numéro : {numero}")
    lignes.append(f"Date : {datetime.now().strftime('%d/%m/%Y')}")
    lignes.append("")
    lignes.append(f"Vous avez été servi par : {vendeur}")
    lignes.append("")

    # --- Colonnes ---
    lignes.append(f"{'NB':<3} {'Desc.':<15} {'Pds/vol. unit.':<12} {'Pds/vol. total':<14} {'Orig.':<12} {'HT':>5} {'TVA':>6} {'Total':>8}")
    
    # --- Produits ---
    for item in items.split("|"):
        try:
            code, quantite = item.split(":")
            quantite = int(quantite)
        except ValueError:
            continue

        produit = PRODUITS.get(code)
        if produit:
            pu = produit["prix_ht"]
            taux_tva = produit["tva"]
            montant_ht = pu * quantite
            montant_tva = montant_ht * taux_tva
            montant_ttc = montant_ht + montant_tva

            total_ht += montant_ht
            total_tva += montant_tva

            # Poids total (si numérique dans "kg"/"g"/"L")
            poids_unit = produit["poids"]
            poids_total = calculer_poids_total(poids_unit, quantite)

            lignes.append(f"{quantite:<3} {produit['nom']:<15} {poids_unit:<12} {poids_total:<14} {produit['origine']:<12} {pu:>4.0f}€ {int(taux_tva*100):>2}% {montant_ttc:>7.1f}€")

    # --- Totaux ---
    total_ttc = total_ht + total_tva
    lignes.append("")
    lignes.append(f"{'Total HT':<20}{total_ht:.1f}€")
    lignes.append(f"{'Total TVA':<20}{total_tva:.1f}€")
    lignes.append(f"{'Total TTC':<20}{total_ttc:.1f}€")

    return "\n".join(lignes)


def calculer_poids_total(poids_unit: str, quantite: int) -> str:
    """
    Calcule le poids/volume total en fonction du poids unitaire et de la quantité.
    Ex: "1kg" x 3 = "3kg"
    """
    try:
        # Séparer valeur et unité (ex: "2kg", "250g", "1,5L")
        valeur = poids_unit[:-2].replace(",", ".")  # enlever unité
        unite = poids_unit[-2:]
        total = float(valeur) * quantite
        # remettre au bon format
        if unite == "kg":
            return f"{int(total)}kg" if total.is_integer() else f"{total:.1f}kg"
        elif unite == "g":
            return f"{int(total)}g" if total.is_integer() else f"{total:.1f}g"
        elif unite == "L":
            return f"{total:.1f}L"
    except Exception:
        return poids_unit  # fallback si non calculable

    return poids_unit


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 main.py <Magasin> <Vendeur> <Items ex: C01:2|C02:1>")
        sys.exit(1)

    magasin = sys.argv[1]
    vendeur = sys.argv[2]
    items = sys.argv[3]

    ticket = generer_ticket(magasin, vendeur, items)
    print(ticket)

