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

    // Filter tickets based on current filters
    getFilteredTickets() {
        let filtered = [...this.tickets];
        
        if (this.filters.status) {
            filtered = filtered.filter(t => t.status === this.filters.status);
        }
        
        if (this.filters.priority) {
            filtered = filtered.filter(t => t.priority === this.filters.priority);
        }
        
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                t.subject.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower) ||
                t.user_name.toLowerCase().includes(searchLower) ||
                t.user_email.toLowerCase().includes(searchLower)
            );
        }
        
        if (this.filters.dateRange) {
            const dates = this.filters.dateRange.split(' to ');
            if (dates.length === 2) {
                const startDate = new Date(dates[0]);
                const endDate = new Date(dates[1]);
                filtered = filtered.filter(t => {
                    const ticketDate = new Date(t.created_at);
                    return ticketDate >= startDate && ticketDate <= endDate;
                });
            }
        }
        
        return filtered;
    }

    // Get paginated tickets
    getPaginatedTickets(tickets) {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return tickets.slice(start, end);
    }

    // Apply filters and re-render
    applyFilters() {
        this.currentPage = 1;
        this.renderTicketsTable();
    }

    // Render pagination
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="adminDashboard.goToPage(${this.currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="adminDashboard.goToPage(${i}); return false;">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Next button
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="adminDashboard.goToPage(${this.currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        pagination.innerHTML = html;
    }

    // Go to specific page
    goToPage(page) {
        const totalPages = Math.ceil(this.getFilteredTickets().length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTicketsTable();
        }
    }

    // Show loading state in element
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 text-muted">Loading tickets...</p>
                    </td>
                </tr>
            `;
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container');
        if (!container) return;
        
        const toastId = 'toast-' + Date.now();
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        const bgMap = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        };
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgMap[type]} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${iconMap[type]} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update ticket status
    async updateStatus(ticketId, newStatus) {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(`Ticket status updated to ${newStatus}`, 'success');
                this.loadDashboardData();
            } else {
                this.showToast('Failed to update ticket status', 'error');
            }
        } catch (error) {
            console.error('Error updating ticket status:', error);
            this.showToast('Error updating ticket status', 'error');
        }
    }

    // Initialize charts
    initCharts() {
        // Status Chart
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            this.charts.status = new Chart(statusCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#3b82f6',
                            '#f59e0b',
                            '#10b981',
                            '#6b7280'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                padding: 8,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }

        // Priority Chart
        const priorityCtx = document.getElementById('priorityChart');
        if (priorityCtx) {
            this.charts.priority = new Chart(priorityCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Low', 'Medium', 'High', 'Urgent'],
                    datasets: [{
                        label: 'Tickets by Priority',
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#10b981',
                            '#3b82f6',
                            '#f59e0b',
                            '#ef4444'
                        ],
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: { size: 10 }
                            }
                        },
                        x: {
                            ticks: {
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }
    }

    // Update charts with new data
    updateCharts(stats) {
        if (this.charts.status && stats.statusCounts) {
            this.charts.status.data.datasets[0].data = [
                stats.statusCounts['Open'] || 0,
                stats.statusCounts['In Progress'] || 0,
                stats.statusCounts['Resolved'] || 0,
                stats.statusCounts['Closed'] || 0
            ];
            this.charts.status.update();
        }

        if (this.charts.priority && stats.priorityCounts) {
            this.charts.priority.data.datasets[0].data = [
                stats.priorityCounts['Low'] || 0,
                stats.priorityCounts['Medium'] || 0,
                stats.priorityCounts['High'] || 0,
                stats.priorityCounts['Urgent'] || 0
            ];
            this.charts.priority.update();
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});

// Global functions called from HTML
function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('dateRange').value = '';
    
    if (window.adminDashboard) {
        window.adminDashboard.filters = {
            status: '',
            priority: '',
            dateRange: '',
            search: ''
        };
        window.adminDashboard.applyFilters();
    }
}

function refreshData() {
    if (window.adminDashboard) {
        window.adminDashboard.loadDashboardData();
    }
}

function exportData(format) {
    document.getElementById('exportFormat').value = format;
}

async function startExport() {
    const format = document.getElementById('exportFormat').value;
    const dateRange = document.getElementById('exportDateRange').value;
    const includeUsers = document.getElementById('includeUsers').checked;
    const includeAnalytics = document.getElementById('includeAnalytics').checked;
    
    try {
        const response = await fetch('/api/admin/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                format: format,
                dateRange: dateRange,
                includeUsers: includeUsers,
                includeAnalytics: includeAnalytics
            })
        });
        
        if (response.ok) {
            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tickets-export.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
            if (modal) {
                modal.hide();
            }
            
            if (window.adminDashboard) {
                window.adminDashboard.showToast('Export completed successfully', 'success');
            }
        } else {
            if (window.adminDashboard) {
                window.adminDashboard.showToast('Export failed', 'error');
            }
        }
    } catch (error) {
        console.error('Export error:', error);
        if (window.adminDashboard) {
            window.adminDashboard.showToast('Export failed', 'error');
        }
    }
}