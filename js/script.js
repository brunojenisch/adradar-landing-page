/**
 * AdRadar — Landing Page Scripts
 * - dataLayer (GTM)
 * - Navbar scroll behavior
 * - CTA click handler (mapeamento de links Kiwify)
 * - Tracking de eventos de conversão
 * - FAQ accordion
 */

/* ── 0. dataLayer — DEVE existir antes do GTM no <head> ─────
   (O GTM snippet do <head> já empurra o primeiro evento.
   Esta inicialização é redundante mas garante segurança.) */
window.dataLayer = window.dataLayer || [];

/* ── 1. KIWIFY LINKS — inserir quando disponíveis ──────────── */
const KIWIFY_LINKS = {
  vitalicio: 'https://pay.kiwify.com.br/dGX80oi', // TODO: inserir link Kiwify do plano vitalício (ex: https://pay.kiwify.com.br/XXXXXX)
  mensal:    'https://pay.kiwify.com.br/IlnluoU', // TODO: inserir link Kiwify do plano mensal
  anual:     'https://pay.kiwify.com.br/MNd9jeB', // TODO: inserir link Kiwify do plano anual
};

/* ── 2. INICIALIZAÇÃO ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initCtaLinks();
  initFaqAnimation();
  initScrollTracking();
});

/* ── 3. NAVBAR — muda estilo ao scrollar ──────────────────── */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const SCROLL_THRESHOLD = 80;

  const onScroll = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Aplica estado inicial
}

/* ── 4. CTA LINKS — mapeia data-plan para URL Kiwify ─────── */
function initCtaLinks() {
  const ctaButtons = document.querySelectorAll('[data-plan]');

  ctaButtons.forEach(btn => {
    const plan = btn.getAttribute('data-plan');
    const url  = KIWIFY_LINKS[plan];

    if (url && url !== '#') {
      btn.setAttribute('href', url);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    }

    // Tracking click — empurra evento para GTM dataLayer
    btn.addEventListener('click', () => {
      pushEvent('cta_click', {
        plan:     plan,
        location: btn.closest('section')?.id || 'unknown',
        cta_text: btn.textContent.trim().slice(0, 80),
      });
    });
  });
}

/* ── 5b. TRACKING — helper centralizado ─────────────────────
   GTM captura esses eventos e os mapeia para:
   - Meta Pixel:  CustomEvent → Purchase (no Kiwify thank-you page)
   - GA4:        custom_event
   ─────────────────────────────────────────────────────────── */
function pushEvent(eventName, params = {}) {
  window.dataLayer.push({
    event: eventName,
    ...params,
    timestamp: new Date().toISOString(),
  });
}

/* Eventos de scroll — disparar quando seção de preços é vista */
function initScrollTracking() {
  if (!('IntersectionObserver' in window)) return;

  const sections = {
    'precos':      'pricing_section_view',
    'garantia':    'guarantee_section_view',
    'cta-final':   'cta_final_view',
  };

  Object.entries(sections).forEach(([id, eventName]) => {
    const el = document.getElementById(id);
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            pushEvent(eventName, { section_id: id });
            obs.unobserve(el); // Dispara só uma vez
          }
        });
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
  });
}

/* ── 5. FAQ — animação suave de abertura/fechamento ──────── */
function initFaqAnimation() {
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(details => {
    const summary = details.querySelector('.faq__question');
    const answer  = details.querySelector('.faq__answer');

    if (!summary || !answer) return;

    // Respeita reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    // Fecha outros itens ao abrir um novo (accordion behavior)
    summary.addEventListener('click', (e) => {
      e.preventDefault();

      const isOpen = details.hasAttribute('open');

      // Fecha todos os outros
      faqItems.forEach(other => {
        if (other !== details && other.hasAttribute('open')) {
          other.removeAttribute('open');
        }
      });

      // Toggle o atual
      if (isOpen) {
        details.removeAttribute('open');
      } else {
        details.setAttribute('open', '');
      }
    });
  });
}

/* ── 6. UTILITÁRIO — scroll suave para âncoras ───────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = document.getElementById('nav')?.offsetHeight || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  });
});
