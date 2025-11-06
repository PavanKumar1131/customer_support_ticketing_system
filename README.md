# Customer Support Ticketing System
A full-stack web application designed to simplify customer support and issue tracking between users and administrators. It features secure authentication, role-based dashboards, and an intuitive interface for handling customer issues efficiently.

## 📖 Overview
The **Customer Support Ticketing System** enables users to raise tickets for their queries or issues and allows administrators to manage, prioritize, and resolve them effectively. The project is built using Flask (Python) as the backend framework with PostgreSQL as the database and a clean Bootstrap-based frontend for responsiveness.-

## 🚀 Features
### 👨‍💻 User Features
- User registration and login using email and password.
- Create new support tickets with details like category, description, and priority.
- View ticket status (Pending, In Progress, Resolved).
- Intuitive and responsive interface built using Bootstrap.

### 🧑‍🏫 Admin Features
- Separate admin dashboard for managing all user tickets.
- View, update, or close user tickets.
- Only admin can update and delete the tickets.
- Prioritize tickets based on urgency or priority level.
- Manage overall ticket workflow.
- Secure admin login credentials.

## 🧰 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | HTML, CSS3, JavaScript, Bootstrap |
| **Backend** | Python (Flask Framework) |
| **Database** | MySQL (Database Name: flipkart_support) |
| **Version Control** | Git & GitHub |
| **Environment Management** | python-dotenv |
| **ORM & Migrations** | SQLAlchemy + Flask-Migrate |

## ⚙️ Installation & Setup
Follow the steps below to set up the project on your local machine.

### 1. Clone the Repository
git clone https://github.com/Pavankumar1131/customer_support_ticketing_system.git
cd Customer_Support_Ticketing_System

### 2. Create and Activate a Virtual Environment
# Windows
python -m venv venv
venv\Scripts\activate
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

### 3. Install Dependencies
Install all required packages using:pip install -r requirements.txt

## 🗄️ Database Configuration
1.Create a MySQL database named:flipkart_support

2.Configure your .env file in the backend directory:
DATABASE_URL=mysql+pymysql://root:Pavan7013@localhost:3306/support_tickets'
FLASK_ENV=development
SECRET_KEY=your_secret_key

3.Apply database migrations:
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

## 🔑 Login Credentials
### 👑 Admin Login
Email: admin@flipkart.com
Password: admin123
### 🙍‍♂️ User Login
Users can register from the signup page or use existing credentials defined in the database.
Email: user@example.com
Password:  user123

##  Run the Application
Once everything is set up, start the Flask app:python app.py
Then open your browser and go to:
http://127.0.0.1:5000/

## 📂 Project Structure
Customer-Support-Ticketing-System/
│
├── backend/
│ ├── pycache/
│ ├── instance/
│ ├── routes/
│ │ ├── pycache/
│ │ ├── init.py
│ │ ├── admin.py # Admin dashboard and user management routes
│ │ ├── auth.py # User authentication and registration routes
│ │ ├── tickets.py # Ticket creation, viewing, and update logic
│ │ └── init.py
│ ├── app.py # Main Flask application entry point
│ ├── config.py # Configuration file (database, secret key, etc.)
│ ├── create_admin.py # Script to create an admin user
│ ├── models.py # SQLAlchemy models (User, Ticket, etc.)
│ ├── create_templates.py 
│ ├── database.py
│ ├── static/
│ │ ├── CSS/
│ │ │ ├── admin_dashboard.css
│ │ │ ├── adminusers.css
│ │ │ ├── home.css
│ │ │ ├── login.css
│ │ │ ├── signup.css
│ │ │ ├── style.css
│ │ │ ├── theme.css
│ │ │ └── userdashboard.css
│ │ ├── javascript/
│ │   ├── admin_dashboard.js # Handles dashboard interactivity and analytics
│ │   ├──main.js
│ │   └──user_dashboard.js
│ ├── templates/
│ │  ├── admin_dashboard.html
│ │  ├── base.html
│ │  ├── home.html
│ │  ├── login.html
│ │  ├── signup.html
│ │  ├── dashboard.html
│ │  ├── create_ticket.html
│ │  ├── user_dashboard.html
│ │  └──.env # environmental setup
│ └── database/
│     └── schema_mySql.sql
├── venv/ # Virtual environment (not committed to Git)
├── requirements.txt # Project dependencies
└── README.md

## 💡 Key Functionalities
Ticket creation, updating, and deletion.
Role-based access control (Admin & User).
Ticket priority management.
Secure password hashing with Flask-Bcrypt.
MySQL database integration.
Migration support with Flask-Migrate.
CORS support for cross-origin requests.
Clean, responsive Bootstrap UI.

## 👨‍💻 Author
Pokala PavanKumar
📧 pokalakumar113@gmail.com
🌐 GitHub Profile:https://github.com/Pavankumar1131

🪪 License
This project is licensed under the MIT License.
You are free to use, modify, and distribute it with attribution.
