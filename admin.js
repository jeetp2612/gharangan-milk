/* Owner / driver panel. PIN is a simple client-side lock (see README). */
(function () {
  const C = window.APP_CONFIG, U = window.GD;
  const $ = s => document.querySelector(s);
  const rs = n => "₹" + Math.round(n).toLocaleString("en-IN");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let db = U.Store.load();
  let tab = "demand";
  let date = U.baseDate();
  let authed = false;
  try { authed = sessionStorage.getItem("gd_admin") === "1"; } catch (e) {}

  const zoneName = id => { const z = C.zones.find(z => z.id === id); return z ? z.name.en : "Waiting list / other"; };
  const save = () => U.Store.save(db);
  const itemText = items => Object.entries(items || {}).filter(([, q]) => q > 0).map(([id, q]) => `${U.P[id].name.en} ×${q}`).join(", ");
  const pending = () => db.recharges.filter(r => r.status === "pending");
  const dayCustomers = () => Object.values(db.customers).filter(c => U.isDeliveryDay(c, date));
  const logFor = (m) => db.deliveries.find(d => d.mobile === m && d.date === date);

  function gate() {
    return `<div class="card"><h2>🔒 PIN</h2><input id="pin" type="password" inputmode="numeric" placeholder="PIN">
      <div id="perr" class="err"></div><button class="btn" data-a="login">Open</button></div>`;
  }

  function header() {
    const n = pending().length;
    return `<div class="card noprint"><label for="dt" style="margin-top:0">Delivery date</label>
      <input id="dt" type="date" value="${date}" data-a="date">
      <div class="tabs">
        <button class="${tab === "demand" ? "on" : ""}" data-a="tab" data-t="demand">📦 Demand</button>
        <button class="${tab === "route" ? "on" : ""}" data-a="tab" data-t="route">🚚 Route sheet</button>
        <button class="${tab === "wallet" ? "on" : ""}" data-a="tab" data-t="wallet">💰 Wallet${n ? ` (${n})` : ""}</button>
        <button class="${tab === "cust" ? "on" : ""}" data-a="tab" data-t="cust">👥 Customers</button>
      </div></div>`;
  }

  function demand() {
    const cs = dayCustomers();
    const tot = {}; let rev = 0;
    cs.forEach(c => Object.entries(c.order.items).forEach(([id, q]) => { tot[id] = (tot[id] || 0) + q; rev += U.P[id].price * q; }));
    const cost = rev * C.costFactor;
    const byZone = {}; cs.forEach(c => (byZone[c.zone] = (byZone[c.zone] || 0) + 1));
    return `<div class="card"><h2>Crates / pouches to prepare for ${date}</h2>
      <p class="small">Orders lock at ${C.cutoffHour}:00. Stage these in the cold storage by 2:00 PM.</p>
      <table><tr><th>Item</th><th>Pouches</th></tr>
      ${C.products.filter(p => tot[p.id]).map(p => `<tr><td>${esc(p.name.en)}</td><td><b>${tot[p.id]}</b></td></tr>`).join("") || '<tr><td colspan="2">No deliveries for this date</td></tr>'}</table></div>
      <div class="card"><table>
        <tr><td>Stops (customers)</td><td><b>${cs.length}</b></td></tr>
        <tr><td>Sales value (MRP)</td><td><b>${rs(rev)}</b></td></tr>
        <tr><td>Estimated purchase cost (${Math.round(C.costFactor * 1000) / 10}% of MRP)</td><td>${rs(cost)}</td></tr>
        <tr><td>Estimated gross profit</td><td><b>${rs(rev - cost)}</b></td></tr></table>
        <p class="small">By zone: ${Object.entries(byZone).map(([z, n]) => `${esc(zoneName(z))}: ${n}`).join(" · ") || "-"}</p></div>`;
  }

  function route() {
    const cs = dayCustomers();
    const logged = db.deliveries.filter(d => d.date === date).map(d => db.customers[d.mobile]).filter(Boolean);
    const all = Array.from(new Set(cs.concat(logged)));
    let h = `<div class="card"><h2>Route sheet – ${date}</h2><button class="btn sec sm noprint" data-a="print">🖨 Print</button>
      <div class="small">Tap Delivered after handing over. Amount is cut from the customer wallet.</div></div>`;
    const zones = Array.from(new Set(all.map(c => c.zone)));
    zones.forEach(z => {
      h += `<div class="card"><h2>📍 ${esc(zoneName(z))}</h2><table><tr><th>Customer</th><th>Order</th><th>Amt</th><th></th></tr>`;
      all.filter(c => c.zone === z).sort((a, b) => a.address.localeCompare(b.address)).forEach(c => {
        const lg = logFor(c.mobile);
        const items = lg ? lg.items : itemText(c.order && c.order.items);
        const amt = lg ? lg.amount : U.total(c.order.items);
        const low = c.balance < amt;
        let act;
        if (lg) act = `<span class="tag ${lg.status === "skipped" ? "red" : ""}">${lg.status === "skipped" ? "Skipped" : "Delivered ✓"}</span>`;
        else act = `<button class="btn sm" data-a="deliver" data-m="${c.mobile}">Delivered</button><button class="btn sm bad" data-a="skip" data-m="${c.mobile}">Skip</button>`;
        h += `<tr><td><b>${esc(c.name)}</b><br>${esc(c.address)}<br><a href="tel:${esc(c.mobile)}">${esc(c.mobile)}</a></td>
          <td>${esc(items)}</td><td>${rs(amt)}<br>${low && !lg ? '<span class="tag red">Low wallet</span>' : `<span class="small">bal ${rs(c.balance)}</span>`}</td><td>${act}</td></tr>`;
      });
      h += `</table></div>`;
    });
    return h + (all.length ? "" : `<div class="card">No deliveries for this date.</div>`);
  }

  function wallet() {
    const p = pending();
    let h = `<div class="card"><h2>Waiting for approval</h2>`;
    if (!p.length) h += `<p class="small">Nothing pending.</p>`;
    else h += `<table><tr><th>Customer</th><th>Amount</th><th></th></tr>` + p.map(r => `<tr><td><b>${esc(r.name)}</b><br>${esc(r.mobile)}<br><span class="small">${r.date}</span></td><td><b>${rs(r.amount)}</b></td>
      <td><button class="btn sm" data-a="approve" data-id="${r.id}">Approve</button><button class="btn sm bad" data-a="reject" data-id="${r.id}">Reject</button></td></tr>`).join("") + `</table>`;
    h += `<p class="small">Approve only after you see the money in your bank/UPI app.</p></div>
      <div class="card"><h2>Add cash to a wallet</h2><label for="cm">Customer mobile</label><input id="cm" type="tel" maxlength="10">
      <label for="ca">Amount</label><input id="ca" type="tel" maxlength="6"><button class="btn" data-a="cash">Add to wallet</button></div>`;
    return h;
  }

  function cust() {
    const cs = Object.values(db.customers).sort((a, b) => b.createdAt - a.createdAt);
    return `<div class="card"><h2>Customers (${cs.length})</h2>
      <button class="btn sec sm" data-a="export">⬇ Backup (JSON)</button>
      <label class="btn sec sm" style="display:inline-block;margin-top:6px">⬆ Restore<input id="imp" type="file" accept=".json" style="display:none"></label>
      <table style="margin-top:10px"><tr><th>Customer</th><th>Area</th><th>Wallet</th><th>Status</th></tr>
      ${cs.map(c => `<tr><td><b>${esc(c.name)}</b><br>${esc(c.address)}<br><a href="tel:${esc(c.mobile)}">${esc(c.mobile)}</a></td><td>${esc(zoneName(c.zone))}</td><td>${rs(c.balance)}</td>
      <td>${c.waitlist ? '<span class="tag red">Waitlist</span>' : c.pause && c.pause.to >= U.today() ? '<span class="tag">Paused</span>' : c.order ? '<span class="tag">Active</span>' : '<span class="tag red">No order</span>'}</td></tr>`).join("") || '<tr><td colspan="4">No customers yet</td></tr>'}</table></div>`;
  }

  function render() {
    db = U.Store.load();
    if (!authed) { $("#app").innerHTML = gate(); return; }
    $("#app").innerHTML = header() + ({ demand, route, wallet, cust }[tab])();
  }

  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name; a.click();
  }

  const actions = {
    login() {
      if ((document.getElementById("pin").value || "") === C.adminPin) {
        authed = true; try { sessionStorage.setItem("gd_admin", "1"); } catch (e) {} render();
      } else $("#perr").textContent = "Wrong PIN";
    },
    tab(b) { tab = b.dataset.t; render(); },
    print() { window.print(); },
    deliver(b) {
      const c = db.customers[b.dataset.m], amt = U.total(c.order.items);
      c.balance -= amt;
      db.deliveries.push({ id: "d" + Date.now(), ts: Date.now(), date, mobile: c.mobile, amount: amt, items: itemText(c.order.items), status: "delivered" });
      save(); render();
    },
    skip(b) {
      const c = db.customers[b.dataset.m];
      db.deliveries.push({ id: "d" + Date.now(), ts: Date.now(), date, mobile: c.mobile, amount: U.total(c.order.items), items: itemText(c.order.items), status: "skipped" });
      save(); render();
    },
    approve(b) {
      const r = db.recharges.find(x => x.id === b.dataset.id);
      if (!r || r.status !== "pending") return;
      r.status = "approved"; db.customers[r.mobile].balance += r.amount; save(); render();
    },
    reject(b) { const r = db.recharges.find(x => x.id === b.dataset.id); if (r) { r.status = "rejected"; save(); render(); } },
    cash() {
      const m = document.getElementById("cm").value.trim(), a = parseInt(document.getElementById("ca").value, 10);
      if (!db.customers[m] || !(a > 0)) return alert("Check mobile number and amount");
      db.customers[m].balance += a;
      db.recharges.push({ id: "r" + Date.now(), ts: Date.now(), date: U.today(), mobile: m, name: db.customers[m].name, amount: a, status: "approved" });
      save(); render();
    },
    export() { download("gharangan-backup-" + U.today() + ".json", JSON.stringify(db)); }
  };

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-a]");
    if (b && b.tagName !== "INPUT" && actions[b.dataset.a]) actions[b.dataset.a](b);
  });
  document.addEventListener("change", e => {
    if (e.target.id === "dt") { date = e.target.value || date; render(); }
    if (e.target.id === "imp" && e.target.files[0]) {
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const d = JSON.parse(fr.result);
          if (!d.customers) throw 0;
          if (confirm("Replace current data on this device with the backup?")) { U.Store.save(d); render(); }
        } catch (x) { alert("Invalid backup file"); }
      };
      fr.readAsText(e.target.files[0]);
    }
  });

  render();
})();
