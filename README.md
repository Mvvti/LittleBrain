# 🧠 LittleBrain

Lekka aplikacja desktopowa na Windows do błyskawicznego zapisywania notatek.

**myśl → skrót → wpis → Enter → zapis (2 sekundy)**

---

## Funkcje

- **Quick Capture** — skrót `Ctrl+Shift+Space` przywołuje okno z dowolnego miejsca
- **Siatka notatek** — przejrzysty widok kart z kolorami wg statusu
- **Statusy** — `active` (żółty), `done` (zielony), `archived` (szary)
- **Wyszukiwarka i filtry** — szybkie znajdowanie notatek
- **Przypomnienia** — ustaw datę i godzinę, aplikacja przypomni w odpowiednim czasie
- **Tray icon** — działa w tle, chowa się do zasobnika zamiast zamykać
- **Lokalnie i offline** — żadnych kont, żadnej chmury, dane tylko na Twoim komputerze

---

## Wymagania

- Windows 10 / 11
- Python 3.12+

---

## Instalacja (tryb developerski)

```bash
git clone https://github.com/TWOJA_NAZWA/LittleBrain.git
cd LittleBrain

python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

---

## Build (.exe)

```bash
pip install pyinstaller
python -m PyInstaller LittleBrain.spec
```

Plik wykonywalny pojawi się w `dist/LittleBrain/LittleBrain.exe`.

---

## Struktura projektu

```
LittleBrain/
├── app.py                  # Entry point
├── requirements.txt
├── LittleBrain.spec        # Konfiguracja PyInstaller
├── assets/
│   └── icon.ico
├── core/
│   ├── db.py               # SQLite — operacje na bazie
│   ├── models.py
│   ├── notes_service.py
│   ├── hotkeys.py
│   └── reminders.py
├── ui/
│   ├── webview_app.py      # Backend API + tray + hotkey
│   └── web/
│       ├── index.html
│       ├── style.css
│       └── app.js
└── workflow/               # Dokumentacja projektu
```

---

## Stack

| Warstwa | Technologia |
|---|---|
| GUI | pywebview (HTML/CSS/JS) |
| Backend | Python 3.12 |
| Baza danych | SQLite (lokalna) |
| Tray icon | pystray |
| Skróty klawiszowe | keyboard |
| Build | PyInstaller |

---

## Licencja

MIT
