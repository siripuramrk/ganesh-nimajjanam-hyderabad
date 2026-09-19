/*
 * Ganesh Nimajjanam Hyderabad 2026 — page behaviour.
 * Reads data/facts.json at runtime so the JSON stays the single source of truth.
 * No dependencies, no eval, no inline handlers.
 */
(function () {
  'use strict';

  // Immersion muhurat window from the verified fact base (10:55 – 13:18 IST, 2026-09-25).
  var MUHURAT_ISO = '2026-09-25T10:55:00+05:30';

  // Facts shown first in the grid, in this order; every remaining fact follows.
  var FACE_ORDER = [
    'immersion-date',
    'installation-date',
    'muhurat',
    'immersion-points-count',
    'height-cap',
    'police-deployment',
    'scale'
  ];

  var reducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function showError(message) {
    var box = document.getElementById('app-error');
    var factsGrid = document.getElementById('facts-grid');
    var factsLoading = document.getElementById('facts-loading');
    var note = document.getElementById('countdown-note');
    if (factsLoading) factsLoading.remove();
    if (factsGrid) {
      factsGrid.setAttribute('aria-busy', 'false');
      factsGrid.replaceChildren();
    }
    if (box) {
      box.hidden = false;
      box.replaceChildren();
      box.appendChild(el('strong', null, 'Could not load the verified data. '));
      box.appendChild(document.createTextNode(
        message + ' The facts still hold: the immersion is on Friday, 25 September 2026 '
      ));
      box.appendChild(el('span', null, '(Anant Chaturdashi), with the muhurat at 10:55 – 13:18. '));
      var link = el('a', null, 'Jump to the sources');
      link.setAttribute('href', '#sources');
      box.appendChild(link);
      box.appendChild(document.createTextNode('.'));
    }
    if (note) {
      note.textContent = 'Immersion day: Friday, 25 September 2026 (Anant Chaturdashi).';
    }
  }

  function renderFacts(data) {
    var grid = document.getElementById('facts-grid');
    if (!grid) return;

    var byId = {};
    data.key_facts.forEach(function (fact) {
      byId[fact.id] = fact;
    });

    var ordered = [];
    FACE_ORDER.forEach(function (id) {
      if (byId[id]) {
        ordered.push(byId[id]);
        byId[id].__used = true;
      }
    });
    data.key_facts.forEach(function (fact) {
      if (!fact.__used) ordered.push(fact);
    });

    var sources = data.source_index || {};
    var frag = document.createDocumentFragment();
    var usedSourceKeys = [];

    ordered.forEach(function (fact) {
      var card = el('article', 'fact');

      card.appendChild(el('p', 'fact-label', fact.label));
      card.appendChild(el('p', 'fact-value', fact.value));
      card.appendChild(el('p', 'fact-detail', fact.detail));

      var keys = fact.sources || [];
      if (keys.length) {
        var line = el('p', 'fact-sources', 'Sources: ');
        var first = true;
        keys.forEach(function (key) {
          var entry = sources[key];
          if (!entry) return;
          if (usedSourceKeys.indexOf(key) === -1) usedSourceKeys.push(key);
          if (!first) line.appendChild(document.createTextNode(', '));
          first = false;
          var link = el('a', null, entry.outlet);
          link.setAttribute('href', entry.url);
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          link.setAttribute('title', entry.outlet + ': ' + entry.title);
          line.appendChild(link);
        });
        card.appendChild(line);
      }

      frag.appendChild(card);
    });

    grid.replaceChildren(frag);
    grid.setAttribute('aria-busy', 'false');
    return usedSourceKeys;
  }

  function renderRoute(data) {
    var list = document.getElementById('route-list');
    if (!list || !data.route) return;

    var stops = data.route.slice().sort(function (a, b) {
      return a.order - b.order;
    });

    var frag = document.createDocumentFragment();
    stops.forEach(function (stop) {
      var li = el('li');
      var body = el('div', 'route-body');
      body.appendChild(el('p', 'route-place', stop.place));
      if (stop.note) body.appendChild(el('p', 'route-note', stop.note));
      li.appendChild(body);
      frag.appendChild(li);
    });

    list.replaceChildren(frag);
  }

  function renderMeta(data) {
    var meta = data.meta || {};
    var title = document.title;
    if (meta.title && title.indexOf(meta.title) === -1) {
      document.title = meta.title + ' — ' + title;
    }
  }

  function formatNumber(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function startCountdown() {
    var days = document.getElementById('cd-days');
    var hours = document.getElementById('cd-hours');
    var minutes = document.getElementById('cd-minutes');
    var seconds = document.getElementById('cd-seconds');
    var note = document.getElementById('countdown-note');
    var grid = document.getElementById('countdown-grid');
    if (!days || !hours || !minutes || !seconds) return;

    var target = new Date(MUHURAT_ISO).getTime();
    var timer = null;
    var lastRendered = -1;

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function setValues(d, h, m, s) {
      days.textContent = String(d);
      hours.textContent = formatNumber(h);
      minutes.textContent = formatNumber(m);
      seconds.textContent = formatNumber(s);
      if (grid) grid.setAttribute('aria-label', d + ' days, ' + h + ' hours, ' + m + ' minutes until the immersion muhurat');
    }

    function tick() {
      var diff = target - Date.now();

      if (diff <= 0) {
        stop();
        setValues(0, 0, 0, 0);
        if (note) {
          note.textContent =
            'The immersion muhurat (10:55 – 13:18 on Friday, 25 September 2026) has begun or passed. ' +
            'The procession runs through the day; confirm the muhurat with your purohit for a family immersion.';
        }
        return;
      }

      var totalSeconds = Math.floor(diff / 1000);
      var d = Math.floor(totalSeconds / 86400);
      var h = Math.floor((totalSeconds % 86400) / 3600);
      var m = Math.floor((totalSeconds % 3600) / 60);
      var s = totalSeconds % 60;

      // Under reduced motion, update once a minute instead of every second.
      if (reducedMotion.matches) {
        var minuteBucket = Math.floor(totalSeconds / 60);
        if (minuteBucket === lastRendered) return;
        lastRendered = minuteBucket;
        setValues(d, h, m, 0);
        return;
      }

      setValues(d, h, m, s);
    }

    tick();

    if (reducedMotion.matches) {
      if (timer !== null) window.clearInterval(timer);
      timer = window.setInterval(tick, 60000);
    } else {
      timer = window.setInterval(tick, 1000);
    }
  }

  function boot() {
    startCountdown();

    window.fetch('data/facts.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        }
        return response.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.key_facts) || !data.source_index) {
          throw new Error('the data file is not in the expected shape.');
        }
        renderMeta(data);
        renderFacts(data);
        renderRoute(data);
      })
      .catch(function (error) {
        var reason = error && error.message ? error.message : 'unknown error';
        showError('The page could not fetch data/facts.json (' + reason + ').');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
