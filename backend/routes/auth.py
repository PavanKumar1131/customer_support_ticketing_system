from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            
            if not all([name, email, password]):
                flash('All fields are required!', 'error')
                return redirect(url_for('auth.signup'))
            
            if User.query.filter_by(email=email).first():
                flash('Email already exists!', 'error')
                return redirect(url_for('auth.signup'))
            
            user = User(name=name, email=email)
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()
            
            flash('Account created successfully! Please login.', 'success')
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            db.session.rollback()
            flash('Error creating account. Please try again.', 'error')
    
    return render_template('signup.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            email = request.form.get('email')
            password = request.form.get('password')
            
            user = User.query.filter_by(email=email).first()
            
            if user and user.check_password(password):
                login_user(user)
                flash('Login successful!', 'success')
                
                if user.is_admin:
                    return redirect(url_for('admin.dashboard'))
                else:
                    return redirect(url_for('user.dashboard'))
            else:
                flash('Invalid email or password!', 'error')
                
        except Exception as e:
            flash('Login error. Please try again.', 'error')
    
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        try:
            current_user.name = request.form.get('name')
            db.session.commit()
            flash('Profile updated successfully!', 'success')
        except Exception as e:
            db.session.rollback()
            flash('Error updating profile.', 'error')
    
    return render_template('profile.html')

@auth_bp.route('/api/users')
@login_required
def api_users():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.all()
    users_data = [{
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': 'Admin' if user.is_admin else 'User',
        'tickets_count': len(user.tickets),
        'created_at': user.created_at.strftime('%Y-%m-%d')
    } for user in users]
    
    return jsonify(users_data)