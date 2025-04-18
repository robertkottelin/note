from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from extensions import db
from flask_jwt_extended import JWTManager
import datetime
import secrets

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///notepad.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enhanced JWT Configuration
jwt_secret = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = jwt_secret
app.config['JWT_COOKIE_SECURE'] = os.getenv('ENVIRONMENT', 'development') == 'production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=1)
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# Initialize extensions
db.init_app(app)

# Secure CORS configuration
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, 
     origins=allowed_origins, 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     max_age=86400)

# Import models and blueprints
from models.user import User, user_bp
from models.note import Note
from routes.notes import note_bp

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(note_bp, url_prefix='/api/notes')

@app.route('/api/health')
def health_check():
    try:
        db.session.execute('SELECT 1')
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

# Add security headers to all responses
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    
    return response

# Create database tables before first request
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Run the app
    debug_mode = os.getenv('ENVIRONMENT', 'development') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)