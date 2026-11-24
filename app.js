/* Customer app – simple, big buttons, Gujarati / Hindi / English */
(function () {
  const C = window.APP_CONFIG, I = window.I18N, U = window.GD;

  const sget = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const sset = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const sdel = k => { try { localStorage.removeItem(k); } catch (e) {} };

  let db = U.Store.load();
  let me = sget("gd_me");
  let lang = sget("gd_lang") || C.defaultLang;
  let view = me && db.customers[me] ? "home" : "login";
  let draft = null, pendingMobile = "", amtSel = 1000, notice = null, formErr = "";

  const $ = s => document.querySelector(s);
  const t = k => (I[lang] && I[lang][k]) || I.en[k] || k;
  const nm = o => o[lang] || o.en;
  const rs = n => "₹" + n;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cust = () => db.customers[me];
  const save = () => U.Store.save(db);
  const wa = msg => "https://wa.me/" + C.ownerWhatsApp + "?text=" + encodeURIComponent(msg);

  function toast(msg) {
    const d = document.createElement("div");
    d.className = "toast"; d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }

  function dlabel(date) {
    if (date === U.today()) return t("today");
    if (date === U.addDays(U.today(), 1)) return t("tomorrow");
    const loc = lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    return new Date(date + "T00:00:00").toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "short" });
  }
  const activePause = c => (c.pause && c.pause.to >= U.today() ? c.pause : null);
  const zoneName = id => { const z = C.zones.find(z => z.id === id); return z ? z.name.en : "Other / Waiting list"; };

  function itemLines(items) {
    return Object.entries(items || {}).filter(([, q]) => q > 0).map(([id, q]) => {
      const p = U.P[id];
      return `<div class="row"><div class="pname">${p.emoji} ${esc(nm(p.name))}</div><div><b>× ${q}</b> &nbsp; ${rs(p.price * q)}</div></div>`;
    }).join("");
  }
  function itemText(items) {
    return Object.entries(items || {}).filter(([, q]) => q > 0).map(([id, q]) => `${U.P[id].name.en} x${q}`).join(", ");
  }

  /* ---------- views ---------- */
  function vLogin() {
    return `<div class="card"><h2>${t("welcome")} 🙏</h2><p>${t("tagline")}</p>
      <label for="mob">${t("fMobile")}</label>
      <input id="mob" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" value="${esc(pendingMobile)}">
      ${formErr ? `<div class="err">${formErr}</div>` : ""}
      <button class="btn" data-a="login">${t("btnContinue")} →</button></div>
      <div class="card small">⏰ ${t("deliveryTime")}<br>💸 ${t("mrpNote")}</div>`;
  }

  function vSignup() {
    return `<div class="card"><h2>${t("signupTitle")}</h2><p class="small">${t("signupSub")}</p>
      <label for="nm">${t("fName")}</label><input id="nm" autocomplete="name">
      <label for="zn">${t("fZone")}</label>
      <select id="zn"><option value="">${t("choose")}</option>
        ${C.zones.map(z => `<option value="${z.id}">${esc(nm(z.name))}</option>`).join("")}
        <option value="other">${t("zoneOther")}</option></select>
      <label for="ad">${t("fAddress")}</label><input id="ad" autocomplete="street-address">
      ${formErr ? `<div class="err">${formErr}</div>` : ""}
      <button class="btn" data-a="signup">${t("btnContinue")} →</button></div>`;
  }

  function noticeHtml() {
    if (!notice) return "";
    return `<div class="card warn"><div>${t("waNotice")}</div>
      <a class="btn wa" target="_blank" rel="noopener" href="${wa(notice)}">💬 ${t("waSend")}</a>
      <button class="btn sec" data-a="dismiss">${t("close")}</button></div>`;
  }

  function vHome(c) {
    let h = noticeHtml();
    h += `<h2>${t("hello")}, ${esc(c.name)} 🙏</h2>`;
    if (c.waitlist) h += `<div class="card warn">${t("waitlistMsg")}</div>`;
    const p = activePause(c);
    if (p) h += `<div class="card"><div class="lbl">⏸ ${t("pausedUntil")}</div><div class="big">${dlabel(p.to)}</div>
      <button class="btn sec" data-a="resume">▶ ${t("resume")}</button></div>`;
    const nd = U.nextDelivery(c);
    if (!c.waitlist) {
      if (nd) {
        const tot = U.total(c.order.items);
        h += `<div class="card"><div class="lbl">🚚 ${t("nextDelivery")}</div><div class="big">${dlabel(nd)}</div>
          <div class="small">${t("deliveryTime")}</div>${itemLines(c.order.items)}
          <div class="row"><div class="pname">${t("total")}</div><div class="big">${rs(tot)}</div></div>
          <div class="small">ℹ️ ${t("cutoffInfo")}</div></div>`;
      } else if (!p) {
        h += `<div class="card"><p>${t("noOrder")}</p><button class="btn" data-a="nav" data-v="order">🥛 ${t("changeOrder")}</button></div>`;
      }
    }
    const need = nd ? U.total(c.order.items) * 3 : 0;
    h += `<div class="card"><div class="lbl">💰 ${t("balance")}</div><div class="big ${c.balance < need ? "neg" : "pos"}">${rs(c.balance)}</div>
      ${nd && c.balance < need ? `<div class="err">${t("lowBal")}</div>` : ""}
      <button class="btn" data-a="nav" data-v="wallet">➕ ${t("addMoney")}</button></div>`;
    if (!c.waitlist) h += `<div class="grid2"><button class="btn sec" data-a="nav" data-v="order">🥛 ${t("changeOrder")}</button>
      <button class="btn sec" data-a="nav" data-v="pause">⏸ ${t("pauseDelivery")}</button></div>`;
    return h;
  }

  function vOrder(c) {
    const d = draft;
    const tot = U.total(d.items);
    let h = `<h2>${t("orderTitle")}</h2><div class="card">`;
    C.products.forEach(p => {
      const q = d.items[p.id] || 0;
      h += `<div class="row"><div class="pname">${p.emoji} ${esc(nm(p.name))}<small>${rs(p.price)}</small></div>
        <div class="step"><button data-a="minus" data-id="${p.id}" aria-label="-">−</button><b>${q}</b><button data-a="plus" data-id="${p.id}" aria-label="+">+</button></div></div>`;
    });
    h += `<div class="small" style="margin-top:8px">💸 ${t("mrpNote")}</div></div>`;
    h += `<div class="card"><div class="lbl">${t("howOften")}</div>`;
    [["daily", "daily"], ["alt", "alt"], ["custom", "custom"]].forEach(([k, key]) => {
      h += `<button class="opt ${d.schedule === k ? "on" : ""}" data-a="sched" data-k="${k}">${d.schedule === k ? "✅" : "⚪"} ${t(key)}</button>`;
    });
    if (d.schedule === "custom") {
      h += `<div class="small">${t("pickDays")}</div><div class="chips" style="margin-top:6px">` +
        I.days[lang].map((n, i) => `<button class="chip ${d.days.includes(i) ? "on" : ""}" data-a="day" data-i="${i}">${n}</button>`).join("") + `</div>`;
    }
    h += `</div><div class="card"><div class="row"><div class="pname">${t("perDelivery")}</div><div class="big">${rs(tot)}</div></div>
      ${formErr ? `<div class="err">${formErr}</div>` : ""}
      <button class="btn" data-a="saveorder">💾 ${t("save")}</button></div>`;
    return h;
  }

  function history(c) {
    const rows = [];
    db.recharges.filter(r => r.mobile === c.mobile).forEach(r => rows.push({ ts: r.ts, label: `➕ ${r.status === "approved" ? t("approvedLbl") : r.status === "rejected" ? t("rejectedLbl") : t("pendingLbl")}`, amt: r.amount, pos: r.status === "approved", dim: r.status !== "approved", date: r.date }));
    db.deliveries.filter(d => d.mobile === c.mobile).forEach(d => rows.push({ ts: d.ts, label: `🚚 ${d.status === "skipped" ? t("skipped") : t("delivered")}`, amt: d.status === "skipped" ? 0 : -d.amount, date: d.date }));
    rows.sort((a, b) => b.ts - a.ts);
    if (!rows.length) return `<p class="small">${t("noHistory")}</p>`;
    return rows.slice(0, 25).map(r => `<div class="row"><div>${r.label}<div class="small">${dlabel(r.date)}</div></div>
      <div class="${r.pos ? "pos" : r.amt < 0 ? "neg" : ""}" ${r.dim ? 'style="opacity:.6"' : ""}>${r.amt > 0 ? "+" : r.amt < 0 ? "−" : ""}${rs(Math.abs(r.amt))}</div></div>`).join("");
  }

  function vWallet(c) {
    return noticeHtml() + `<h2>💰 ${t("wTitle")}</h2><div class="card"><div class="lbl">${t("balance")}</div><div class="big pos">${rs(c.balance)}</div></div>
      <div class="card"><div class="lbl">${t("chooseAmt")}</div><div class="chips">
        ${[500, 1000, 1500, 2000].map(a => `<button class="chip ${amtSel === a ? "on" : ""}" data-a="amt" data-n="${a}">${rs(a)}</button>`).join("")}</div>
      <label for="cam">${t("orAmt")}</label><input id="cam" type="tel" inputmode="numeric" maxlength="5" placeholder="₹">
      ${formErr ? `<div class="err">${formErr}</div>` : ""}
      <a class="btn" data-a="upi" href="#">📲 ${t("payUPI")}</a>
      <div class="small" style="margin-top:8px">${t("upiIdLabel")}: <b>${esc(C.upiId)}</b></div>
      <button class="btn out" data-a="paid">✅ ${t("paidBtn")}</button>
      <div class="small" style="margin-top:8px">${t("paidInfo")}</div></div>
      <div class="card"><div class="lbl">${t("historyTitle")}</div>${history(c)}</div>`;
  }

  function vPause(c) {
    const d0 = U.baseDate();
    return `<h2>⏸ ${t("pauseTitle")}</h2><div class="card">
      <label for="pf">${t("pFrom")}</label><input id="pf" type="date" min="${d0}" value="${d0}">
      <label for="pt">${t("pTo")}</label><input id="pt" type="date" min="${d0}" value="${U.addDays(d0, 2)}">
      <div class="small" style="margin-top:8px">${t("pauseInfo")}</div>
      ${formErr ? `<div class="err">${formErr}</div>` : ""}
      <button class="btn" data-a="pausesave">💾 ${t("save")}</button></div>`;
  }

  function vMore(c) {
    return `<h2>${esc(c.name)}</h2><div class="card small">📍 ${esc(c.address)}<br>📱 ${esc(c.mobile)}</div>
      <button class="btn sec" data-a="nav" data-v="pause">⏸ ${t("pauseDelivery")}</button>
      <div class="card" style="margin-top:12px"><div class="lbl">${t("historyTitle")}</div>${history(c)}</div>
      <div class="card"><div class="lbl">${t("help")}</div>
        <a class="btn" href="tel:${esc(C.ownerPhone)}">📞 ${t("call")}</a>
        <a class="btn wa" target="_blank" rel="noopener" href="${wa("Hello " + C.brand + ", I need help. My number: " + c.mobile)}">💬 WhatsApp</a></div>
      <button class="btn bad" data-a="logout">⎋ ${t("logout")}</button>`;
  }

  /* ---------- render ---------- */
  function render() {
    db = U.Store.load();
    document.documentElement.lang = lang;
    const c = cust();
    if (!c && view !== "signup") view = "login";
    $("#hd").innerHTML = `<div class="brand">🥛 ${esc(C.brand)}<small>${esc(C.city)}</small></div>
      <div class="langs">${[["gu", "ગુ"], ["hi", "हि"], ["en", "EN"]].map(([k, n]) => `<button class="${lang === k ? "on" : ""}" data-a="lang" data-k="${k}">${n}</button>`).join("")}</div>`;
    let h = "";
    if (view === "login") h = vLogin();
    else if (view === "signup") h = vSignup();
    else if (view === "home") h = vHome(c);
    else if (view === "order") h = vOrder(c);
    else if (view === "wallet") h = vWallet(c);
    else if (view === "pause") h = vPause(c);
    else h = vMore(c);
    $("#app").innerHTML = h;
    const nav = $("#nav");
    if (c) {
      const hl = view === "pause" ? "more" : view;
      nav.style.display = "flex";
      nav.innerHTML = [["home", "🏠", "navHome"], ["order", "🥛", "navOrder"], ["wallet", "💰", "navWallet"], ["more", "☰", "navMore"]]
        .map(([v, i, k]) => `<button class="${hl === v ? "on" : ""}" data-a="nav" data-v="${v}"><span>${i}</span>${t(k)}</button>`).join("");
    } else nav.style.display = "none";
  }

  function go(v) {
    view = v; formErr = "";
    if (v === "order") {
      const c = cust();
      draft = JSON.parse(JSON.stringify(c.order || { items: {}, schedule: "daily", days: [] }));
      draft.days = draft.days || [];
    }
    render(); window.scrollTo(0, 0);
  }

  /* ---------- actions ---------- */
  const val = id => (document.getElementById(id) || {}).value || "";

  const actions = {
    lang(b) { lang = b.dataset.k; sset("gd_lang", lang); render(); },
    nav(b) { go(b.dataset.v); },
    dismiss() { notice = null; render(); },
    login() {
      const m = val("mob").replace(/\D/g, "");
      pendingMobile = m;
      if (!/^[6-9]\d{9}$/.test(m)) { formErr = t("errMobile"); return render(); }
      if (db.customers[m]) { me = m; sset("gd_me", m); pendingMobile = ""; go("home"); }
      else go("signup");
    },
    signup() {
      const name = val("nm").trim(), zone = val("zn"), addr = val("ad").trim();
      if (!name) { formErr = t("errName"); return render(); }
      if (!zone) { formErr = t("errZone"); return render(); }
      if (!addr) { formErr = t("errAddr"); return render(); }
      const c = { mobile: pendingMobile, name, zone: zone === "other" ? "" : zone, address: addr, waitlist: zone === "other",
        order: null, pause: null, balance: 0, createdAt: Date.now() };
      db.customers[c.mobile] = c; save();
      me = c.mobile; sset("gd_me", me);
      notice = `New ${c.waitlist ? "WAITING-LIST " : ""}customer – ${C.brand}\nName: ${c.name}\nMobile: ${c.mobile}\nArea: ${zoneName(c.zone)}\nAddress: ${c.address}`;
      go(c.waitlist ? "home" : "order");
    },
    plus(b) { draft.items[b.dataset.id] = Math.min(20, (draft.items[b.dataset.id] || 0) + 1); render(); },
    minus(b) { const q = (draft.items[b.dataset.id] || 0) - 1; if (q <= 0) delete draft.items[b.dataset.id]; else draft.items[b.dataset.id] = q; render(); },
    sched(b) { draft.schedule = b.dataset.k; render(); },
    day(b) { const i = +b.dataset.i, k = draft.days.indexOf(i); if (k >= 0) draft.days.splice(k, 1); else draft.days.push(i); render(); },
    saveorder() {
      if (!U.count(draft.items)) { formErr = t("pickOne"); return render(); }
      if (draft.schedule === "custom" && !draft.days.length) { formErr = t("pickDays"); return render(); }
      const c = cust();
      draft.startDate = U.baseDate();
      c.order = draft; save();
      notice = `Order updated – ${C.brand}\n${c.name} (${c.mobile})\n${itemText(draft.items)}\nSchedule: ${draft.schedule}${draft.schedule === "custom" ? " " + draft.days.map(i => I.days.en[i]).join(",") : ""}\nPer delivery: ${rs(U.total(draft.items))}`;
      toast(t("saved")); go("home");
    },
    amt(b) { amtSel = +b.dataset.n; render(); },
    upi(b, e) {
      e.preventDefault();
      const a = parseInt(val("cam"), 10) || amtSel;
      if (a < 100) { formErr = t("errAmt"); return render(); }
      window.location.href = `upi://pay?pa=${encodeURIComponent(C.upiId)}&pn=${encodeURIComponent(C.brand)}&am=${a}&cu=INR&tn=${encodeURIComponent("Milk wallet " + me)}`;
    },
    paid() {
      const a = parseInt(val("cam"), 10) || amtSel;
      if (a < 100) { formErr = t("errAmt"); return render(); }
      const c = cust();
      db.recharges.push({ id: "r" + Date.now(), ts: Date.now(), date: U.today(), mobile: c.mobile, name: c.name, amount: a, status: "pending" });
      save();
      notice = `Wallet recharge – ${C.brand}\n${c.name} (${c.mobile})\nAmount paid: ${rs(a)}\nI am sending the payment screenshot.`;
      render();
    },
    pausesave() {
      const f = val("pf"), to = val("pt");
      if (!f || !to || to < f) { formErr = t("errDates"); return render(); }
      cust().pause = { from: f, to }; save(); toast(t("saved")); go("home");
    },
    resume() { cust().pause = null; save(); render(); },
    logout() { me = null; sdel("gd_me"); view = "login"; render(); }
  };

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    const fn = actions[b.dataset.a];
    if (fn) fn(b, e);
  });

  render();
})();
