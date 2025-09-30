from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, relationship

from .database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = Column(Integer, primary_key=True)
    code: Mapped[str] = Column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = Column(String(120), nullable=False)
    price_ht: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[float] = Column(Float, nullable=False, default=0.2)
    unit: Mapped[str] = Column(String(20), nullable=False, default="pièce")
    unit_quantity: Mapped[float] = Column(Float, nullable=False, default=1.0)
    origin: Mapped[str] = Column(String(80), nullable=False, default="France")
    created_by_ai: Mapped[bool] = Column(Boolean, nullable=False, default=False)

    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")

    def price_ttc(self) -> float:
        return float(self.price_ht) * (1 + self.vat_rate)


class Cashier(Base):
    __tablename__ = "cashiers"

    id: Mapped[int] = Column(Integer, primary_key=True)
    first_name: Mapped[str] = Column(String(80), nullable=False)
    last_name: Mapped[str] = Column(String(80), nullable=False)

    orders: Mapped[List["Order"]] = relationship("Order", back_populates="cashier")

    @property
    def display_name(self) -> str:
        return f"{self.first_name} {self.last_name.upper()}"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = Column(Integer, primary_key=True)
    customer_name: Mapped[str] = Column(String(120), nullable=False)
    created_at: Mapped[datetime] = Column(DateTime, nullable=False, default=datetime.utcnow)
    cashier_id: Mapped[int] = Column(Integer, ForeignKey("cashiers.id"), nullable=False)

    cashier: Mapped[Cashier] = relationship("Cashier", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )

    def total_ht(self) -> float:
        return sum(item.total_ht for item in self.items)

    def total_tva(self) -> float:
        return sum(item.total_tva for item in self.items)

    def total_ttc(self) -> float:
        return sum(item.total_ttc for item in self.items)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = Column(Integer, primary_key=True)
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[float] = Column(Float, nullable=False)
    unit_price_ht: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[float] = Column(Float, nullable=False)

    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Product] = relationship("Product", back_populates="order_items")

    @property
    def total_ht(self) -> float:
        return float(self.unit_price_ht) * self.quantity

    @property
    def total_tva(self) -> float:
        return self.total_ht * self.vat_rate

    @property
    def total_ttc(self) -> float:
        return self.total_ht * (1 + self.vat_rate)
