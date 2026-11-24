/* ==========================================================
   EDIT THIS FILE FIRST  (only this file needs your details)
   ========================================================== */
window.APP_CONFIG = {
  brand: "GharAngan",              // change to your final brand name
  city: "Mehsana",
  defaultLang: "gu",               // gu = Gujarati, hi = Hindi, en = English

  ownerWhatsApp: "918200499104",   // country code + number, no + sign  (CHANGE THIS)
  ownerPhone: "+918200499104",     // shown on the "Call us" button     (CHANGE THIS)
  upiId: "jeetpateljp2612@okhdfcbank",           // your business UPI ID               (CHANGE THIS)
  adminPin: "1234",                // PIN for /admin panel               (CHANGE THIS)

  cutoffHour: 13,                  // orders lock at 1:00 PM for same-day delivery
  costFactor: 0.945,               // wholesale cost = MRP x 0.945 (~5.5% distributor margin)

  // Prices = shop MRP. Check against the real pouch MRP and edit.
  products: [
    { id: "gold1",    emoji: "🥛", price: 74, name: { en: "Amul Gold – 1 Litre",   gu: "અમૂલ ગોલ્ડ – 1 લિટર",   hi: "अमूल गोल्ड – 1 लीटर" } },
    { id: "gold500",  emoji: "🥛", price: 37, name: { en: "Amul Gold – 500 ml",    gu: "અમૂલ ગોલ્ડ – 500 મિલી",  hi: "अमूल गोल्ड – 500 मिली" } },
    { id: "shakti1",  emoji: "🥛", price: 62, name: { en: "Amul Shakti – 1 Litre", gu: "અમૂલ શક્તિ – 1 લિટર",   hi: "अमूल शक्ति – 1 लीटर" } },
    { id: "shakti500",emoji: "🥛", price: 31, name: { en: "Amul Shakti – 500 ml",  gu: "અમૂલ શક્તિ – 500 મિલી",  hi: "अमूल शक्ति – 500 मिली" } },
    { id: "taaza1",   emoji: "🥛", price: 58, name: { en: "Amul Taaza – 1 Litre",  gu: "અમૂલ તાજા – 1 લિટર",    hi: "अमूल ताज़ा – 1 लीटर" } },
    { id: "taaza500", emoji: "🥛", price: 29, name: { en: "Amul Taaza – 500 ml",   gu: "અમૂલ તાજા – 500 મિલી",   hi: "अमूल ताज़ा – 500 मिली" } },
    { id: "chhas",    emoji: "🥤", price: 20, name: { en: "Amul Chhas – 650 ml",   gu: "અમૂલ છાશ – 650 મિલી",   hi: "अमूल छाछ – 650 मिली" } }
  ],

  // The 3 launch zones from the plan. Anything else goes to the waiting list.
  zones: [
    { id: "radhanpur", name: { en: "Radhanpur Road – Tirupati Nagar & societies", gu: "રાધનપુર રોડ – તિરુપતિ નગર અને સોસાયટીઓ", hi: "राधनपुर रोड – तिरुपति नगर और सोसायटी" } },
    { id: "modhera",   name: { en: "Modhera Road – Human Kalyan Society area",   gu: "મોઢેરા રોડ – હ્યુમન કલ્યાણ સોસાયટી વિસ્તાર", hi: "मोढेरा रोड – ह्यूमन कल्याण सोसायटी इलाका" } },
    { id: "highway",   name: { en: "Highway side – Mehsana–Ahmedabad Highway apartments", gu: "હાઇવે વિસ્તાર – મહેસાણા–અમદાવાદ હાઇવે એપાર્ટમેન્ટ", hi: "हाईवे इलाका – मेहसाणा–अहमदाबाद हाईवे अपार्टमेंट" } }
  ]
};
