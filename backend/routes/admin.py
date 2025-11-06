from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from database import db
from models import Ticket, User
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.before_request
def restrict_to_admin():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('admin_dashboard.html')

@admin_bp.route('/users')
@login_required
def users():
    return render_template('admin_users.html')

@admin_bp.route('/analytics')
@login_required
def analytics():
    return render_template('admin_analytics.html')

@admin_bp.route('/api/dashboard-stats')
@login_required
def api_dashboard_stats():
    try:
        # Basic stats
        total_tickets = Ticket.query.count()
        open_tickets = Ticket.query.filter_by(status='Open').count()
        in_progress_tickets = Ticket.query.filter_by(status='In Progress').count()
        resolved_tickets = Ticket.query.filter_by(status='Resolved').count()
        closed_tickets = Ticket.query.filter_by(status='Closed').count()
        total_users = User.query.count()
        
        # Recent tickets
        recent_tickets = Ticket.query.order_by(Ticket.created_at.desc()).limit(10).all()
        recent_tickets_data = [{
            'id': ticket.id,
            'title': ticket.title,
            'status': ticket.status,
            'priority': ticket.priority,
            'created_at': ticket.created_at.strftime('%Y-%m-%d %H:%M'),
            'user_name': ticket.author.name
        } for ticket in recent_tickets]
        
        return jsonify({
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'in_progress_tickets': in_progress_tickets,
            'resolved_tickets': resolved_tickets,
            'closed_tickets': closed_tickets,
            'total_users': total_users,
            'recent_tickets': recent_tickets_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/analytics-data')
@login_required
def api_analytics_data():
    try:
        # Ticket statistics
        total_tickets = Ticket.query.count()
        open_tickets = Ticket.query.filter_by(status='Open').count()
        in_progress_tickets = Ticket.query.filter_by(status='In Progress').count()
        resolved_tickets = Ticket.query.filter_by(status='Resolved').count()
        closed_tickets = Ticket.query.filter_by(status='Closed').count()
        
        # Category distribution
        categories = db.session.execute(
            "SELECT category, COUNT(*) FROM tickets GROUP BY category"
        ).fetchall()
        
        # Priority distribution
        priorities = db.session.execute(
            "SELECT priority, COUNT(*) FROM tickets GROUP BY priority"
        ).fetchall()
        
        # Daily trends (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        if db.engine.url.drivername == 'sqlite':
            date_format = "date(created_at)"
        else:
            date_format = "DATE(created_at)"
        
        daily_trends = db.session.execute(
            f"SELECT {date_format}, COUNT(*) FROM tickets WHERE created_at >= :start_date GROUP BY {date_format} ORDER BY {date_format}",
            {'start_date': seven_days_ago}
        ).fetchall()
        
        # User statistics
        user_stats = db.session.execute(
            "SELECT COUNT(*), AVG(ticket_count) FROM (SELECT user_id, COUNT(*) as ticket_count FROM tickets GROUP BY user_id) as user_tickets"
        ).fetchone()
        
        return jsonify({
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'in_progress_tickets': in_progress_tickets,
            'resolved_tickets': resolved_tickets,
            'closed_tickets': closed_tickets,
            'categories': dict(categories),
            'priorities': dict(priorities),
            'daily_trends': [{'date': str(date), 'count': count} for date, count in daily_trends],
            'user_stats': {
                'total_users': user_stats[0] if user_stats else 0,
                'avg_tickets_per_user': float(user_stats[1]) if user_stats and user_stats[1] else 0
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500