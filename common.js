/* Shared logic used by the customer app and the admin panel */
(function () {
  const C = window.APP_CONFIG;
  const KEY = "gd_db";

  const Store = {
    load() {
      try {
        const d = JSON.parse(localStorage.getItem(KEY));
        if (d && d.customers) return d;
      } catch (e) {}
      return { customers: {}, recharges: [], deliveries: [] };
    },
    save(db) {
      try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    }
  };

  const pad = n => String(n).padStart(2, "0");
  const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
  const weekdayMon0 = s => (new Date(s + "T00:00:00").getDay() + 6) % 7;

  const P = {};
  C.products.forEach(p => (P[p.id] = p));

  const total = items =>
    Object.entries(items || {}).reduce((s, [id, q]) => s + (P[id] ? P[id].price * q : 0), 0);
  const count = items => Object.values(items || {}).reduce((a, b) => a + b, 0);

  // Orders placed before the cut-off count for today, after it for tomorrow.
  const baseDate = () => (new Date().getHours() < C.cutoffHour ? today() : addDays(today(), 1));

  function isDeliveryDay(c, date) {
    if (!c || c.waitlist || !c.order) return false;
    const o = c.order;
    if (!count(o.items)) return false;
    if (c.pause && date >= c.pause.from && date <= c.pause.to) return false;
    if (date < o.startDate) return false;
    if (o.schedule === "alt") {
      const diff = Math.round((new Date(date + "T00:00:00") - new Date(o.startDate + "T00:00:00")) / 864e5);
      return diff % 2 === 0;
    }
    if (o.schedule === "custom") return (o.days || []).includes(weekdayMon0(date));
    return true;
  }

  function nextDelivery(c) {
    const start = baseDate();
    for (let i = 0; i < 40; i++) {
      const d = addDays(start, i);
      if (isDeliveryDay(c, d)) return d;
    }
    return null;
  }

  window.GD = { Store, iso, today, addDays, weekdayMon0, P, total, count, baseDate, isDeliveryDay, nextDelivery };
})();
