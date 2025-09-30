from __future__ import annotations

from typing import Sequence

from sqlalchemy import func, select

from .database import session_scope
from .models import Cashier, Product


CATALOG: Sequence[dict[str, object]] = (
    {"code": "C01", "name": "Coca Cola 1L", "price_ht": 1.5, "vat_rate": 0.2, "unit": "L", "unit_quantity": 1.0, "origin": "France"},
    {"code": "C02", "name": "Biscottes dorées", "price_ht": 2.1, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 1.0, "origin": "France"},
    {"code": "C03", "name": "Crackers salés", "price_ht": 1.6, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 1.0, "origin": "Belgique"},
    {"code": "F01", "name": "Pommes bio", "price_ht": 3.2, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "France"},
    {"code": "F02", "name": "Bananes cavendish", "price_ht": 2.2, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "Guadeloupe"},
    {"code": "F03", "name": "Orange sanguine", "price_ht": 2.9, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "Espagne"},
    {"code": "L01", "name": "Lait demi-écrémé", "price_ht": 0.95, "vat_rate": 0.055, "unit": "L", "unit_quantity": 1.0, "origin": "France"},
    {"code": "L02", "name": "Yaourt grec nature", "price_ht": 1.8, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 4.0, "origin": "Grèce"},
    {"code": "L03", "name": "Beurre doux", "price_ht": 1.5, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 0.25, "origin": "France"},
    {"code": "M01", "name": "Poulet fermier", "price_ht": 6.5, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "France"},
    {"code": "M02", "name": "Steak haché 5%", "price_ht": 8.2, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "France"},
    {"code": "M03", "name": "Jambon blanc", "price_ht": 3.9, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 0.2, "origin": "France"},
    {"code": "S01", "name": "Saumon fumé", "price_ht": 12.5, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 0.3, "origin": "Norvège"},
    {"code": "S02", "name": "Cabillaud frais", "price_ht": 10.0, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "Islande"},
    {"code": "S03", "name": "Crevettes roses", "price_ht": 9.8, "vat_rate": 0.055, "unit": "kg", "unit_quantity": 1.0, "origin": "Madagascar"},
    {"code": "G01", "name": "Pâtes linguine", "price_ht": 1.1, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 0.5, "origin": "Italie"},
    {"code": "G02", "name": "Riz basmati", "price_ht": 2.4, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 1.0, "origin": "Inde"},
    {"code": "G03", "name": "Farine de blé T55", "price_ht": 0.9, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 1.0, "origin": "France"},
    {"code": "B01", "name": "Bière artisanale", "price_ht": 3.5, "vat_rate": 0.2, "unit": "L", "unit_quantity": 0.75, "origin": "Belgique"},
    {"code": "B02", "name": "Jus d'orange pressé", "price_ht": 2.8, "vat_rate": 0.055, "unit": "L", "unit_quantity": 1.0, "origin": "Espagne"},
    {"code": "B03", "name": "Thé glacé pêche", "price_ht": 1.7, "vat_rate": 0.2, "unit": "L", "unit_quantity": 1.5, "origin": "France"},
    {"code": "H01", "name": "Shampoing doux", "price_ht": 4.2, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 0.25, "origin": "France"},
    {"code": "H02", "name": "Gel douche marine", "price_ht": 2.9, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 0.25, "origin": "France"},
    {"code": "H03", "name": "Lessive concentrée", "price_ht": 7.5, "vat_rate": 0.2, "unit": "L", "unit_quantity": 2.0, "origin": "France"},
    {"code": "H04", "name": "Nettoyant multi-usages", "price_ht": 2.4, "vat_rate": 0.2, "unit": "L", "unit_quantity": 1.0, "origin": "France"},
    {"code": "H05", "name": "Dentifrice menthol", "price_ht": 3.1, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 0.075, "origin": "France"},
    {"code": "SN1", "name": "Chips paprika", "price_ht": 1.4, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 0.2, "origin": "Pays-Bas"},
    {"code": "SN2", "name": "Barre chocolat noisette", "price_ht": 0.95, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 0.05, "origin": "France"},
    {"code": "SN3", "name": "Mélange fruits secs", "price_ht": 3.8, "vat_rate": 0.055, "unit": "pièce", "unit_quantity": 0.25, "origin": "Turquie"},
    {"code": "P01", "name": "Croquettes chat adulte", "price_ht": 12.0, "vat_rate": 0.2, "unit": "kg", "unit_quantity": 3.0, "origin": "France"},
    {"code": "P02", "name": "Litière minérale", "price_ht": 5.5, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 6.0, "origin": "France"},
    {"code": "P03", "name": "Friandises chien", "price_ht": 3.2, "vat_rate": 0.2, "unit": "pièce", "unit_quantity": 0.3, "origin": "Allemagne"},
)

CASHIERS: Sequence[dict[str, str]] = (
    {"first_name": "Lisa", "last_name": "Martin"},
    {"first_name": "Nabil", "last_name": "Cissé"},
    {"first_name": "Ana", "last_name": "Gomez"},
)


def seed_database() -> None:
    with session_scope() as session:
        product_count = session.execute(select(func.count()).select_from(Product)).scalar_one()
        if product_count == 0:
            session.bulk_insert_mappings(Product, CATALOG)

        cashier_count = session.execute(select(func.count()).select_from(Cashier)).scalar_one()
        if cashier_count == 0:
            session.bulk_insert_mappings(Cashier, CASHIERS)


__all__ = ["seed_database"]
