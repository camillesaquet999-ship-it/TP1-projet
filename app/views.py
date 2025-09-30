from __future__ import annotations

from decimal import Decimal

from flask import Blueprint, jsonify, redirect, render_template, request, url_for
from sqlalchemy import select

from .ai import ensure_product_exists
from .database import session_scope
from .models import Cashier, Order, OrderItem, Product
from .receipts import render_receipt

bp = Blueprint("store", __name__)


@bp.route("/")
def index() -> str:
    with session_scope() as session:
        products = session.execute(select(Product).order_by(Product.name)).scalars().all()
        cashiers = session.execute(select(Cashier).order_by(Cashier.first_name)).scalars().all()
    return render_template("index.html", products=products, cashiers=cashiers)


@bp.post("/api/lookup")
def lookup_product():
    payload = request.get_json(silent=True) or {}
    query = (payload.get("query") or "").strip()
    if not query:
        return jsonify({"error": "Veuillez saisir un nom ou un code produit."}), 400

    with session_scope() as session:
        product = session.execute(
            select(Product).where(
                (Product.code.ilike(query)) | (Product.name.ilike(f"%{query}%"))
            )
        ).scalar_one_or_none()

    if product is None:
        product = ensure_product_exists(query)
        created = True
    else:
        created = False

    return jsonify(
        {
            "created": created,
            "product": {
                "id": product.id,
                "code": product.code,
                "name": product.name,
                "price_ht": float(product.price_ht),
                "vat_rate": product.vat_rate,
                "unit": product.unit,
                "unit_quantity": product.unit_quantity,
                "origin": product.origin,
            },
        }
    )


@bp.post("/checkout")
def checkout():
    payload = request.get_json(force=True)
    customer = (payload.get("customer") or "Client anonyme").strip() or "Client anonyme"
    cashier_id = payload.get("cashierId")
    items = payload.get("items") or []

    if not items:
        return jsonify({"error": "Votre panier est vide."}), 400

    with session_scope() as session:
        cashier = session.get(Cashier, cashier_id)
        if not cashier:
            return jsonify({"error": "Caissier inconnu."}), 400

        order = Order(customer_name=customer, cashier_id=cashier.id)
        session.add(order)
        session.flush()

        for entry in items:
            product_id = entry.get("productId")
            quantity = float(entry.get("quantity", 1))
            if quantity <= 0:
                continue

            product = session.get(Product, product_id)
            if not product:
                name = entry.get("name")
                if not name:
                    continue
                generated = ensure_product_exists(name)
                product = session.get(Product, generated.id)
                if not product:
                    continue

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price_ht=Decimal(str(product.price_ht)),
                vat_rate=product.vat_rate,
            )
            session.add(order_item)

        session.flush()
        order_id = order.id

    return jsonify({"orderId": order_id, "redirect": url_for("store.receipt", order_id=order_id)})


@bp.get("/receipt/<int:order_id>")
def receipt(order_id: int):
    with session_scope() as session:
        order = session.get(Order, order_id)
        if not order:
            return redirect(url_for("store.index"))
        cashier = order.cashier
        order_items = list(order.items)
        for item in order_items:
            item.product  # charge les produits liés
        for item in order_items:
            session.expunge(item.product)
            session.expunge(item)
        session.expunge(cashier)
        session.expunge(order)
        order.cashier = cashier
        order.items = order_items
    receipt_text = render_receipt(order)
    return render_template("receipt.html", order=order, receipt_text=receipt_text)


@bp.get("/api/products")
def list_products():
    with session_scope() as session:
        products = session.execute(select(Product).order_by(Product.name)).scalars().all()
    return jsonify(
        [
            {
                "id": product.id,
                "code": product.code,
                "name": product.name,
                "price_ht": float(product.price_ht),
                "vat_rate": product.vat_rate,
                "unit": product.unit,
                "unit_quantity": product.unit_quantity,
                "origin": product.origin,
            }
            for product in products
        ]
    )
