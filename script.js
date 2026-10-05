(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (next === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menu-toggle');
  var navLinks = document.getElementById('nav-links');
  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!navLinks.classList.contains('is-open'));
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Nav border on scroll ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var linkMap = {};
  navLinks.querySelectorAll('a[href^="#"]').forEach(function (a) {
    linkMap[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(linkMap).forEach(function (k) { linkMap[k].classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { activeObs.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings slightly
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.classList.contains('reveal');
        });
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 4) * 80 + 'ms';
        el.classList.add('is-visible');
        revealObs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  var statNums = document.querySelectorAll('.stat-num[data-count]');
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;
    var duration = 1000;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        countObs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    statNums.forEach(function (el) { countObs.observe(el); });
  }

  /* ---------- Terminal animation ---------- */
  var term = document.getElementById('terminal-body');
  var lines = [
    { text: 'Running 6 tests using 4 workers', cls: 't-dim' },
    { text: '' },
    { text: '  ✓ windows-client › checkout flow', cls: 't-pass', time: '(812ms)' },
    { text: '  ✓ cloud-web › reports export', cls: 't-pass', time: '(1.1s)' },
    { text: '  ✓ android › offline sync', cls: 't-pass', time: '(940ms)' },
    { text: '  ✓ cloud-app › ios login', cls: 't-pass', time: '(655ms)' },
    { text: '  ✓ api › orders endpoint contract', cls: 't-pass', time: '(210ms)' },
    { text: '  ✓ release › regression suite', cls: 't-pass', time: '(2.3s)' },
    { text: '' },
    { text: '  6 passed (4.2s)', cls: 't-summary' },
    { text: '' },
    { text: '$ ready to ship', cls: '' }
  ];

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
  }
  function renderLine(l) {
    var html = l.cls ? '<span class="' + l.cls + '">' + escapeHtml(l.text) + '</span>' : escapeHtml(l.text);
    if (l.time) html += ' <span class="t-dim">' + l.time + '</span>';
    return html;
  }

  if (reduceMotion) {
    term.innerHTML = lines.map(renderLine).join('\n');
  } else {
    var i = 0;
    var out = [];
    function next() {
      if (i >= lines.length) {
        term.innerHTML = out.join('\n') + '<span class="cursor"></span>';
        setTimeout(function () { i = 0; out = []; next(); }, 6000);
        return;
      }
      out.push(renderLine(lines[i]));
      term.innerHTML = out.join('\n') + '<span class="cursor"></span>';
      var delay = lines[i].cls === 't-pass' ? 380 : 220;
      i++;
      setTimeout(next, delay);
    }
    setTimeout(next, 500);
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById('copy-email');
  copyBtn.addEventListener('click', function () {
    var label = copyBtn.querySelector('span');
    var email = copyBtn.getAttribute('data-email');
    function done(msg) {
      label.textContent = msg;
      setTimeout(function () { label.textContent = 'Copy email'; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { done('Copied!'); }, function () { done(email); });
    } else {
      done(email);
    }
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
