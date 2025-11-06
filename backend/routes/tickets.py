from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from database import db
from models import Ticket, User
from datetime import datetime
from flask import Flask, flash, redirect, url_for

ticket_bp = Blueprint('ticket', __name__)

@ticket_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    if request.method == 'POST':
        try:
            title = request.form.get('title')
            description = request.form.get('description')
            category = request.form.get('category')
            priority = request.form.get('priority')
            
            if not all([title, description, category, priority]):
                flash('All fields are required!', 'error')
                return redirect(url_for('ticket.create'))
            
            ticket = Ticket(
                title=title,
                description=description,
                category=category,
                priority=priority,
                user_id=current_user.id
            )
            
            db.session.add(ticket)
            db.session.commit()
            
            flash('Ticket created successfully!', 'success')
            return redirect(url_for('user.dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash('Error creating ticket.', 'error')
    
    return render_template('create_ticket.html')

@ticket_bp.route('/api/create', methods=['POST'])
@login_required
def api_create():
    try:
        data = request.get_json()
        
        ticket = Ticket(
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            priority=data.get('priority'),
            user_id=current_user.id
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ticket created successfully!',
            'ticket_id': ticket.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@ticket_bp.route('/api/all')
@login_required
def api_all():
    try:
        if current_user.is_admin:
            tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
        else:
            tickets = Ticket.query.filter_by(user_id=current_user.id).order_by(Ticket.created_at.desc()).all()
        
        tickets_data = []
        for ticket in tickets:
            tickets_data.append({
                'id': ticket.id,
                'title': ticket.title,
                'description': ticket.description,
                'category': ticket.category,
                'priority': ticket.priority,
                'status': ticket.status,
                'assigned_agent': ticket.assigned_agent,
                'created_at': ticket.created_at.strftime('%Y-%m-%d %H:%M'),
                'updated_at': ticket.updated_at.strftime('%Y-%m-%d %H:%M'),
                'user_name': ticket.author.name
            })
        
        return jsonify({'tickets': tickets_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ticket_bp.route('/api/update/<int:ticket_id>', methods=['PUT'])
@login_required
def api_update(ticket_id):
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.get_json()
        
        # Authorization check
        if not current_user.is_admin and ticket.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if current_user.is_admin:
            if 'status' in data:
                ticket.status = data['status']
            if 'assigned_agent' in data:
                ticket.assigned_agent = data['assigned_agent']
            if 'internal_notes' in data:
                ticket.internal_notes = data['internal_notes']
        
        # Users can update these fields
        if 'title' in data:
            ticket.title = data['title']
        if 'description' in data:
            ticket.description = data['description']
        if 'category' in data:
            ticket.category = data['category']
        if 'priority' in data:
            ticket.priority = data['priority']
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Ticket updated successfully!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@ticket_bp.route('/api/delete/<int:ticket_id>', methods=['DELETE'])
@login_required
def api_delete(ticket_id):
    try:
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ticket = Ticket.query.get_or_404(ticket_id)
        db.session.delete(ticket)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Ticket deleted successfully!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@ticket_bp.route('/api/stats')
@login_required
def api_stats():
    try:
        if current_user.is_admin:
            total = Ticket.query.count()
            open_count = Ticket.query.filter_by(status='Open').count()
            in_progress = Ticket.query.filter_by(status='In Progress').count()
            resolved = Ticket.query.filter_by(status='Resolved').count()
            closed = Ticket.query.filter_by(status='Closed').count()
            
            # Category distribution
            categories = db.session.execute(
                "SELECT category, COUNT(*) FROM tickets GROUP BY category"
            ).fetchall()
            
            # Priority distribution
            priorities = db.session.execute(
                "SELECT priority, COUNT(*) FROM tickets GROUP BY priority"
            ).fetchall()
            
        else:
            total = Ticket.query.filter_by(user_id=current_user.id).count()
            open_count = Ticket.query.filter_by(user_id=current_user.id, status='Open').count()
            in_progress = Ticket.query.filter_by(user_id=current_user.id, status='In Progress').count()
            resolved = Ticket.query.filter_by(user_id=current_user.id, status='Resolved').count()
            closed = Ticket.query.filter_by(user_id=current_user.id, status='Closed').count()
            categories = []
            priorities = []
        
        return jsonify({
            'total': total,
            'open': open_count,
            'in_progress': in_progress,
            'resolved': resolved,
            'closed': closed,
            'categories': dict(categories),
            'priorities': dict(priorities)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500