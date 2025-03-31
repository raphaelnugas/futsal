import os
import logging
from datetime import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging for easier debugging
logging.basicConfig(level=logging.DEBUG)

# Define the base model class
class Base(DeclarativeBase):
    pass

# Initialize SQLAlchemy with the base model
db = SQLAlchemy(model_class=Base)

# Create the Flask application
app = Flask(__name__)

# Set the secret key for session management
app.secret_key = os.environ.get("SESSION_SECRET", "futsal_domingo_default_key")

# Configure the SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///futsal_domingo.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with the Flask-SQLAlchemy extension
db.init_app(app)

# Create application context and database tables
with app.app_context():
    # Import models to ensure tables are created
    import models
    
    # Create database tables
    db.create_all()
    
    # Check if there's any data in the settings table and add default if not
    from models import Settings
    
    settings = Settings.query.first()
    if not settings:
        # Create default settings
        default_settings = Settings(
            match_duration=10,  # 10 minutes
            master_password="nautico2025",
            created_at=datetime.now()
        )
        db.session.add(default_settings)
        db.session.commit()
        app.logger.info("Default settings created")

# Import routes after models to avoid circular imports
from routes import *

if __name__ == "__main__":
    # Get port from environment variable or use 5000 as default
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
