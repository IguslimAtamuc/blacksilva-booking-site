# BlackSilva Booking Website

Sistem de booking pentru un singur salon BlackSilva, inspirat vizual din prototipul mobil existent.

## Ce include

- `/client` - website/app pentru clienti in mod telefon;
- `/admin` - website/app de administrare pentru salon;
- API `/api/bookings` pentru salvarea rezervarilor;
- email transactional prin Resend, configurat server-side;
- confirmare cu fisier calendar `.ics`;
- statusuri admin: confirmed, completed, cancelled, no-show;
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

Fara storage persistent configurat, Vercel foloseste fallback temporar in `/tmp`, bun pentru demo dar nu pentru productie.
