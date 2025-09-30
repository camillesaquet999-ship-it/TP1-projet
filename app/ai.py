from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import Iterable, Tuple

from sqlalchemy import select

from .database import session_scope
from .models import Product


@dataclass
class CategoryTemplate:
    code_prefix: str
    vat_rate: float
    unit: str
    unit_quantity: float
    price_range: Tuple[float, float]
    origins: Tuple[str, ...]
    keywords: Tuple[str, ...]


CATEGORY_LIBRARY: Tuple[CategoryTemplate, ...] = (
    CategoryTemplate(
        code_prefix="FRU",
        vat_rate=0.055,
        unit="kg",
        unit_quantity=1.0,
        price_range=(1.5, 5.0),
        origins=("France", "Espagne", "Italie", "Maroc"),
        keywords=("pomme", "banane", "fraise", "orange", "fruit", "poire"),
    ),
    CategoryTemplate(
        code_prefix="VEG",
        vat_rate=0.055,
        unit="kg",
        unit_quantity=1.0,
        price_range=(1.0, 4.0),
        origins=("France", "Espagne", "Pays-Bas"),
        keywords=("carotte", "tomate", "salade", "legume", "courgette", "poivron"),
    ),
    CategoryTemplate(
        code_prefix="DRK",
        vat_rate=0.2,
        unit="L",
        unit_quantity=1.5,
        price_range=(0.8, 6.0),
        origins=("France", "Allemagne", "Belgique"),
        keywords=("cola", "boisson", "jus", "soda", "eau", "biere", "limonade"),
    ),
    CategoryTemplate(
        code_prefix="DRY",
        vat_rate=0.055,
        unit="pièce",
        unit_quantity=1.0,
        price_range=(0.5, 4.5),
        origins=("France", "Belgique", "Allemagne"),
        keywords=("biscuit", "pain", "cereale", "farine", "pate", "gateau"),
    ),
    CategoryTemplate(
        code_prefix="HOM",
        vat_rate=0.2,
        unit="pièce",
        unit_quantity=1.0,
        price_range=(2.0, 25.0),
        origins=("France", "Chine", "Portugal"),
        keywords=("shampoing", "savon", "lessive", "dentifrice", "nettoyant", "eponge"),
    ),
    CategoryTemplate(
        code_prefix="PET",
        vat_rate=0.2,
        unit="pièce",
        unit_quantity=1.0,
        price_range=(1.0, 40.0),
        origins=("France", "Allemagne", "Italie"),
        keywords=("croquette", "litiere", "jouet", "animal"),
    ),
)

DEFAULT_CATEGORY = CategoryTemplate(
    code_prefix="GEN",
    vat_rate=0.2,
    unit="pièce",
    unit_quantity=1.0,
    price_range=(1.0, 15.0),
    origins=("France", "Union Européenne"),
    keywords=(),
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _select_category(name: str) -> CategoryTemplate:
    normalized = _normalize(name)
    for template in CATEGORY_LIBRARY:
        if any(keyword in normalized for keyword in template.keywords):
            return template
    return DEFAULT_CATEGORY


def _deterministic_float(name: str, minimum: float, maximum: float) -> float:
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16) / 0xFFFFFFFF
    return round(minimum + (maximum - minimum) * value, 2)


def _deterministic_choice(name: str, options: Iterable[str]) -> str:
    options = tuple(options)
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    index = int(digest[:6], 16) % len(options)
    return options[index]


def _build_code(prefix: str, base_name: str) -> str:
    slug = re.sub(r"[^A-Z0-9]", "", _normalize(base_name).upper())
    slug = slug[:8] or "ITEM"
    return f"{prefix}-{slug}"


def ensure_product_exists(name: str) -> Product:
    normalized = _normalize(name)
    with session_scope() as session:
        product = session.execute(
            select(Product).where(Product.name.ilike(f"%{normalized}%"))
        ).scalar_one_or_none()

        if product:
            session.expunge(product)
            return product

        template = _select_category(name)
        price = _deterministic_float(name, *template.price_range)
        origin = _deterministic_choice(name, template.origins)
        code = _build_code(template.code_prefix, name)

        product = Product(
            code=code,
            name=name.strip().title(),
            price_ht=price,
            vat_rate=template.vat_rate,
            unit=template.unit,
            unit_quantity=template.unit_quantity,
            origin=origin,
            created_by_ai=True,
        )
        session.add(product)
        session.flush()
        session.refresh(product)
        session.expunge(product)
        return product


__all__ = ["ensure_product_exists"]
