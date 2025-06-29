/**
 * @typedef {Object} Company
 * @property {number} id
 * @property {string} company
 * @property {string} category
 * @property {number} season
 * @property {boolean} closed_deal
 * @property {string[]} participants
 * @property {string[]} investors
 * @property {number} amount_requested
 * @property {number} equity_offered
 * @property {number} amount_negotiated
 * @property {number} equity_negotiated
 * @property {string} proposal_type
 * @property {number} episode
 * @property {string} description
 */

class SharkTankApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            search: '',
            seasons: [],
            categories: [],
            status: [],
            participants: [],
            investors: [],
            minInvestment: null,
            maxInvestment: null
        };
        this.sorting = '';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTheme();
        await this.loadData();
        this.setupFilters();
        this.filteredData = [...this.data];
        this.render();
    }

    setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });
        document.getElementById('mobileFilterBtn').addEventListener('click', () => this.toggleMobileFilters());
        document.getElementById('filtersClose').addEventListener('click', () => this.closeMobileFilters());
        document.getElementById('filterOverlay').addEventListener('click', () => this.closeMobileFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('clearAllFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sorting = e.target.value;
            this.applyFilters();
        });
        document.getElementById('prevPage').addEventListener('click', () => this.changePage(this.currentPage - 1));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage(this.currentPage + 1));
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') this.closeModal();
        });
        document.getElementById('minInvestment').addEventListener('input', () => this.applyInvestmentFilter());
        document.getElementById('maxInvestment').addEventListener('input', () => this.applyInvestmentFilter());
    }

    setupTheme() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    updateThemeToggle(theme) {
        const toggle = document.getElementById('themeToggle');
        toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    async loadData() {
        const loadingState = document.getElementById('loadingState');
        const cacheStatus = document.getElementById('cacheStatus');
        const CACHE_KEY = 'sharktank_data_cache';
        const CACHE_TIME_KEY = 'sharktank_data_cache_time';
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h in ms
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
            const now = Date.now();
            if (cached && cachedTime && now - parseInt(cachedTime, 10) < CACHE_DURATION) {
                this.data = this.parseData(JSON.parse(cached));
                if (cacheStatus) {
                    cacheStatus.style.display = '';
                    cacheStatus.querySelector('.cache-text').textContent = 'Dados carregados do cache';
                }
                loadingState.style.display = 'none';
                return;
            }
            const response = await fetch('https://l3k7pe4jy6.execute-api.us-east-1.amazonaws.com/dev/deals');
            if (!response.ok) throw new Error('Error fetching data');
            this.data = this.parseData(await response.json());
            localStorage.setItem(CACHE_KEY, JSON.stringify(this.data));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            if (cacheStatus) {
                cacheStatus.style.display = '';
                cacheStatus.querySelector('.cache-text').textContent = 'Dados carregados da API';
            }
            loadingState.style.display = 'none';
        } catch (error) {
            loadingState.style.display = 'none';
        }
    }

    parseData(data) {
        return data.map(item => {
            const splittedId = item.id.split('#')
            return {
                id: item.id,
                season: parseInt(splittedId[0]),
                episode: parseInt(splittedId[1]),
                company: splittedId[2],
                category: item.category,
                closed_deal: item.closed_deal,
                participants: item.participants,
                investors: item.investors,
                amount_requested: item.amount_requested,
                equity_offered: item.equity_offered,
                amount_negotiated: item.amount_negotiated,
                equity_negotiated: item.equity_negotiated,
                proposal_type: item.proposal_type,
                description: item.description
            }
        });
    }

    setupFilters() {
        this.setupSeasonFilters();
        this.setupCategoryFilters();
        this.setupParticipantFilters();
        this.setupInvestorFilters();
        this.setupFilterToggles();
    }

    setupFilterToggles() {
        document.querySelectorAll('.filter-section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFilterSection(toggle);
            });
        });
    }

    setupSeasonFilters() {
        const seasons = [...new Set(this.data.map(item => item.season))].sort((a, b) => a - b);
        const container = document.getElementById('season');
        container.innerHTML = seasons.map(season => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${season}" data-filter="seasons"> Temporada ${season}
            </label>
        `).join('');
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.applySeasonFilter());
        });
    }

    setupCategoryFilters() {
        const categories = [...new Set(this.data.map(item => item.category))].sort();
        const container = document.getElementById('category');
        container.innerHTML = categories.map(category => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${category}" data-filter="categories"> ${category}
            </label>
        `).join('');
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.applyCategoryFilter());
        });
    }

    setupParticipantFilters() {
        const participants = [...new Set(this.data.flatMap(item => item.participants))].sort();
        const container = document.getElementById('participants');
        container.innerHTML = participants.map(participant => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${participant}" data-filter="participants"> ${participant}
            </label>
        `).join('');
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.applyParticipantFilter());
        });
        document.getElementById('status').querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.applyStatusFilter());
        });
    }

    setupInvestorFilters() {
        const investors = [...new Set(this.data.flatMap(item => item.investors))].sort();
        const container = document.getElementById('investors');
        container.innerHTML = investors.map(investor => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${investor}" data-filter="investors"> ${investor}
            </label>
        `).join('');
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.applyInvestorFilter());
        });
        document.getElementById('status').querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.applyStatusFilter());
        });
    }

    applySeasonFilter() {
        const checked = document.querySelectorAll('#season input:checked');
        this.filters.seasons = Array.from(checked).map(input => parseInt(input.value));
        this.applyFilters();
    }

    applyCategoryFilter() {
        const checked = document.querySelectorAll('#category input:checked');
        this.filters.categories = Array.from(checked).map(input => input.value);
        this.applyFilters();
    }

    applyStatusFilter() {
        const checked = document.querySelectorAll('#status input:checked');
        this.filters.status = Array.from(checked).map(input => input.value === 'true');
        this.applyFilters();
    }

    applyParticipantFilter() {
        const checked = document.querySelectorAll('#participants input:checked');
        this.filters.participants = Array.from(checked).map(input => input.value);
        this.applyFilters();
    }

    applyInvestorFilter() {
        const checked = document.querySelectorAll('#investors input:checked');
        this.filters.investors = Array.from(checked).map(input => input.value);
        this.applyFilters();
    }

    applyInvestmentFilter() {
        const min = document.getElementById('minInvestment').value;
        const max = document.getElementById('maxInvestment').value;
        this.filters.minInvestment = min ? parseInt(min) : null;
        this.filters.maxInvestment = max ? parseInt(max) : null;
        this.applyFilters();
    }

    applyFilters() {
        let data = [...this.data];
        if (this.filters.search) {
            const term = this.filters.search.toLowerCase();
            data = data.filter(item =>
                item.company.toLowerCase().includes(term) ||
                item.category.toLowerCase().includes(term) ||
                item.participants.some(inv => inv.toLowerCase().includes(term)) ||
                item.investors.some(inv => inv.toLowerCase().includes(term)) ||
                item.description.toLowerCase().includes(term)
            );
        }
        if (this.filters.seasons.length > 0) {
            data = data.filter(item => this.filters.seasons.includes(item.season));
        }
        if (this.filters.categories.length > 0) {
            data = data.filter(item => this.filters.categories.includes(item.category));
        }
        if (this.filters.status.length > 0) {
            data = data.filter(item => this.filters.status.includes(item.closed_deal));
        }
        if (this.filters.participants.length > 0) {
            data = data.filter(item =>
                this.filters.participants.some(inv => item.participants.includes(inv))
            );
        }
        if (this.filters.investors.length > 0) {
            data = data.filter(item =>
                this.filters.investors.some(inv => item.investors.includes(inv))
            );
        }
        if (this.filters.minInvestment !== null) {
            data = data.filter(item => item.amount_requested >= this.filters.minInvestment);
        }
        if (this.filters.maxInvestment !== null) {
            data = data.filter(item => item.amount_requested <= this.filters.maxInvestment);
        }
        if (this.sorting) {
            const [field, order] = this.sorting.includes('-desc')
                ? [this.sorting.replace('-desc', ''), 'desc']
                : [this.sorting, 'asc'];
            data.sort((a, b) => {
                let valueA = a[field];
                let valueB = b[field];
                if (typeof valueA === 'string') {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                }
                if (order === 'desc') {
                    return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
                } else {
                    return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
                }
            });
        }
        this.filteredData = data;
        this.currentPage = 1;
        this.render();
    }

    clearFilters() {
        this.filters = {
            search: '',
            seasons: [],
            categories: [],
            status: [],
            participants: [],
            investors: [],
            minInvestment: null,
            maxInvestment: null
        };
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = '';
        document.getElementById('minInvestment').value = '';
        document.getElementById('maxInvestment').value = '';
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(input => {
            input.checked = false;
        });
        this.sorting = '';
        this.applyFilters();
    }

    toggleFilterSection(toggle) {
        const target = toggle.getAttribute('data-target');
        const options = document.getElementById(target);
        const isOpen = options.classList.contains('open');
        if (isOpen) {
            options.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        } else {
            options.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
        }
    }

    toggleMobileFilters() {
        const sidebar = document.getElementById('filtersSidebar');
        const overlay = document.getElementById('filterOverlay');
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileFilters() {
        const sidebar = document.getElementById('filtersSidebar');
        const overlay = document.getElementById('filterOverlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    render() {
        this.renderStats();
        this.renderResults();
        this.renderPagination();
    }

    renderStats() {
        const totalCompanies = this.data.length;
        const closedDeals = this.data.filter(item => item.closed_deal).length;
        const totalInvestment = this.data
            .filter(item => item.closed_deal)
            .reduce((total, item) => total + item.amount_negotiated, 0);
        const successRate = totalCompanies > 0 ? Math.round((closedDeals / totalCompanies) * 100) : 0;
        document.getElementById('totalCompanies').textContent = totalCompanies;
        document.getElementById('closedDeals').textContent = closedDeals;
        document.getElementById('totalInvestment').textContent = this.formatCurrency(totalInvestment);
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    renderResults() {
        const resultsSection = document.getElementById('resultsSection');
        const emptyState = document.getElementById('emptyState');
        const resultsCount = document.getElementById('resultsCount');
        if (this.filteredData.length === 0) {
            resultsSection.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        resultsSection.style.display = 'block';
        emptyState.style.display = 'none';
        resultsCount.textContent = this.filteredData.length;
        this.renderTable();
        this.renderCards();
    }

    renderTable() {
        const tbody = document.getElementById('tableBody');
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredData.slice(start, end);
        tbody.innerHTML = pageData.map(item => `
            <tr onclick="window.showDetails(${item.id})" role="button" tabindex="0">
                <td><strong>${item.company}</strong></td>
                <td>${item.category}</td>
                <td>${item.season}</td>
                <td>
                    <span class="status-badge ${item.closed_deal ? 'status-badge--success' : 'status-badge--error'}">
                        ${item.closed_deal ? 'Fechado' : 'Não fechado'}
                    </span>
                </td>
                <td class="participants-list">${item.participants.join(', ') || '-'}</td>
                <td class="investors-list">${item.investors.join(', ') || '-'}</td>
                <td class="currency">${this.formatCurrency(item.amount_requested)}</td>
                <td class="percentage">${item.equity_offered}%</td>
                <td class="currency">${item.closed_deal ? this.formatCurrency(item.amount_negotiated) : '-'}</td>
                <td class="percentage">${item.closed_deal ? item.equity_negotiated + '%' : '-'}</td>
                <td>${item.proposal_type}</td>
            </tr>
        `).join('');
    }

    renderCards() {
        const container = document.getElementById('cardsContainer');
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredData.slice(start, end);
        container.innerHTML = pageData.map(item => `
            <div class="company-card" onclick="window.showDetails(${item.id})" role="button" tabindex="0">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${item.company}</h3>
                        <div class="card-category">${item.category} • Temporada ${item.season}</div>
                    </div>
                    <span class="status-badge ${item.closed_deal ? 'status-badge--success' : 'status-badge--error'}">
                        ${item.closed_deal ? 'Fechado' : 'Não fechado'}
                    </span>
                </div>
                <div class="card-details">
                    <div class="card-detail">
                        <div class="card-detail-label">Valor solicitado</div>
                        <div class="card-detail-value currency">${this.formatCurrency(item.amount_requested)}</div>
                    </div>
                    <div class="card-detail">
                        <div class="card-detail-label">Participação oferecida</div>
                        <div class="card-detail-value percentage">${item.equity_offered}%</div>
                    </div>
                    <div class="card-detail">
                        <div class="card-detail-label">Participantes</div>
                        <div class="card-detail-value">${item.participants.join(', ') || 'None'}</div>
                    </div>
                    </div>
                    <div class="card-detail">
                        <div class="card-detail-label">Investidores</div>
                        <div class="card-detail-value">${item.investors.join(', ') || 'None'}</div>
                    </div>
                    <div class="card-detail">
                        <div class="card-detail-label">Valor negociado</div>
                        <div class="card-detail-value currency">${item.closed_deal ? this.formatCurrency(item.amount_negotiated) : '-'}</div>
                    </div>
                    <div class="card-detail">
                        <div class="card-detail-label">Participação negociada</div>
                        <div class="card-detail-value percentage">${item.closed_deal ? item.equity_negotiated + '%' : '-'}%</div>
                    </div>
                    <div class="card-detail">
                        <div class="card-detail-label">Tipo de acordo</div>
                        <div class="card-detail-value">${item.proposal_type}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
        document.getElementById('paginationStart').textContent = start;
        document.getElementById('paginationEnd').textContent = end;
        document.getElementById('paginationTotal').textContent = this.filteredData.length;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages || totalPages === 0;
        const pagesContainer = document.getElementById('paginationPages');
        const pagesToShow = this.getPagesToShow(totalPages);
        pagesContainer.innerHTML = pagesToShow.map(page => {
            if (page === '...') {
                return '<span class="pagination-ellipsis">...</span>';
            }
            return `
                <button class="pagination-page ${page === this.currentPage ? 'active' : ''}" 
                        onclick="window.changePage(${page})">
                    ${page}
                </button>
            `;
        }).join('');
    }

    getPagesToShow(totalPages) {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [];
        const current = this.currentPage;
        pages.push(1);
        if (current > 4) {
            pages.push('...');
        }
        const start = Math.max(2, current - 1);
        const end = Math.min(totalPages - 1, current + 1);
        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }
        if (current < totalPages - 3) {
            pages.push('...');
        }
        if (!pages.includes(totalPages)) {
            pages.push(totalPages);
        }
        return pages;
    }

    changePage(newPage) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderResults();
            this.renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showDetails(id) {
        const company = this.data.find(item => item.id === id);
        if (!company) return;
        const modal = document.getElementById('detailModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        modalTitle.textContent = company.company;
        modalBody.innerHTML = `
            <div class="modal-detail-grid">
                <div class="modal-detail">
                    <div class="modal-detail-label">Categoria</div>
                    <div class="modal-detail-value">${company.category}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Temporada</div>
                    <div class="modal-detail-value">Temporada ${company.season}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Episódio</div>
                    <div class="modal-detail-value">Episódio ${company.episode}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Status</div>
                    <div class="modal-detail-value">
                        <span class="status-badge ${company.closed_deal ? 'status-badge--success' : 'status-badge--error'}">
                            ${company.closed_deal ? 'Acordo fechado' : 'Acordo não fechado'}
                        </span>
                    </div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Valor solicitado</div>
                    <div class="modal-detail-value currency">${this.formatCurrency(company.amount_requested)}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Participação oferecida</div>
                    <div class="modal-detail-value percentage">${company.equity_offered}%</div>
                </div>
                ${company.closed_deal ? `
                    <div class="modal-detail">
                        <div class="modal-detail-label">Valor negociado</div>
                        <div class="modal-detail-value currency">${this.formatCurrency(company.amount_negotiated)}</div>
                    </div>
                    <div class="modal-detail">
                        <div class="modal-detail-label">Participação negociada</div>
                        <div class="modal-detail-value percentage">${company.equity_negotiated}%</div>
                    </div>
                    <div class="modal-detail">
                        <div class="modal-detail-label">Participantes(s)</div>
                        <div class="modal-detail-value">${company.participants.join(', ')}</div>
                    </div>
                    </div>
                    <div class="modal-detail">
                        <div class="modal-detail-label">Investidores</div>
                        <div class="modal-detail-value">${company.investors.join(', ')}</div>
                    </div>
                ` : ''}
                <div class="modal-detail">
                    <div class="modal-detail-label">Tipo de acordo</div>
                    <div class="modal-detail-value">${company.proposal_type}</div>
                </div>
            </div>
            <div class="modal-description">
                <h4>Description</h4>
                <p>${company.description}</p>
            </div>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('detailModal').style.display = 'none';
        document.body.style.overflow = '';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SharkTankApp();
});
window.showDetails = (id) => app.showDetails(id);
window.changePage = (page) => app.changePage(page);