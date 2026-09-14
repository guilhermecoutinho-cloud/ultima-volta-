/**
 * ============================================================================
 * ÚLTIMA VOLTA 2026 — Landing Page Script
 * Vanilla ES6+ | Zero Dependencies
 * ============================================================================
 */

/* ---------- CONFIG ---------- */
const CONFIG = {
    GA4_ID: '',           // Insert Google Analytics 4 Measurement ID
    META_PIXEL_ID: '',    // Insert Meta Pixel ID
    CLARITY_ID: '',       // Insert Microsoft Clarity ID
    CRM_WEBHOOK_URL: 'https://webhook.unnica.com.br/functions/v1/flow-webhook-receive?token=whk_1pBnuF4leMt7DLBn2fhnJlNcFIb4BVbp',
};

document.addEventListener('DOMContentLoaded', () => {

    /* ===================================================================
       UTILITIES
       =================================================================== */
    const debounce = (fn, ms = 16) => {
        let id;
        return (...args) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...args), ms);
        };
    };

    /* ===================================================================
       1. SMOOTH SCROLL for anchor links
       =================================================================== */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();

            const y = target.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: y, behavior: 'smooth' });

            // Accessibility: move focus
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    });

    /* ===================================================================
       4. SCROLL REVEAL (IntersectionObserver)
       =================================================================== */
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;

            if (el.classList.contains('reveal-group')) {
                const children = el.querySelectorAll('.reveal-child');
                children.forEach((child, i) => {
                    setTimeout(() => child.classList.add('revealed'), i * 120);
                });
            } else {
                const delay = parseInt(el.dataset.delay, 10) || 0;
                setTimeout(() => el.classList.add('revealed'), delay);
            }
            obs.unobserve(el);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
    });

    document.querySelectorAll('.reveal, .reveal-group').forEach(el => revealObserver.observe(el));

    /* ===================================================================
       5. FAQ ACCORDION
       =================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!btn || !answer) return;

        answer.style.maxHeight = '0px';

        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            // Close all
            faqItems.forEach(other => {
                if (other === item) return;
                other.classList.remove('active');
                const ob = other.querySelector('.faq-question');
                const oa = other.querySelector('.faq-answer');
                if (ob) ob.setAttribute('aria-expanded', 'false');
                if (oa) oa.style.maxHeight = '0px';
            });

            // Toggle current
            item.classList.toggle('active', !isOpen);
            btn.setAttribute('aria-expanded', String(!isOpen));
            answer.style.maxHeight = isOpen ? '0px' : answer.scrollHeight + 'px';
        });

        // Keyboard
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    /* ===================================================================
       6. TIMELINE PROGRESS — o trilho acende conforme a página rola
       =================================================================== */
    const timelineTrack = document.querySelector('.timeline');
    let rafTimeline;

    function updateTimelineProgress() {
        const rect = timelineTrack.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0% quando o topo do trilho entra pela base da tela,
        // 100% quando a base do trilho passa do topo da tela.
        const pct = (vh - rect.top) / (rect.height + vh);
        timelineTrack.style.setProperty('--progress', `${Math.min(1, Math.max(0, pct)) * 100}%`);
    }

    if (timelineTrack) {
        window.addEventListener('scroll', () => {
            if (rafTimeline) return;
            rafTimeline = requestAnimationFrame(() => {
                updateTimelineProgress();
                rafTimeline = null;
            });
        }, { passive: true });
        updateTimelineProgress();
    }

    /* ===================================================================
       7. SUBTLE PARALLAX (Desktop only)
       =================================================================== */
    const parallaxEls = document.querySelectorAll('.parallax-bg');
    let rafParallax;

    function doParallax() {
        if (window.innerWidth <= 1024 || !parallaxEls.length) return;
        const scrollY = window.scrollY;
        parallaxEls.forEach(el => {
            const speed = parseFloat(el.dataset.speed) || 0.04;
            const y = Math.max(-50, Math.min(50, -(scrollY * speed)));
            el.style.transform = `translateY(${y}px)`;
        });
    }

    window.addEventListener('scroll', () => {
        if (rafParallax) return;
        rafParallax = requestAnimationFrame(() => {
            doParallax();
            rafParallax = null;
        });
    }, { passive: true });

    /* ===================================================================
       8. TRACKING — Event helper
       =================================================================== */
    window.trackEvent = function (eventName, params = {}) {
        let tracked = false;

        // GA4
        if (typeof gtag === 'function' && CONFIG.GA4_ID) {
            gtag('event', eventName, params);
            tracked = true;
        }
        // Meta Pixel
        if (typeof fbq === 'function' && CONFIG.META_PIXEL_ID) {
            fbq('trackCustom', eventName, params);
            tracked = true;
        }
        // Clarity
        if (typeof clarity === 'function' && CONFIG.CLARITY_ID) {
            clarity('set', eventName, params.value || 'clicked');
            tracked = true;
        }

        if (!tracked) {
            console.log(`[Tracking] ${eventName}`, params);
        }
    };

    document.querySelectorAll('[data-track]').forEach(el => {
        el.addEventListener('click', () => {
            const name = el.dataset.track;
            window.trackEvent(name, { label: el.textContent.trim().substring(0, 60) });
        });
    });

    /* ===================================================================
       8.4. DISPONIBILIDADE DOS LOTES POR DATA
       Cada lote (.lot-card no grid de preços, .ticket-toggle-option no
       formulário) carrega data-start/data-end. Comparamos com a data do
       visitante e bloqueamos visualmente o que ainda não abriu ou já fechou.
       =================================================================== */
    const now = new Date();
    let activeRadio = null;

    function lotState(el) {
        const start = new Date(el.dataset.start);
        const end = new Date(el.dataset.end);
        if (now < start) return 'locked';
        if (now > end) return 'expired';
        return 'active';
    }

    document.querySelectorAll('.lot-card[data-start]').forEach(card => {
        const state = lotState(card);
        const btn = card.querySelector('.lot-card__btn');
        if (state === 'active') return;

        card.classList.add(`lot-card--${state}`);
        if (btn) {
            btn.dataset.originalText = btn.textContent.trim();
            btn.textContent = state === 'locked'
                ? `DISPONÍVEL EM ${new Date(card.dataset.start).toLocaleDateString('pt-BR')}`
                : 'LOTE ENCERRADO';
            btn.setAttribute('aria-disabled', 'true');
            btn.setAttribute('tabindex', '-1');
        }
    });

    document.querySelectorAll('.ticket-toggle-option[data-start]').forEach(opt => {
        const state = lotState(opt);
        const input = opt.querySelector('input[type="radio"]');
        if (state === 'active') {
            if (!activeRadio) activeRadio = input;
            return;
        }
        opt.classList.add(`ticket-toggle-option--${state}`);
        if (input) input.disabled = true;
    });

    // Nenhum lote na janela (ex.: todos encerrados) → cai no primeiro rádio para o form não submeter vazio
    (activeRadio || document.querySelector('input[name="ticket_tier"]')).checked = true;

    /* ===================================================================
       8.5. TICKET SELECTION & SCROLL TO FORM
       =================================================================== */
    document.querySelectorAll('[data-ticket]:not([aria-disabled="true"])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // data-ticket="lote-1" → primeiro rádio, "lote-2" → segundo, etc.
            const index = Number(btn.dataset.ticket.split('-')[1]) - 1;
            const radios = document.querySelectorAll('input[name="ticket_tier"]');
            const targetRadio = radios[index];


            if (targetRadio) {
                targetRadio.checked = true;
                // Dispatch change event to update any visual radio styles
                targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // After smooth scroll finishes, focus the name field
            setTimeout(() => {
                const nameInput = document.getElementById('form-name');
                if (nameInput) nameInput.focus();
            }, 600);
        });
    });

    /* ===================================================================
       9. LEAD FORM SUBMISSION (CRM UNNICA)
       =================================================================== */
    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Basic validation check
            if (!leadForm.checkValidity()) {
                leadForm.reportValidity();
                return;
            }

            leadForm.classList.add('is-loading');
            leadForm.classList.remove('is-error');

            const formData = new FormData(leadForm);
            const data = Object.fromEntries(formData.entries());
            data.origem = 'Landing Page Última Volta 2026';

            try {
                // Example webhook post to CRM Unnica
                const response = await fetch(CONFIG.CRM_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok || response.type === 'opaque') {
                    // Success!
                    leadForm.classList.remove('is-loading');
                    leadForm.classList.add('is-success');
                    
                    window.trackEvent('lead_generated', { form: 'ultima_volta' });
                } else {
                    throw new Error('Network response was not ok');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                leadForm.classList.remove('is-loading');
                leadForm.classList.add('is-error');
            }
        });
    }

    /* ===================================================================
       10. PAGE LOADED
       =================================================================== */
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');

        // Hero image preload check
        const heroImg = document.querySelector('.hero__img');
        const heroSection = document.querySelector('.hero');
        if (heroImg && heroSection) {
            if (heroImg.complete) {
                heroSection.classList.add('hero-loaded');
            } else {
                heroImg.addEventListener('load', () => heroSection.classList.add('hero-loaded'));
            }
        }
    });


    // 6. KART VIDEO CUSTOM PLAYER
    const kartVideo = document.getElementById('kartVideo');
    const kartVideoOverlay = document.getElementById('kartVideoOverlay');
    const kartVideoWrapper = document.querySelector('.kart__video-wrapper');

    if (kartVideo && kartVideoOverlay && kartVideoWrapper) {
        function togglePlay() {
            if (kartVideo.paused) {
                kartVideo.play();
                kartVideoOverlay.style.opacity = '0';
                kartVideoOverlay.style.pointerEvents = 'none';
                kartVideo.setAttribute('controls', 'true'); // Allow native controls once playing so user has full control (volume, fullscreen)
            } else {
                kartVideo.pause();
                kartVideoOverlay.style.opacity = '1';
                kartVideoOverlay.style.pointerEvents = 'auto';
                kartVideo.removeAttribute('controls');
            }
        }
        
        kartVideoOverlay.addEventListener('click', togglePlay);
        kartVideo.addEventListener('click', togglePlay);
        kartVideo.addEventListener('pause', () => {
            kartVideoOverlay.style.opacity = '1';
            kartVideoOverlay.style.pointerEvents = 'auto';
            kartVideo.removeAttribute('controls');
        });
        kartVideo.addEventListener('play', () => {
            kartVideoOverlay.style.opacity = '0';
            kartVideoOverlay.style.pointerEvents = 'none';
            kartVideo.setAttribute('controls', 'true');
        });
    }

}); // end DOMContentLoaded
