// Enhanced Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.tickets = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            status: '',
            priority: '',
            dateRange: '',
            search: ''
        };
        this.charts = {};
        this.stats = {};
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Advanced Admin Dashboard...');
        
        this.initDatePickers();
        this.initEventListeners();
        this.loadDashboardData();
        this.initCharts();
        this.startRealTimeUpdates();
    }

    initDatePickers() {
        flatpickr("#dateRange", {
            mode: "range",
            dateFormat: "Y-m-d",
            placeholder: "Select date range"
        });

        flatpickr("#exportDateRange", {
            mode: "range",
            dateFormat: "Y-m-d",
            placeholder: "Select date range"
        });
    }

    initEventListeners() {
        // Filter event listeners
        ['statusFilter', 'priorityFilter', 'searchInput', 'pageSize'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                this.handleFilterChange(id, e.target.value);
            });
        });

        document.getElementById('dateRange').addEventListener('change', (e) => {
            this.filters.dateRange = e.target.value;
            this.applyFilters();
        });

        // Real-time search
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 300);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.loadDashboardData();
                        break;
                    case 'e':
                        e.preventDefault();
                        document.querySelector('.export-btn').click();
                        break;
                }
            }
        });
    }

    handleFilterChange(filterType, value) {
        this.filters[filterType.replace('Filter', '').toLowerCase()] = value;
        if (filterType === 'pageSize') {
            this.pageSize = parseInt(value);
            this.currentPage = 1;
        }
        this.applyFilters();
    }

    async loadDashboardData() {
        try {
            this.showLoading('ticketsTable');
            this.showGlobalLoading();
            
            const [ticketsResponse, statsResponse] = await Promise.all([
                fetch('/api/admin/tickets'),
                fetch('/api/admin/stats')
            ]);

            const ticketsData = await ticketsResponse.json();
            const statsData = await statsResponse.json();

            if (ticketsData.success && statsData.success) {
                this.tickets = ticketsData.tickets;
                this.stats = statsData.stats;
                
                this.updateStats(this.stats);
                this.renderTicketsTable();
                this.updateCharts(this.stats);
                this.updateQuickStats();
                
                this.showToast('Dashboard updated successfully', 'success');
            } else {
                throw new Error('Failed to load data');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Error loading dashboard data', 'error');
        } finally {
            this.hideGlobalLoading();
        }
    }

    updateStats(stats) {
        const statElements = {
            'totalTickets': stats.totalTickets,
            'openTickets': stats.openTickets,
            'resolvedTickets': stats.resolvedToday,
            'activeUsers': stats.activeUsers
        };

        Object.entries(statElements).forEach(([id, value]) => {
            this.animateCounter(id, value);
        });

        document.getElementById('ticketCount').textContent = 
            `Showing ${this.getFilteredTickets().length} of ${this.tickets.length} tickets`;
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const steps = 60;
        const stepValue = (targetValue - currentValue) / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const value = Math.round(currentValue + (stepValue * currentStep));
            element.textContent = value.toLocaleString();

            if (currentStep >= steps) {
                element.textContent = targetValue.toLocaleString();
                clearInterval(timer);
            }
        }, duration / steps);
    }

    updateQuickStats() {
        // Update additional quick stats if needed
        const responseTime = document.getElementById('avgResponseTime');
        if (responseTime && this.stats.avgResponseTime) {
            responseTime.textContent = `${this.stats.avgResponseTime}m`;
        }
    }

    renderTicketsTable() {
        const tableBody = document.getElementById('ticketsTable');
        const filteredTickets = this.getFilteredTickets();
        const paginatedTickets = this.getPaginatedTickets(filteredTickets);
        
        if (paginatedTickets.length === 0) {
            tableBody.innerHTML = this.getEmptyState();
            return;
        }

        tableBody.innerHTML = paginatedTickets.map(ticket => this.renderTicketRow(ticket)).join('');
        this.renderPagination(filteredTickets.length);
        this.initTicketInteractions();
    }

    renderTicketRow(ticket) {
        const priorityClass = `priority-${ticket.priority.toLowerCase()}`;
        const statusClass = `status-${ticket.status.toLowerCase().replace(' ', '-')}`;
        const daysAgo = this.getDaysAgo(ticket.created_at);

        return `
            <tr class="ticket-row" data-ticket-id="${ticket.id}" data-priority="${ticket.priority}" data-status="${ticket.status}">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ticket-avatar bg-light rounded-circle p-2 me-2">
                            <i class="fas fa-ticket-alt text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-bold">#${ticket.id}</div>
                            <small class="text-muted">${daysAgo}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-semibold ticket-subject">${this.escapeHtml(ticket.subject)}</div>
                    <small class="text-muted ticket-description">${this.escapeHtml(ticket.description.substring(0, 80))}...</small>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar bg-primary rounded-circle p-1 me-2">
                            <i class="fas fa-user text-white" style="font-size: 0.8rem;"></i>
                        </div>
                        <div>
                            <div class="fw-medium">${this.escapeHtml(ticket.user_name)}</div>
                            <small class="text-muted">${this.escapeHtml(ticket.user_email)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${priorityClass}">
                        <i class="fas fa-${this.getPriorityIcon(ticket.priority)} me-1"></i>
                        ${ticket.priority}
                    </span>
                </td>
                <td>
                    <span class="badge bg-light text-dark">${this.escapeHtml(ticket.category)}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${ticket.status}
                    </span>
                </td>
                <td>
                    <div class="small fw-medium">${new Date(ticket.created_at).toLocaleDateString()}</div>
                    <small class="text-muted">${new Date(ticket.created_at).toLocaleTimeString()}</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary btn-action" onclick="adminDashboard.quickView(${ticket.id})" 
                                data-bs-toggle="tooltip" title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning btn-action" onclick="adminDashboard.updateStatus(${ticket.id}, 'In Progress')"
                                data-bs-toggle="tooltip" title="Mark In Progress">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="adminDashboard.updateStatus(${ticket.id}, 'Resolved')"
                                data-bs-toggle="tooltip" title="Resolve">
                            <i class="fas fa-check"></i>
                        </button>
                        <div class="dropdown d-inline-block">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="adminDashboard.assignTicket(${ticket.id})"><i class="fas fa-user-plus me-2"></i>Assign</a></li>
                                <li><a class="dropdown-item" href="#" onclick="adminDashboard.addNote(${ticket.id})"><i class="fas fa-sticky-note me-2"></i>Add Note</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="adminDashboard.deleteTicket(${ticket.id})"><i class="fas fa-trash me-2"></i>Delete</a></li>
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    initTicketInteractions() {
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });

        // Add row click handlers
        document.querySelectorAll('.ticket-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-action')) {
                    const ticketId = row.getAttribute('data-ticket-id');
                    this.quickView(ticketId);
                }
            });
        });
    }

    getPriorityIcon(priority) {
        const icons = {
            'Low': 'arrow-down',
            'Medium': 'minus',
            'High': 'arrow-up',
            'Urgent': 'exclamation-triangle'
        };
        return icons[priority] || 'circle';
    }

    getDaysAgo(dateString) {
        const created = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }

    getEmptyState() {
        return `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No tickets found</h5>
                        <p class="text-muted mb-3">Try adjusting your filters or search terms</p>
                        <button class="btn btn-primary btn-sm" onclick="clearFilters()">
                            <i class="fas fa-undo me-2"></i>Clear Filters
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async quickView(ticketId) {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`);
            const data = await response.json();
            
            if (data.success) {
                this.showTicketModal(data.ticket);
            } else {
                this.showToast('Error loading ticket details', 'error');
            }
        } catch (error) {
            console.error('Error loading ticket:', error);
            this.showToast('Error loading ticket details', 'error');
        }
    }

    showTicketModal(ticket) {
        // Create and show a modal with ticket details
        const modalHtml = `
            <div class="modal fade" id="ticketModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Ticket #${ticket.id}: ${this.escapeHtml(ticket.subject)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6>Description</h6>
                                    <p>${this.escapeHtml(ticket.description)}</p>
                                </div>
                                <div class="col-md-4">
                                    <h6>Details</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Status:</strong></td><td>${ticket.status}</td></tr>
                                        <tr><td><strong>Priority:</strong></td><td>${ticket.priority}</td></tr>
                                        <tr><td><strong>Category:</strong></td><td>${ticket.category}</td></tr>
                                        <tr><td><strong>Created:</strong></td><td>${new Date(ticket.created_at).toLocaleString()}</td></tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('ticketModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
        modal.show();
    }

    async assignTicket(ticketId) {
        // Implement ticket assignment functionality
        this.showToast('Assign ticket functionality coming soon', 'info');
    }

    async addNote(ticketId) {
        // Implement add note functionality
        this.showToast('Add note functionality coming soon', 'info');
    }

    async deleteTicket(ticketId) {
        if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Ticket deleted successfully', 'success');
                this.loadDashboardData();
            } else {
                this.showToast('Failed to delete ticket', 'error');
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            this.showToast('Error deleting ticket', 'error');
        }
    }

    startRealTimeUpdates() {
        // Simulate real-time updates (in a real app, use WebSockets)
        setInterval(() => {
            this.updateLiveStats();
        }, 30000); // Update every 30 seconds
    }

    async updateLiveStats() {
        try {
            const response = await fetch('/api/admin/stats/live');
            const data = await response.json();
            
            if (data.success) {
                this.updateStats(data.stats);
            }
        } catch (error) {
            console.error('Error updating live stats:', error);
        }
    }

    showGlobalLoading() {
        // Show a global loading indicator
        let loader = document.getElementById('globalLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            loader.style.background = 'rgba(0,0,0,0.5)';
            loader.style.zIndex = '9999';
            loader.innerHTML = `
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            document.body.appendChild(loader);
        }
    }

    hideGlobalLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.remove();
        }
    }

    // ... (rest of the existing methods remain the same)
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});