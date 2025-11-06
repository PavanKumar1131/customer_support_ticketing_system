// User Dashboard JavaScript

class UserDashboard {
    constructor() {
        this.tickets = [];
        this.filters = {
            search: '',
            status: ''
        };
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadTickets();
        this.setupEventListeners();
    }

    async loadStats() {
        try {
            const stats = await ApiService.getTicketStats();
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            Notification.show('Failed to load statistics', 'error');
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-open').textContent = stats.open;
        document.getElementById('stat-progress').textContent = stats.in_progress;
        document.getElementById('stat-resolved').textContent = stats.resolved;
    }

    async loadTickets() {
        const container = document.getElementById('ticketsList');
        Utils.showLoading(container);

        try {
            const data = await ApiService.getTickets();
            this.tickets = data.tickets;
            this.renderTickets(this.tickets);
        } catch (error) {
            console.error('Error loading tickets:', error);
            Utils.showError(container, 'Failed to load tickets');
        }
    }

    renderTickets(tickets) {
        const container = document.getElementById('ticketsList');
        
        if (tickets.length === 0) {
            Utils.showEmptyState(container, 'No tickets found. Create your first ticket!');
            return;
        }

        container.innerHTML = tickets.map(ticket => this.createTicketHTML(ticket)).join('');
    }

    createTicketHTML(ticket) {
        return `
            <div class="ticket-item" data-ticket-id="${ticket.id}">
                <div class="ticket-header">
                    <div class="ticket-title">
                        <h3>${this.escapeHTML(ticket.title)}</h3>
                        <div class="ticket-meta">
                            <span class="meta-item">
                                <i class="fas fa-tag"></i>
                                ${this.escapeHTML(ticket.category)}
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-flag"></i>
                                <span class="priority-badge priority-${ticket.priority.toLowerCase()}">
                                    ${ticket.priority}
                                </span>
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-circle"></i>
                                <span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">
                                    ${ticket.status}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="ticket-actions">
                        <button class="btn btn-secondary btn-sm" onclick="userDashboard.editTicket(${ticket.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <div class="ticket-description">
                    ${this.escapeHTML(ticket.description)}
                </div>
                <div class="ticket-footer">
                    <div class="ticket-date">
                        <i class="fas fa-clock"></i>
                        Created ${Utils.formatRelativeTime(ticket.created_at)}
                    </div>
                    ${ticket.assigned_agent ? `
                        <div class="assigned-agent">
                            <i class="fas fa-user-shield"></i>
                            Assigned to: ${this.escapeHTML(ticket.assigned_agent)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchTickets');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        }, 300));

        // Status filter
        const statusFilter = document.getElementById('filterStatus');
        statusFilter.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });
    }

    applyFilters() {
        let filteredTickets = this.tickets;

        if (this.filters.search) {
            filteredTickets = filteredTickets.filter(ticket =>
                ticket.title.toLowerCase().includes(this.filters.search) ||
                ticket.description.toLowerCase().includes(this.filters.search) ||
                ticket.category.toLowerCase().includes(this.filters.search)
            );
        }

        if (this.filters.status) {
            filteredTickets = filteredTickets.filter(ticket =>
                ticket.status === this.filters.status
            );
        }

        this.renderTickets(filteredTickets);
    }

    // Create Ticket Modal
    showCreateTicketModal() {
        ModalManager.openModal('createTicketModal');
    }

    hideCreateTicketModal() {
        ModalManager.closeModal('createTicketModal');
        document.getElementById('createTicketForm').reset();
    }

    async createTicket(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const formData = {
                title: document.getElementById('ticketTitle').value,
                description: document.getElementById('ticketDescription').value,
                category: document.getElementById('ticketCategory').value,
                priority: document.getElementById('ticketPriority').value
            };

            await ApiService.createTicket(formData);
            
            Notification.show('Ticket created successfully!', 'success');
            this.hideCreateTicketModal();
            await this.loadTickets();
            await this.loadStats();

        } catch (error) {
            console.error('Error creating ticket:', error);
            Notification.show('Failed to create ticket', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async editTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        if (ticket.status === 'Closed') {
            Notification.show('Cannot edit a closed ticket', 'warning');
            return;
        }

        const newTitle = prompt('Enter new title:', ticket.title);
        if (!newTitle) return;

        const newDescription = prompt('Enter new description:', ticket.description);
        if (!newDescription) return;

        const newCategory = prompt('Enter new category:', ticket.category);
        if (!newCategory) return;

        try {
            await ApiService.updateTicket(ticketId, {
                title: newTitle,
                description: newDescription,
                category: newCategory
            });

            Notification.show('Ticket updated successfully!', 'success');
            await this.loadTickets();

        } catch (error) {
            console.error('Error updating ticket:', error);
            Notification.show('Failed to update ticket', 'error');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.userDashboard = new UserDashboard();

    // Setup create ticket form
    const createTicketForm = document.getElementById('createTicketForm');
    if (createTicketForm) {
        createTicketForm.addEventListener('submit', (e) => userDashboard.createTicket(e));
    }
});

// Global functions for HTML onclick handlers
function showCreateTicketModal() {
    if (window.userDashboard) {
        window.userDashboard.showCreateTicketModal();
    }
}

function hideCreateTicketModal() {
    if (window.userDashboard) {
        window.userDashboard.hideCreateTicketModal();
    }
}