# BlackSilva Booking Website

Website de booking pentru un singur salon BlackSilva, inspirat vizual din prototipul mobil existent.

## Ce include

- selectie servicii, specialist, data si ora;
- date client si optiuni extra;
- confirmare cu fisier calendar `.ics`;
- salvare programari in `localStorage` pentru preview;
- sectiune de agenda pentru owner/demo;
- build static pregatit pentru GitHub Pages.

## Rulare locala

```bash
npm install
npm run dev
```

Preview local:

```text
http://127.0.0.1:5173/
```

## Publicare

Repo-ul include workflow-ul `.github/workflows/pages.yml`. Dupa push pe GitHub, seteaza GitHub Pages la `GitHub Actions` din repository settings, iar workflow-ul va publica automat build-ul Vite.
