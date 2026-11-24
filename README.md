# GharAngan – Daily Milk Delivery Web App (Mehsana)

A simple Gujarati / Hindi / English web app for daily milk subscriptions, built from your business plan
(evening delivery 4–8 PM, 1:00 PM order lock, prepaid UPI wallet, 3 launch zones, waiting list for other areas).

No build step, no database, no npm. Just static files, so it deploys on Vercel in about 2 minutes.

## What is inside

| File | What it does |
|---|---|
| `index.html`, `app.js`, `styles.css` | Customer app: sign-up, choose items, daily / alternate / custom days, wallet, pause |
| `admin.html`, `admin.js` | Owner / driver panel at `/admin`: crates to prepare, route sheet, wallet approvals, customers |
| `config.js` | **Your details**: brand, WhatsApp, UPI ID, admin PIN, prices, zones |
| `i18n.js` | All Gujarati / Hindi / English text |
| `common.js` | Shared logic (delivery days, totals, cut-off) |
| `vercel.json` | Vercel settings (clean `/admin` URL, basic security headers) |

## Step 1 – Edit `config.js` (5 minutes)

Change these four lines first:

```js
ownerWhatsApp: "8200499104",   // your WhatsApp, country code first, no +
ownerPhone: "+918200499104",
upiId: "yourname@upi",           // your business UPI ID
adminPin: "1234",                // your own PIN for /admin
```

Also check `products` prices against the real pouch MRP, and change `brand` to your final name.

## Step 2 – Test on your computer

Double-click `index.html`, or run `npx serve` in this folder and open the link it shows.

## Step 3 – Deploy on Vercel

### Option A – GitHub (recommended)
1. Create a free account on github.com and make a new repository, e.g. `gharangan-milk`.
2. Upload all files from this folder into it (Add file → Upload files).
3. Go to vercel.com → sign in with GitHub → **Add New… → Project** → import your repository.
4. Framework Preset: **Other**. Leave Build Command and Output Directory empty. Click **Deploy**.
5. In about a minute you get a link like `gharangan-milk.vercel.app`. The admin panel is at `/admin`.

Every time you edit a file on GitHub, Vercel updates the site automatically.

### Option B – Vercel CLI
```bash
npm i -g vercel
cd gharangan-milk
vercel          # first time: answer the questions, accept defaults
vercel --prod   # publish to the live link
```

### Custom domain (optional)
Vercel → your project → Settings → Domains → add your domain and follow the DNS steps.

## How you run daily operations (pilot with first customers)

1. Customer signs up. The app opens a ready WhatsApp message to you with their details.
2. Customer taps **Add money** → pays by UPI → taps **I have paid** → sends the screenshot on WhatsApp.
3. You check your bank/UPI app, then approve it in `/admin` → **Wallet**.
4. Before 2:00 PM open `/admin` → **Demand** to see exactly how many pouches to stage.
5. Drivers use **Route sheet** and tap **Delivered**; the amount is cut from the wallet.

## Important limits of this version (please read)

- **Data is stored in the browser of each device** (no server yet). A customer's sign-up lives on
  their phone; the admin panel only sees customers stored on the device where it is open. The WhatsApp
  messages are what carry information to you. This is fine for a small pilot, **not** for real scale.
  Use **Backup / Restore** in the admin panel to move data between devices.
- **No OTP login.** Anyone who knows a customer's mobile number can open that customer's screen on their own
  device. The `/admin` PIN is also only a simple lock, not real security (it is visible in `config.js`).
- Wallet deduction happens when the driver taps Delivered, not automatically.

## Next upgrade (when the pilot works)

Add a real backend so all phones and the admin see the same data: **Supabase** (free tier) for the
database + login, **MSG91** for OTP, and a UPI payment gateway/merchant API for automatic wallet top-up.
The screens and logic here can be reused; only the storage layer in `common.js` / `app.js` changes.

## Before you launch

You still need an FSSAI licence, GST/business registration, and an agreement with the dairy
distributor. Keep MRP-matched pricing as in your plan.
# gharangan-milk
