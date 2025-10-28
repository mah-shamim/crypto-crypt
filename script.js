// Crypto Crypt Main Application with Separate Language File
$(document).ready(function() {
    const CryptoCrypt = {
        coins: [],
        filteredCoins: [],
        portfolioValue: 0,
        dailyChange: 0,
        selectedCoin: null,
        currentLanguage: 'en',
        translations: {},
        soundEnabled: true,
        usingLocalData: false,
        translationsLoaded: false,
        apiBaseUrl: 'https://api.coingecko.com/api/v3',

        // Fallback translations in case languages.json fails to load
        fallbackTranslations: {
            "en": {
                "app_title": "🦇 Crypto Crypt",
                "search_placeholder": "Search coins...",
                "filter_all": "All Ghosts",
                "filter_rising": "Rising Dead",
                "filter_falling": "Buried",
                "portfolio_value": "Portfolio Value:",
                "daily_change": "24h Change:",
                "refresh_button": "🔄 Refresh Crypt",
                "sound_on": "🔊 Sound On",
                "sound_off": "🔇 Sound Off",
                "loading": "Loading crypt data...",
                "loading_local": "Loading local data...",
                "error": "Failed to load data!",
                "no_results": "No coins found...",
                "current_price": "Current Price:",
                "market_cap": "Market Cap:",
                "volume_24h": "Volume (24h):",
                "trade": "Trade",
                "close": "Close",
                "api_error": "API Error! Using local data.",
                "offline_mode": "🌐 Offline - Local data",
                "online_mode": "🌐 Online - Live data",
                "translations_loaded": "Translations loaded!",
                "translations_error": "Translations failed! Using English."
            }
        },

        init: function() {
            this.loadTranslations()
                .then(() => {
                    this.setupEventListeners();
                    this.loadCoinData();
                    this.setupAnimations();
                    this.applyLanguage(this.currentLanguage);
                    this.setupOnlineStatusListener();
                })
                .catch(error => {
                    console.error('Initialization failed:', error);
                    // Continue with fallback translations
                    this.translations = this.fallbackTranslations;
                    this.translationsLoaded = true;
                    this.setupEventListeners();
                    this.loadCoinData();
                    this.setupAnimations();
                    this.applyLanguage(this.currentLanguage);
                });
        },

        loadTranslations: function() {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: 'languages.json',
                    method: 'GET',
                    dataType: 'json',
                    timeout: 10000,
                    success: (data) => {
                        this.translations = data;
                        this.translationsLoaded = true;
                        console.log('Translations loaded successfully');
                        resolve();
                    },
                    error: (xhr, status, error) => {
                        console.warn('Failed to load languages.json, using fallback:', error);
                        this.translations = this.fallbackTranslations;
                        this.translationsLoaded = true;
                        this.showStatusMessage(this.translate('translations_error'), 'warning');
                        resolve(); // Resolve anyway to continue app initialization
                    }
                });
            });
        },

        setupOnlineStatusListener: function() {
            window.addEventListener('online', () => {
                this.showStatusMessage(this.translate('online_mode'), 'success');
                if (this.usingLocalData) {
                    setTimeout(() => {
                        this.loadCoinData();
                    }, 2000);
                }
            });

            window.addEventListener('offline', () => {
                this.showStatusMessage(this.translate('offline_mode'), 'warning');
            });
        },

        showStatusMessage: function(message, type = 'info') {
            const notification = $(`
                <div class="status-notification status-${type}">
                    ${message}
                </div>
            `);
            
            $('body').append(notification);
            
            notification.css({
                position: 'fixed',
                top: '70px',
                right: '20px',
                padding: '0.75rem 1.5rem',
                background: type === 'success' ? 'var(--success-color)' : 
                           type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)',
                color: 'white',
                borderRadius: '10px',
                zIndex: 10000,
                transform: 'translateX(100%)',
                transition: 'transform 0.3s ease',
                fontSize: '0.9rem',
                fontWeight: '600'
            });
            
            setTimeout(() => {
                notification.css('transform', 'translateX(0)');
            }, 100);
            
            setTimeout(() => {
                notification.css('transform', 'translateX(100%)');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        },

        setupEventListeners: function() {
            $('#language-select').on('change', this.handleLanguageChange.bind(this));
            $('#coin-search').on('input', this.handleSearch.bind(this));
            $('.filter-btn').on('click', this.handleFilter.bind(this));
            $('#refresh-btn').on('click', this.loadCoinData.bind(this));
            $('#sound-btn').on('click', this.toggleSound.bind(this));
            $('.close-modal').on('click', this.closeModal.bind(this));
            
            $(window).on('click', (e) => {
                if ($(e.target).hasClass('modal')) {
                    this.closeModal();
                }
            });

            $(document).on('keydown', this.handleKeyboardShortcuts.bind(this));
        },

        handleLanguageChange: function(e) {
            const newLanguage = e.target.value;
            this.applyLanguage(newLanguage);
        },

        setupLanguageSpecificStyles: function(languageCode) {
            $('html').attr('lang', languageCode);
        },

        applyLanguage: function(languageCode) {
            this.currentLanguage = languageCode;
            this.setupLanguageSpecificStyles(languageCode);
            
            const lang = this.translations[languageCode] || this.translations['en'];
            
            $('[data-i18n]').each(function() {
                const key = $(this).data('i18n');
                if (lang && lang[key]) {
                    $(this).text(lang[key]);
                }
            });
            
            $('[data-i18n-placeholder]').each(function() {
                const key = $(this).data('i18n-placeholder');
                if (lang && lang[key]) {
                    $(this).attr('placeholder', lang[key]);
                }
            });
            
            if (lang && lang['app_title']) {
                document.title = lang['app_title'];
            }
            
            if (this.coins.length > 0) {
                this.renderGraveyard();
                this.updatePortfolioSummary();
            }
        },

        translate: function(key) {
            if (this.translations[this.currentLanguage] && this.translations[this.currentLanguage][key]) {
                return this.translations[this.currentLanguage][key];
            } else if (this.translations['en'] && this.translations['en'][key]) {
                return this.translations['en'][key];
            } else if (this.fallbackTranslations['en'][key]) {
                return this.fallbackTranslations['en'][key];
            } else {
                return key;
            }
        },

        handleKeyboardShortcuts: function(e) {
            if (e.key === 'Escape') {
                this.closeModal();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.loadCoinData();
            }
        },

        toggleSound: function() {
            this.soundEnabled = !this.soundEnabled;
            const $soundBtn = $('#sound-btn');
            if (this.soundEnabled) {
                $soundBtn.html('🔊 ' + this.translate('sound_on'));
            } else {
                $soundBtn.html('🔇 ' + this.translate('sound_off'));
            }
        },

        setupAnimations: function() {
            $('body').append('<div class="fog-overlay" id="fog-overlay"></div>');
        },

        loadCoinData: function() {
            if (!this.translationsLoaded) {
                // Wait a bit for translations to load
                setTimeout(() => {
                    this.loadCoinData();
                }, 500);
                return;
            }

            const loadingMessage = navigator.onLine ? 
                this.translate('loading') : 
                this.translate('loading_local');
            
            $('#graveyard').html(`<div class="loading">${loadingMessage}</div>`);

            if (navigator.onLine) {
                this.fetchFromAPI();
            } else {
                this.fetchFromLocal();
            }
        },

        fetchFromAPI: function() {
            $.ajax({
                url: `${this.apiBaseUrl}/coins/markets`,
                method: 'GET',
                timeout: 10000,
                data: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page: 50,
                    page: 1,
                    sparkline: false,
                    price_change_percentage: '24h'
                },
                success: (data) => {
                    this.usingLocalData = false;
                    this.processCoinData(data, 'api');
                    this.showStatusMessage(this.translate('online_mode'), 'success');
                },
                error: (xhr, status, error) => {
                    console.warn('API failed, falling back to local data:', error);
                    this.fetchFromLocal();
                }
            });
        },

        fetchFromLocal: function() {
            $.ajax({
                url: 'data.json',
                method: 'GET',
                timeout: 5000,
                success: (data) => {
                    this.usingLocalData = true;
                    this.processCoinData(data.coins, 'local');
                    if (!navigator.onLine) {
                        this.showStatusMessage(this.translate('offline_mode'), 'warning');
                    } else {
                        this.showStatusMessage(this.translate('api_error'), 'warning');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Both API and local data failed:', error);
                    this.usingLocalData = false;
                    $('#graveyard').html(`
                        <div class="error">
                            <h3>💀 ${this.translate('error')}</h3>
                            <p>${this.translate('api_error')}</p>
                            <button onclick="CryptoCrypt.loadCoinData()" class="refresh-btn">
                                ${this.translate('refresh_button')}
                            </button>
                        </div>
                    `);
                }
            });
        },

        processCoinData: function(data, source) {
            this.coins = data.map(coin => {
                if (source === 'api') {
                    return {
                        id: coin.id,
                        symbol: coin.symbol,
                        name: coin.name,
                        current_price: coin.current_price,
                        change_24h: coin.price_change_percentage_24h || 0,
                        market_cap: coin.market_cap,
                        volume_24h: coin.total_volume,
                        image: coin.image,
                        last_updated: coin.last_updated,
                        source: 'api'
                    };
                } else {
                    return {
                        id: coin.id,
                        symbol: coin.symbol,
                        name: coin.name,
                        current_price: coin.current_price,
                        change_24h: coin.change_24h || 0,
                        market_cap: coin.market_cap,
                        volume_24h: coin.volume_24h,
                        source: 'local'
                    };
                }
            });
            
            this.filteredCoins = [...this.coins];
            this.renderGraveyard();
            this.updatePortfolioSummary();
            this.startRealTimeUpdates();
        },

        handleSearch: function(e) {
            const searchTerm = e.target.value.toLowerCase();
            this.filteredCoins = this.coins.filter(coin => 
                coin.name.toLowerCase().includes(searchTerm) ||
                coin.symbol.toLowerCase().includes(searchTerm)
            );
            this.renderGraveyard();
        },

        handleFilter: function(e) {
            const filter = $(e.target).data('filter');
            
            $('.filter-btn').removeClass('active');
            $(e.target).addClass('active');
            
            switch(filter) {
                case 'rising':
                    this.filteredCoins = this.coins.filter(coin => coin.change_24h > 0);
                    break;
                case 'falling':
                    this.filteredCoins = this.coins.filter(coin => coin.change_24h < 0);
                    break;
                default:
                    this.filteredCoins = [...this.coins];
            }
            
            this.renderGraveyard();
        },

        renderGraveyard: function() {
            const $graveyard = $('#graveyard');
            $graveyard.empty();
            
            // Remove any existing data source indicators
            $('.data-source-indicator').remove();
            
            if (this.filteredCoins.length === 0) {
                $graveyard.html('<div class="no-results">' + this.translate('no_results') + '</div>');
                return;
            }
            
            // Add data source indicator
            if (this.usingLocalData) {
                $graveyard.before(`
                    <div class="data-source-indicator offline">
                        📡 ${this.translate('offline_mode')}
                    </div>
                `);
            } else {
                $graveyard.before(`
                    <div class="data-source-indicator online">
                        🌐 ${this.translate('online_mode')}
                    </div>
                `);
            }
            
            this.filteredCoins.forEach(coin => {
                const tombstoneType = this.getTombstoneType(coin);
                const changeClass = coin.change_24h >= 0 ? 'positive' : 'negative';
                const changeSymbol = coin.change_24h >= 0 ? '↗' : '↘';
                const sourceIcon = coin.source === 'api' ? '🌐' : '💾';
                
                const $tombstone = $(`
                    <div class="tombstone ${tombstoneType}" data-coin-id="${coin.id}">
                        <div class="coin-header">
                            <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                            <div class="data-source">${sourceIcon}</div>
                        </div>
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-price">$${this.formatPrice(coin.current_price)}</div>
                        <div class="coin-change ${changeClass}">
                            ${changeSymbol} ${Math.abs(coin.change_24h).toFixed(2)}%
                        </div>
                    </div>
                `);
                
                $tombstone.on('click', () => this.showCoinDetails(coin));
                $graveyard.append($tombstone);
            });
        },

        formatPrice: function(price) {
            if (!price && price !== 0) return 'N/A';
            if (price >= 1) {
                return price.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            } else {
                return price.toLocaleString('en-US', { 
                    minimumFractionDigits: 4, 
                    maximumFractionDigits: 6 
                });
            }
        },

        getTombstoneType: function(coin) {
            const change = coin.change_24h;
            if (!change && change !== 0) return 'fading-ghost';
            if (change > 15) return 'extreme-rise';
            if (change > 5) return 'rising-zombie';
            if (change > 0) return 'rising-zombie';
            if (change > -10) return 'fading-ghost';
            return 'cracked-tombstone';
        },

        showCoinDetails: function(coin) {
            this.selectedCoin = coin;
            
            const sourceInfo = coin.source === 'api' ? 
                `<div class="detail-row">
                    <span class="label">Data Source:</span>
                    <span class="value">🌐 Live API Data</span>
                </div>` : 
                `<div class="detail-row">
                    <span class="label">Data Source:</span>
                    <span class="value">💾 Local Data</span>
                </div>`;
            
            const modalContent = `
                <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
                <div class="coin-details">
                    <div class="detail-row">
                        <span class="label">${this.translate('current_price')}</span>
                        <span class="value">$${this.formatPrice(coin.current_price)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">${this.translate('daily_change')}</span>
                        <span class="value ${coin.change_24h >= 0 ? 'positive' : 'negative'}">
                            ${coin.change_24h >= 0 ? '↗' : '↘'} ${Math.abs(coin.change_24h || 0).toFixed(2)}%
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">${this.translate('market_cap')}</span>
                        <span class="value">$${coin.market_cap?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">${this.translate('volume_24h')}</span>
                        <span class="value">$${coin.volume_24h?.toLocaleString() || 'N/A'}</span>
                    </div>
                    ${sourceInfo}
                    ${coin.last_updated ? `
                    <div class="detail-row">
                        <span class="label">Last Updated:</span>
                        <span class="value">${new Date(coin.last_updated).toLocaleTimeString()}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-actions">
                    <button class="action-btn trade-btn">${this.translate('trade')}</button>
                    <button class="action-btn close-btn">${this.translate('close')}</button>
                </div>
            `;
            
            $('#coin-details').html(modalContent);
            $('#coin-modal').fadeIn(300);
            
            $('.trade-btn').on('click', () => this.tradeCoin(coin));
            $('.close-btn').on('click', () => this.closeModal());
        },

        closeModal: function() {
            $('#coin-modal').fadeOut(300);
            this.selectedCoin = null;
        },

        tradeCoin: function(coin) {
            alert(`${this.translate('trade')} interface for ${coin.name} would open here!`);
            this.closeModal();
        },

        updatePortfolioSummary: function() {
            if (this.coins.length === 0) return;
            
            let totalValue = 0;
            let totalChange = 0;
            let validCoins = 0;
            
            this.coins.forEach(coin => {
                if (coin.current_price && coin.change_24h) {
                    totalValue += coin.current_price * 100;
                    totalChange += coin.change_24h;
                    validCoins++;
                }
            });
            
            if (validCoins === 0) return;
            
            this.portfolioValue = totalValue;
            this.dailyChange = totalChange / validCoins;
            
            $('#portfolio-value').text(`$${this.formatPrice(totalValue)}`);
            
            const $dailyChange = $('#daily-change');
            $dailyChange.text(`${this.dailyChange >= 0 ? '+' : ''}${this.dailyChange.toFixed(2)}%`);
            $dailyChange.removeClass('change-positive change-negative change-neutral');
            
            if (this.dailyChange > 0) {
                $dailyChange.addClass('change-positive');
            } else if (this.dailyChange < 0) {
                $dailyChange.addClass('change-negative');
            } else {
                $dailyChange.addClass('change-neutral');
            }
            
            this.updateFogEffect();
        },

        updateFogEffect: function() {
            const fogOpacity = this.dailyChange < -5 ? 0.4 : 
                             this.dailyChange < -2 ? 0.2 : 
                             this.dailyChange < 0 ? 0.1 : 0;
            $('#fog-overlay').css('opacity', fogOpacity);
        },

        startRealTimeUpdates: function() {
            if (this.usingLocalData) {
                setInterval(() => {
                    this.animateRandomTombstones();
                }, 10000);
            } else {
                setInterval(() => {
                    if (navigator.onLine) {
                        this.loadCoinData();
                    }
                }, 120000);
                
                setInterval(() => {
                    this.animateRandomTombstones();
                }, 10000);
            }
        },

        animateRandomTombstones: function() {
            $('.tombstone').each(function() {
                if (Math.random() < 0.1) {
                    $(this).addClass('pulse-animation');
                    setTimeout(() => {
                        $(this).removeClass('pulse-animation');
                    }, 1000);
                }
            });
        }
    };

    // Initialize the app
    CryptoCrypt.init();
});