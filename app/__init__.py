from flask import Flask

from .database import Base, engine
from .seed_data import seed_database


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///store.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Ensure tables exist and seed data if empty
    Base.metadata.create_all(bind=engine)
    seed_database()

    from .views import bp as store_bp

    app.register_blueprint(store_bp)

    return app


__all__ = ["create_app"]
