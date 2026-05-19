# BlackSilva Booking Website

Sistem de booking pentru un singur salon BlackSilva, inspirat vizual din prototipul mobil existent.
Interfata este adaptata intr-un stil dark, rotunjit, watchOS/Boro UI inspired, optimizat pentru telefon.

## Ce include

- `/client` - website/app pentru clienti in mod telefon;
- `/admin` - website/app de administrare pentru salon;
- API `/api/bookings` pentru salvarea rezervarilor;
- API `/api/client-bookings?email=` pentru calendarul clientului;
- email transactional prin Resend, configurat server-side;
- status email pe fiecare rezervare si retry din admin;
- reminder email manual din admin;
- confirmare cu fisier calendar `.ics` care include alarma cu 1 ora inainte;
- statusuri admin: confirmed, completed, cancelled, no-show;
- dashboard admin cu calendar, customer database, performance summary, sales summary si stock produse;
- shop online demo, produs atasat la booking, chair rental si plata demo/Stripe-ready;
- build pregatit pentru Vercel Functions.

## Rulare locala

```bash
npm install
npm run dev:full
```

Preview local:

```text
http://127.0.0.1:4173/client
http://127.0.0.1:4173/admin
```

## Configurare productie

Seteaza variabilele din `.env.example` in Vercel:

- `RESEND_API_KEY` - cheia Resend pentru trimiterea emailurilor;
- `RESEND_FROM` - expeditorul, de exemplu `BlackSilva <booking@domeniul-tau.com>`;
- `ADMIN_EMAIL` - emailul salonului care primeste notificari;
- `ADMIN_ACCESS_CODE` - codul pentru accesul admin;
- optional `GITHUB_DATA_REPO`, `GITHUB_DATA_PATH`, `GITHUB_TOKEN` pentru stocare persistenta intr-un repo privat de date.
- optional `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY` pentru conectarea platilor reale Stripe. In preview, plata `Card demo` marcheaza rezervarea ca demo paid fara sa proceseze carduri reale.

Fara storage persistent configurat, Vercel foloseste fallback temporar in `/tmp`, bun pentru demo dar nu pentru productie.

Admin-ul poate retrimite emailul de confirmare pentru orice rezervare. Daca `RESEND_API_KEY` lipseste, statusul ramane `Resend neconfigurat` si rezervarea nu se pierde.
