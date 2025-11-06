import os
import sys
from flask import Flask
from config import Config
from database import db, bcrypt
from models import User

def check_dependencies():
    """Check if all required packages are installed"""
    try:
        import pymysql
        import flask
        import flask_sqlalchemy
        import flask_login
        import flask_bcrypt
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install flask flask-sqlalchemy flask-login flask-bcrypt flask-cors python-dotenv pymysql cryptography")
        return False

def setup_database():
    """Setup database and create admin user"""
    if not check_dependencies():
        return False
    
    # Create Flask app
    app = Flask(__name__)
    app.config.from_object(Config)
    
    with app.app_context():
        try:
            # Initialize database
            from database import init_db
            init_db(app)
            print("✅ Database tables created successfully!")
            
            # Create admin user
            print("🔧 Creating admin user...")
            
            admin = User.query.filter_by(email='admin@flipkart.com').first()
            
            if admin:
                print("✅ Admin user already exists:")
                print(f"   Email: {admin.email}")
                print(f"   Password: admin123")
            else:
                # Create new admin user
                admin = User(
                    name='System Administrator',
                    email='admin@flipkart.com',
                    is_admin=True,
                    role='admin'
                )
                admin.set_password('admin123')
                
                db.session.add(admin)
                db.session.commit()
                print("✅ Admin user created successfully!")
                print(f"   Email: admin@flipkart.com")
                print(f"   Password: admin123")
                print("   Role: Admin")
            
            # Create test user
            test_user = User.query.filter_by(email='user@example.com').first()
            if not test_user:
                test_user = User(
                    name='Test User',
                    email='user@example.com'
                )
                test_user.set_password('user123')
                db.session.add(test_user)
                db.session.commit()
                print("✅ Test user created:")
                print(f"   Email: user@example.com")
                print(f"   Password: user123")
                print("   Role: User")
            
            print("\n🎉 Setup completed successfully!")
            print("You can now run: python app.py")
            return True
            
        except Exception as e:
            print(f"❌ Error during setup: {e}")
            print("\nTroubleshooting tips:")
            print("1. Check if MySQL service is running")
            print("2. Verify MySQL password in .env file")
            print("3. Ensure database 'flipkart_support' exists")
            return False

if __name__ == '__main__':
    print("🚀 Customer Support System Setup")
    print("=" * 50)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("❌ .env file not found!")
        print("Creating .env file with template...")
        
        with open('.env', 'w') as f:
            f.write("""# Database Configuration
DB_TYPE=mysql
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_HOST=localhost
DB_PORT=3306
DB_NAME=flipkart_support

# Application Secret
SECRET_KEY=supersecretkey123
""")
        print("✅ .env file created.")
        print("⚠️  Please edit .env and set your actual MySQL password!")
        sys.exit(1)
    
    # Run setup
    if setup_database():
        print("\n✅ All done! You can now start the application.")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)