from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import csv
import io
from datetime import datetime, timedelta
from flask import Response
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MySQL Database configuration - UPDATE WITH YOUR CREDENTIALS
app.config['SECRET_KEY'] = 'supersecretkey123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Pavan7013@localhost:3306/support_tickets'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Initialize Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tickets = db.relationship('Ticket', backref='user', lazy=True)

class Ticket(db.Model):
    __tablename__ = 'ticket'
    
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='Open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# User loader
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Configure upload settings
UPLOAD_FOLDER = 'static/uploads/tickets'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'log'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ===== ALL ROUTES =====

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        print(f"=== LOGIN ATTEMPT ===")
        print(f"Email: '{email}'")
        
        # Simple hardcoded test (temporary)
        if email == 'admin@flipkart.com' and password == 'admin123':
            # Find or create admin user
            user = User.query.filter_by(email='admin@flipkart.com').first()
            if not user:
                user = User(
                    email='admin@flipkart.com',
                    password=generate_password_hash('admin123'),
                    name='Admin User',
                    is_admin=True
                )
                db.session.add(user)
                db.session.commit()
            
            login_user(user)
            flash('Login successful!', 'success')
            return redirect(url_for('admin_dashboard'))
        
        else:
            # Try database lookup
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password, password):
                login_user(user)
                flash('Login successful!', 'success')
                if user.is_admin:
                    return redirect(url_for('admin_dashboard'))
                else:
                    return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password', 'error')
    
    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        name = request.form.get('name')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('signup.html')
        
        user = User(
            email=email,
            password=generate_password_hash(password),
            name=name,
            is_admin=False
        )
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('signup.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    tickets = current_user.tickets
    return render_template('dashboard.html', tickets=tickets)

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    tickets = Ticket.query.all()
    return render_template('admin_dashboard.html', tickets=tickets)

@app.route('/create_ticket', methods=['GET', 'POST'])
@login_required
def create_ticket():
    if request.method == 'POST':
        subject = request.form.get('subject')
        description = request.form.get('description')
        priority = request.form.get('priority')
        category = request.form.get('category')
        
        ticket = Ticket(
            subject=subject,
            description=description,
            priority=priority,
            category=category,
            user_id=current_user.id
        )
        db.session.add(ticket)
        db.session.commit()
        flash('Ticket created successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('create_ticket.html')

@app.route('/create-test-users')
def create_test_users():
    # Create admin user
    admin = User.query.filter_by(email='admin@flipkart.com').first()
    if not admin:
        admin = User(
            email='admin@flipkart.com',
            password=generate_password_hash('admin123'),
            name='Admin User',
            is_admin=True
        )
        db.session.add(admin)
    
    # Create regular user
    user = User.query.filter_by(email='user@flipkart.com').first()
    if not user:
        user = User(
            email='user@flipkart.com',
            password=generate_password_hash('user123'),
            name='Regular User',
            is_admin=False
        )
        db.session.add(user)
    
    db.session.commit()
    return "Test users created!<br>Admin: admin@flipkart.com / admin123<br>User: user@example.com / user123"
    
@app.route('/test-admin')
def test_admin():
    """Test if we can create and login as admin"""
    try:
        # Check if admin exists
        admin = User.query.filter_by(email='admin@flipkart.com').first()
        if not admin:
            admin = User(
                email='admin@flipkart.com',
                password=generate_password_hash('admin123'),
                name='Admin User',
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            return "Admin user created! Try logging in with admin@flipkart.com / admin123"
        else:
            return f"Admin user exists: {admin.email} (ID: {admin.id}, Admin: {admin.is_admin})"
    except Exception as e:
        return f"Error: {e}"

@app.route('/test-login')
def test_login():
    """Test login functionality"""
    return '''
    <h1>Test Login</h1>
    <form action="/login" method="POST">
        <input type="email" name="email" value="admin@flipkart.com"><br>
        <input type="password" name="password" value="admin123"><br>
        <button type="submit">Test Login</button>
    </form>
    '''

@app.route('/debug/users')
def debug_users():
    users = User.query.all()
    result = "<h1>Users in Database</h1>"
    for user in users:
        result += f"""
        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <strong>ID:</strong> {user.id}<br>
            <strong>Email:</strong> {user.email}<br>
            <strong>Name:</strong> {user.name}<br>
            <strong>Admin:</strong> {user.is_admin}<br>
            <strong>Password Hash:</strong> {user.password}<br>
        </div>
        """
    return result

@app.route('/debug-db')
def debug_database():
    users = User.query.all()
    tickets = Ticket.query.all()
    
    result = "<h1>Database Debug</h1>"
    result += f"<p>Users: {len(users)}, Tickets: {len(tickets)}</p>"
    
    for user in users:
        result += f"<p>User: {user.email} (Admin: {user.is_admin})</p>"
    
    return result


@app.route('/debug-form', methods=['GET', 'POST'])
def debug_form():
    if request.method == 'POST':
        # Print all form data
        print("=== FORM DATA RECEIVED ===")
        for key, value in request.form.items():
            print(f"{key}: '{value}'")
        print("==========================")
        
        return f"""
        Form data received:<br>
        <pre>{dict(request.form)}</pre>
        <a href="/debug-form">Back</a>
        """
    
    return '''
    <form method="POST">
        <input type="text" name="subject" placeholder="Subject"><br>
        <textarea name="description" placeholder="Description"></textarea><br>
        <select name="priority">
            <option value="">Select Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
        </select><br>
        <select name="category">
            <option value="">Select Category</option>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
        </select><br>
        <button type="submit">Test Submit</button>
    </form>
    '''
# API Routes for Admin Dashboard

@app.route('/api/admin/tickets')
@login_required
def get_admin_tickets():
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    
    try:
        # Get all tickets with user information
        tickets = Ticket.query.options(db.joinedload(Ticket.user)).all()
        
        # Prepare tickets data
        tickets_data = []
        for ticket in tickets:
            tickets_data.append({
                'id': ticket.id,
                'subject': ticket.subject,
                'description': ticket.description,
                'priority': ticket.priority,
                'category': ticket.category,
                'status': ticket.status,
                'created_at': ticket.created_at.isoformat(),
                'user_name': ticket.user.name if ticket.user else 'N/A',
                'user_email': ticket.user.email if ticket.user else 'N/A'
            })
        
        # Calculate statistics
        total_tickets = len(tickets)
        open_tickets = len([t for t in tickets if t.status == 'Open'])
        resolved_today = len([t for t in tickets if t.status == 'Resolved' and t.created_at.date() == datetime.utcnow().date()])
        active_users = len(set([t.user_id for t in tickets if t.user_id]))
        
        # Status counts
        status_counts = {}
        for ticket in tickets:
            status_counts[ticket.status] = status_counts.get(ticket.status, 0) + 1
        
        # Priority counts
        priority_counts = {}
        for ticket in tickets:
            priority_counts[ticket.priority] = priority_counts.get(ticket.priority, 0) + 1
        
        return jsonify({
            'success': True,
            'tickets': tickets_data,
            'stats': {
                'totalTickets': total_tickets,
                'openTickets': open_tickets,
                'resolvedToday': resolved_today,
                'activeUsers': active_users,
                'statusCounts': status_counts,
                'priorityCounts': priority_counts
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/export', methods=['POST'])
@login_required
def export_data():
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        export_format = data.get('format', 'csv')
        date_range = data.get('dateRange', '')
        include_users = data.get('includeUsers', False)
        include_analytics = data.get('includeAnalytics', False)
        
        # Get tickets based on filters
        tickets_query = Ticket.query.options(db.joinedload(Ticket.user))
        
        # Apply date range filter if provided
        if date_range:
            dates = date_range.split(' to ')
            if len(dates) == 2:
                start_date = datetime.strptime(dates[0], '%Y-%m-%d')
                end_date = datetime.strptime(dates[1], '%Y-%m-%d') + timedelta(days=1)
                tickets_query = tickets_query.filter(Ticket.created_at.between(start_date, end_date))
        
        tickets = tickets_query.all()
        
        if export_format == 'csv':
            return export_csv(tickets, include_users)
        elif export_format == 'excel':
            return export_excel(tickets, include_users)
        elif export_format == 'json':
            return export_json(tickets, include_users, include_analytics)
        elif export_format == 'pdf':
            return export_pdf(tickets, include_users)
        else:
            return jsonify({'success': False, 'error': 'Unsupported format'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def export_csv(tickets, include_users):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    headers = ['ID', 'Subject', 'Description', 'Priority', 'Category', 'Status', 'Created At']
    if include_users:
        headers.extend(['User Name', 'User Email'])
    writer.writerow(headers)
    
    # Write data
    for ticket in tickets:
        row = [
            ticket.id,
            ticket.subject,
            ticket.description,
            ticket.priority,
            ticket.category,
            ticket.status,
            ticket.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ]
        if include_users:
            row.extend([
                ticket.user.name if ticket.user else 'N/A',
                ticket.user.email if ticket.user else 'N/A'
            ])
        writer.writerow(row)
    
    output.seek(0)
    
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment;filename=support-tickets-{datetime.utcnow().strftime('%Y-%m-%d')}.csv"
        }
    )

def export_excel(tickets, include_users):
    # For Excel export, you would need to install openpyxl or xlsxwriter
    # This is a simplified version that returns CSV as Excel
    return export_csv(tickets, include_users)

def export_json(tickets, include_users, include_analytics):
    data = {
        'export_date': datetime.utcnow().isoformat(),
        'total_tickets': len(tickets),
        'tickets': []
    }
    
    if include_analytics:
        # Add analytics data
        status_counts = {}
        priority_counts = {}
        for ticket in tickets:
            status_counts[ticket.status] = status_counts.get(ticket.status, 0) + 1
            priority_counts[ticket.priority] = priority_counts.get(ticket.priority, 0) + 1
        
        data['analytics'] = {
            'status_distribution': status_counts,
            'priority_distribution': priority_counts
        }
    
    for ticket in tickets:
        ticket_data = {
            'id': ticket.id,
            'subject': ticket.subject,
            'description': ticket.description,
            'priority': ticket.priority,
            'category': ticket.category,
            'status': ticket.status,
            'created_at': ticket.created_at.isoformat()
        }
        
        if include_users and ticket.user:
            ticket_data['user'] = {
                'name': ticket.user.name,
                'email': ticket.user.email
            }
        
        data['tickets'].append(ticket_data)
    
    return Response(
        json.dumps(data, indent=2),
        mimetype="application/json",
        headers={
            "Content-Disposition": f"attachment;filename=support-tickets-{datetime.utcnow().strftime('%Y-%m-%d')}.json"
        }
    )

def export_pdf(tickets, include_users):
    # For PDF export, you would need to install a PDF library like ReportLab
    # This is a simplified version that returns JSON
    return export_json(tickets, include_users, False)

@app.route('/api/tickets/<int:ticket_id>/status', methods=['PUT'])
@login_required
def update_ticket_status(ticket_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        ticket = Ticket.query.get_or_404(ticket_id)
        ticket.status = new_status
        ticket.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Ticket status updated to {new_status}'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/admin/stats')
@login_required
def admin_stats():
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        total_tickets = Ticket.query.count()
        open_tickets = Ticket.query.filter_by(status='Open').count()
        in_progress_tickets = Ticket.query.filter_by(status='In Progress').count()
        resolved_tickets = Ticket.query.filter_by(status='Resolved').count()
        
        return jsonify({
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'in_progress_tickets': in_progress_tickets,
            'resolved_tickets': resolved_tickets
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/routes')
def show_routes():
    output = []
    for rule in app.url_map.iter_rules():
        methods = ','.join(rule.methods)
        output.append(f"{rule.endpoint:50} {methods:20} {rule}")
    return '<pre>' + '\n'.join(sorted(output)) + '</pre>'

# Initialize database
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)