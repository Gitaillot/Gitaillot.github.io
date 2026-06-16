/* Suivi de révision — encart partagé (approche B) v001
   À déposer à la racine du site sous le nom : suivi.js
   À inclure sur chaque page d'application, juste avant </body> :

     <script src="https://gitaillot.github.io/suivi.js"
             data-program="Géographie"
             data-module="Départements Français"
             data-theme=""></script>

   - data-theme est facultatif.
   - IMPORTANT : program / module / theme doivent correspondre EXACTEMENT
     (aux espaces près) aux libellés du catalogue dans le tableau de bord,
     sinon une entrée en double sera créée.
   - Pour un enregistrement vraiment automatique en fin de session, appelle
     depuis ta page :  window.suiviRevision.record('ok')  ou  ('redo').
*/
(function () {
  "use strict";
  var KEY = "gitaillot_srs_v2", DAY = 86400000;
  var INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };
  var LBL = { 1: "quotidien", 2: "tous les 3 j", 3: "hebdo", 4: "tous les 15 j", 5: "mensuel" };

  function sod(ts) { var x = new Date(ts); x.setHours(0, 0, 0, 0); return x.getTime(); }
  function load() { try { var r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  function uid() { return "x" + Math.random().toString(36).slice(2, 9); }
  function norm(s) { return (s || "").trim().toLowerCase(); }

  var sc = document.currentScript || (function () { var a = document.getElementsByTagName("script"); return a[a.length - 1]; })();
  var cfg = {
    program: (sc && sc.getAttribute("data-program")) || "",
    module: (sc && sc.getAttribute("data-module")) || document.title || "Module",
    theme: (sc && sc.getAttribute("data-theme")) || ""
  };

  function getItem() {
    var s = load();
    var it = null;
    for (var i = 0; i < s.length; i++) {
      var x = s[i];
      if (x.type === "module" && norm(x.program) === norm(cfg.program) && norm(x.module) === norm(cfg.module) && norm(x.theme) === norm(cfg.theme)) { it = x; break; }
    }
    if (!it) {
      it = { id: uid(), program: cfg.program, module: cfg.module, theme: cfg.theme, type: "module", phase: "todo", box: null, reviewed: null };
      s.push(it); save(s);
    }
    return { state: s, item: it };
  }

  function record(result) {
    var g = getItem(), s = g.state, it = g.item;
    if (it.phase === "todo") { it.phase = "appr"; it.reviewed = sod(Date.now()); }
    else if (it.phase === "appr") { it.reviewed = sod(Date.now()); }
    else { it.box = result === "ok" ? Math.min(5, (it.box || 1) + 1) : 1; it.reviewed = sod(Date.now()); }
    save(s); paint(); flash("Enregistré \u2713");
  }
  function promote() { var g = getItem(); g.item.phase = "rev"; g.item.box = 1; g.item.reviewed = sod(Date.now()); save(g.state); paint(); flash("Passé en révision \u2713"); }
  function begin() { var g = getItem(); g.item.phase = "appr"; g.item.reviewed = sod(Date.now()); save(g.state); paint(); flash("Suivi démarré \u2713"); }

  // API exploitable par la page (pour un enregistrement automatique en fin de session)
  window.suiviRevision = { record: record, promote: promote, begin: begin, status: function () { return getItem().item; } };

  // ---------- Interface ----------
  var box, body, msgEl;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function flash(t) { if (msgEl) { msgEl.textContent = t; msgEl.style.opacity = "1"; setTimeout(function () { msgEl.style.opacity = "0"; }, 2200); } }

  function paint() {
    var it = getItem().item;
    body.innerHTML = "";
    body.appendChild(el("div", "sr-title", (it.module || "Module") + (it.theme ? " \u203a " + it.theme : "")));
    var st = el("div", "sr-state");
    var actions = el("div", "sr-actions");
    if (it.phase === "todo") {
      st.textContent = "Pas encore suivi";
      var b = el("button", "sr-btn sr-primary", "Démarrer le suivi"); b.onclick = begin; actions.appendChild(b);
    } else if (it.phase === "appr") {
      st.textContent = "En apprentissage (court terme)";
      var r = el("button", "sr-btn", "Revu aujourd'hui"); r.onclick = function () { record("ok"); };
      var p = el("button", "sr-btn sr-primary", "Acquis \u2192 révision"); p.onclick = promote;
      actions.appendChild(r); actions.appendChild(p);
    } else {
      st.textContent = "Révision · boîte " + it.box + " (" + LBL[it.box] + ")";
      var ok = el("button", "sr-btn sr-primary", "Réussi"); ok.onclick = function () { record("ok"); };
      var rd = el("button", "sr-btn sr-redo", "À revoir"); rd.onclick = function () { record("redo"); };
      actions.appendChild(ok); actions.appendChild(rd);
    }
    body.appendChild(st); body.appendChild(actions);
  }

  function mount() {
    var style = el("style");
    style.textContent =
      ".sr-w{position:fixed;right:16px;bottom:16px;z-index:99999;width:252px;background:#F8FAF9;color:#16231F;border:1px solid #D4DBD7;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.12);font-family:system-ui,-apple-system,sans-serif;font-size:14px;overflow:hidden}" +
      ".sr-h{display:flex;justify-content:space-between;align-items:center;background:#2C6E55;color:#fff;padding:8px 12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase}" +
      ".sr-h button{background:transparent;border:none;color:#fff;cursor:pointer;font-size:16px;line-height:1;padding:0 4px}" +
      ".sr-b{padding:12px}" +
      ".sr-title{font-weight:600;margin-bottom:4px}" +
      ".sr-state{font-size:12px;color:#54635E;margin-bottom:10px}" +
      ".sr-actions{display:flex;gap:8px;flex-wrap:wrap}" +
      ".sr-btn{font-family:inherit;font-size:13px;padding:7px 11px;border:1px solid #D4DBD7;border-radius:8px;background:#fff;color:#16231F;cursor:pointer}" +
      ".sr-btn:hover{border-color:#16231F}" +
      ".sr-primary{background:#2C6E55;border-color:#2C6E55;color:#fff}" +
      ".sr-primary:hover{background:#1E4D3B;border-color:#1E4D3B}" +
      ".sr-redo{color:#9A3324;border-color:#E3C8C3}" +
      ".sr-msg{font-size:12px;color:#2C6E55;padding:0 12px 10px;min-height:1.2em;opacity:0;transition:opacity .2s}";
    document.head.appendChild(style);

    box = el("div", "sr-w");
    var h = el("div", "sr-h"); h.appendChild(el("span", null, "Suivi de révision"));
    var x = el("button", null, "\u2013"); h.appendChild(x);
    body = el("div", "sr-b");
    msgEl = el("div", "sr-msg");
    box.appendChild(h); box.appendChild(body); box.appendChild(msgEl);
    document.body.appendChild(box);
    paint();

    var collapsed = false;
    x.onclick = function () { collapsed = !collapsed; body.style.display = collapsed ? "none" : "block"; msgEl.style.display = collapsed ? "none" : "block"; x.textContent = collapsed ? "+" : "\u2013"; };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
