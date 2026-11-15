(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.querySelector('.menu-toggle');
  var mainNav = document.querySelector('.main-nav');

  if (menuToggle && mainNav) {
    var closeMenu = function () {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Открыть меню');
      document.body.classList.remove('menu-open');
    };

    var openMenu = function () {
      mainNav.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Закрыть меню');
      document.body.classList.add('menu-open');
    };

    menuToggle.addEventListener('click', function () {
      var isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    mainNav.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (link) { closeMenu(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuToggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (menuToggle.getAttribute('aria-expanded') !== 'true') { return; }
      if (mainNav.contains(e.target) || menuToggle.contains(e.target)) { return; }
      closeMenu();
    });
  }

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 24) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Active nav highlight ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navLinks.forEach(function (a) {
        var match = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', match);
        if (match) { a.setAttribute('aria-current', 'true'); }
        else { a.removeAttribute('aria-current'); }
      });
    };
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { setActive(entry.target.id); }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var revealTargets = document.querySelectorAll(
      '.section-title, .manifest-text p, .service-item, .master-card, .gallery-item, .space-text, .space-image, .contact-block, .contact-map'
    );
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Booking form (demo only) ---------- */
  var form = document.querySelector('.booking-form');
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var statusEl = document.getElementById('booking-status');

    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.id = 'booking-status';
      statusEl.className = 'booking-status';
      statusEl.setAttribute('role', 'status');
      statusEl.setAttribute('aria-live', 'polite');
      form.appendChild(statusEl);
    }

    var phoneInput = form.querySelector('#phone-input');
    var dateInput = form.querySelector('#date-input');

    // Min date = today
    if (dateInput) {
      var today = new Date();
      var iso = today.toISOString().slice(0, 10);
      dateInput.setAttribute('min', iso);
    }

    // Simple phone mask + validation
    if (phoneInput) {
      var formatPhone = function (digits) {
        var d = digits.replace(/\D/g, '').slice(0, 11);
        if (!d.length) { return ''; }
        if (d[0] === '8') { d = '7' + d.slice(1); }
        if (d[0] !== '7' && d.length) { d = '7' + d.slice(0, 10); }
        var out = '+7';
        if (d.length > 1) { out += ' (' + d.slice(1, 4); }
        if (d.length >= 5) { out += ') ' + d.slice(4, 7); }
        if (d.length >= 8) { out += '-' + d.slice(7, 9); }
        if (d.length >= 10) { out += '-' + d.slice(9, 11); }
        return out;
      };
      phoneInput.addEventListener('input', function () {
        var posEnd = phoneInput.selectionStart === phoneInput.value.length;
        phoneInput.value = formatPhone(phoneInput.value);
        if (posEnd) {
          try { phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length); } catch (err) { /* noop */ }
        }
      });
    }

    var showFieldError = function (field, message) {
      var row = field.closest('.form-row');
      if (!row) { return; }
      var err = row.querySelector('.field-error');
      if (!err) {
        err = document.createElement('span');
        err.className = 'field-error';
        err.setAttribute('aria-live', 'polite');
        row.appendChild(err);
      }
      err.textContent = message;
      field.setAttribute('aria-invalid', 'true');
    };

    var clearFieldError = function (field) {
      var row = field.closest('.form-row');
      if (row) {
        var err = row.querySelector('.field-error');
        if (err) { err.textContent = ''; }
      }
      field.removeAttribute('aria-invalid');
    };

    var validate = function () {
      var valid = true;
      var required = ['#service-select', '#date-input', '#time-select', '#name-input', '#phone-input'];
      required.forEach(function (sel) {
        var field = form.querySelector(sel);
        if (!field) { return; }
        clearFieldError(field);
        var value = (field.value || '').trim();
        if (!value) {
          showFieldError(field, 'Заполните это поле (демо-проверка).');
          valid = false;
        } else if (sel === '#phone-input') {
          var digits = value.replace(/\D/g, '');
          if (digits.length < 11) {
            showFieldError(field, 'Введите номер полностью (демо-проверка).');
            valid = false;
          }
        } else if (sel === '#name-input' && value.length < 2) {
          showFieldError(field, 'Слишком коротко (демо-проверка).');
          valid = false;
        }
      });
      return valid;
    };

    form.addEventListener('input', function (e) {
      if (e.target.matches('input, select')) {
        clearFieldError(e.target);
        if (submitBtn) { submitBtn.disabled = false; }
      }
    });
    form.addEventListener('change', function (e) {
      if (e.target.matches('input, select')) {
        clearFieldError(e.target);
        if (submitBtn) { submitBtn.disabled = false; }
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.classList.remove('is-error', 'is-success');

      if (!validate()) {
        statusEl.textContent = 'Проверьте выделенные поля. Это демонстрационная форма — данные никуда не отправляются.';
        statusEl.classList.add('is-error');
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) { firstInvalid.focus(); }
        return;
      }

      statusEl.textContent = 'Демо-режим: данные не отправлены. На реальном сайте здесь будет подтверждение записи.';
      statusEl.classList.add('is-success');
    });
  }

  /* ---------- Placeholder links (footer policy) ---------- */
  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var note = link.getAttribute('data-demo-note') || 'Демо-ссылка: реальная страница появится на рабочем сайте.';
      var live = document.getElementById('demo-toast');
      if (!live) {
        live = document.createElement('div');
        live.id = 'demo-toast';
        live.className = 'demo-toast';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        document.body.appendChild(live);
      }
      live.textContent = note;
      live.classList.add('is-visible');
      window.clearTimeout(link._t);
      link._t = window.setTimeout(function () { live.classList.remove('is-visible'); }, 3200);
    });
  });

  /* ---------- Smooth anchor focus management ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href.length < 2) { return; }
    var target = document.querySelector(href);
    if (!target) { return; }
    a.addEventListener('click', function () {
      if (prefersReduced) { return; }
      var reduce = target.getAttribute('tabindex') === '-1';
      if (!reduce) { target.setAttribute('tabindex', '-1'); }
      window.setTimeout(function () { target.focus({ preventScroll: true }); }, 400);
    });
  });
})();
