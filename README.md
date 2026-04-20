# 🧠 LittleBrain

Lightweight desktop app for Windows to capture notes in 2 seconds.

**thought → shortcut → type → Enter → saved**

---

## Features

- **Quick Capture** — `Ctrl+Shift+Space` brings up the window from anywhere
- **Note cards grid** — clean card view with color-coded statuses
- **Statuses** — `active` (yellow), `done` (green), `archived` (grey)
- **Search & filters** — find notes instantly
- **Reminders** — set a date and time, the app will notify you
- **System tray** — runs in the background, hides to tray instead of closing
- **Local & offline** — no accounts, no cloud, your data stays on your machine

---

## Requirements

- Windows 10 / 11
- Python 3.12+

---

## Installation (dev mode)

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

The executable will be available at `dist/LittleBrain/LittleBrain.exe`.

---

## Project structure

```
LittleBrain/
├── app.py                  # Entry point
├── requirements.txt
├── LittleBrain.spec        # PyInstaller config
├── assets/
│   └── icon.ico
├── core/
│   ├── db.py               # SQLite operations
│   ├── models.py
│   ├── notes_service.py
│   ├── hotkeys.py
│   └── reminders.py
├── ui/
│   ├── webview_app.py      # API backend + tray + hotkey
│   └── web/
│       ├── index.html
│       ├── style.css
│       └── app.js
└── workflow/               # Project documentation
```

---

## Stack

| Layer | Technology |
|---|---|
| GUI | pywebview (HTML/CSS/JS) |
| Backend | Python 3.12 |
| Database | SQLite (local) |
| Tray icon | pystray |
| Global hotkey | keyboard |
| Build | PyInstaller |

---

## License

MIT
