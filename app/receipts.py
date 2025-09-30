from __future__ import annotations

from datetime import datetime

from .models import Order


def render_receipt(order: Order) -> str:
    header = [
        "========================================",
        "           But Market 360°",
        f"Caissier : {order.cashier.display_name:<18}{order.created_at.strftime('%d/%m/%Y %H:%M')}",
        f"Client   : {order.customer_name}",
        "----------------------------------------",
        "Article                Qté  PU HT  Total",
        "----------------------------------------",
    ]

    lines = []
    for item in order.items:
        product = item.product
        name = product.name[:20].ljust(20)
        qty = f"{item.quantity:>4.2f}" if item.quantity % 1 else f"{int(item.quantity):>4}"
        pu = f"{float(item.unit_price_ht):>6.2f}"
        total = f"{item.total_ht:>6.2f}"
        lines.append(f"{name}{qty} {pu} {total}")

    footer = [
        "----------------------------------------",
        f"Total HT{'':>23}{order.total_ht():>7.2f} €",
        f"TVA{'':>27}{order.total_tva():>7.2f} €",
        f"Total TTC{'':>21}{order.total_ttc():>7.2f} €",
        "========================================",
        "   Merci de votre visite et à bientôt !",
        "========================================",
    ]

    return "\n".join(header + lines + footer)


__all__ = ["render_receipt"]
