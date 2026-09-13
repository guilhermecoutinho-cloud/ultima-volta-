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
    CRM_WEBHOOK_URL: 'https://webhook.unnica.com.br/receber', // Replace with actual CRM Unnica webhook
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
       1. HEADER — Scroll background + shrink
       =================================================================== */
    const header = document.getElementById('header');
    const onScroll_header = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll_header, { passive: true });
    onScroll_header();

    /* ===================================================================
       2. SMOOTH SCROLL for anchor links
       =================================================================== */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();

            // Close mobile menu if open
            if (nav && nav.classList.contains('menu-open')) toggleMenu();

            const offset = header ? header.offsetHeight + 10 : 90;
            const y = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });

            // Accessibility: move focus
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    });

    /* ===================================================================
       3. MOBILE MENU
       =================================================================== */
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');

    function toggleMenu() {
        if (!hamburger || !nav) return;
        const opening = !nav.classList.contains('menu-open');
        nav.classList.toggle('menu-open', opening);
        hamburger.classList.toggle('active', opening);
        hamburger.setAttribute('aria-expanded', String(opening));
        document.body.style.overflow = opening ? 'hidden' : '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (nav && nav.classList.contains('menu-open') &&
            !nav.contains(e.target) &&
            !hamburger.contains(e.target)) {
            toggleMenu();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav && nav.classList.contains('menu-open')) {
            toggleMenu();
            hamburger.focus();
        }
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
       6. TIMELINE PROGRESS
       =================================================================== */
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length) {
        const tlObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.3, rootMargin: '-5% 0px -5% 0px' });
        timelineItems.forEach(item => tlObs.observe(item));
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
       8.5. TICKET SELECTION & SCROLL TO FORM
       =================================================================== */
    document.querySelectorAll('[data-ticket]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tier = btn.dataset.ticket;
            const targetRadio = tier === 'vip' 
                ? document.querySelector('input[name="ticket_tier"][value*="1.000"]')
                : document.querySelector('input[name="ticket_tier"][value*="500"]');
            
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
    /* ===================================================================
       12. SPEAKERS PREMIUM SLIDER
       =================================================================== */
    const speakersSlider = document.getElementById('speakersSlider');
    if (speakersSlider) {
        const track = document.getElementById('speakersTrack');
        const slides = Array.from(track.querySelectorAll('.speakers-slide'));
        const names = Array.from(document.querySelectorAll('.speakers-slider__name-btn'));
        const counter = document.getElementById('speakersCounter');
        const progressFill = document.getElementById('speakersProgress');
        const btnPrev = document.getElementById('speakersPrev');
        const btnNext = document.getElementById('speakersNext');

        let currentIndex = 0;
        const totalSlides = slides.length;
        let isAnimating = false;
        
        let startX = 0;
        let currentX = 0;

        function updateSlider(index) {
            if (index < 0 || index >= totalSlides || isAnimating) return;
            isAnimating = true;
            currentIndex = index;

            // Active classes for slides (CSS handles the specific animations)
            slides.forEach((s, i) => {
                s.classList.toggle('active', i === currentIndex);
            });

            // Active classes for names
            names.forEach((n, i) => {
                n.classList.toggle('active', i === currentIndex);
            });

            // Counter & Progress
            const displayIndex = String(currentIndex + 1).padStart(2, '0');
            const displayTotal = String(totalSlides).padStart(2, '0');
            counter.textContent = `${displayIndex} / ${displayTotal}`;
            
            progressFill.style.width = `${((currentIndex + 1) / totalSlides) * 100}%`;

            setTimeout(() => {
                isAnimating = false;
            }, 800); // matches CSS transition time
        }

        // Navigation Clicks
        btnNext.addEventListener('click', () => {
            if (currentIndex < totalSlides - 1) updateSlider(currentIndex + 1);
        });

        btnPrev.addEventListener('click', () => {
            if (currentIndex > 0) updateSlider(currentIndex - 1);
        });

        names.forEach(btn => {
            btn.addEventListener('click', () => {
                const goto = parseInt(btn.getAttribute('data-goto'), 10);
                updateSlider(goto);
            });
        });

        // Mobile Swipe Support
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', () => {
            if (!startX || !currentX) return;
            const diff = startX - currentX;
            if (diff > 50 && currentIndex < totalSlides - 1) {
                updateSlider(currentIndex + 1);
            } else if (diff < -50 && currentIndex > 0) {
                updateSlider(currentIndex - 1);
            }
            startX = 0;
            currentX = 0;
        });
        
        // Initial state
        updateSlider(0);
    }
    });

}); // end DOMContentLoaded
