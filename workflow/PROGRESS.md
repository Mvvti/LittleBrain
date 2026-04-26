# PROGRESS.md — Historia postępu projektu LittleBrain

---

## Etap 1 — MVP (Quick Capture + SQLite)
- Status: ✅ ukończony
- Co zostało zrobione: popup okno, pole tekstowe, zapis do SQLite, walidacja pustych notatek
- Pliki zmienione: `app.py`, `core/db.py`, `core/models.py`
- Następny etap: UX popupu

---

## Etap 2 — UX popupu
- Status: ✅ ukończony
- Co zostało zrobione: always on top, autofocus, czyszczenie pola po zapisie
- Pliki zmienione: `ui/quick_capture.py`
- Następny etap: Lista notatek

---

## Etap 3 — Lista notatek
- Status: ✅ ukończony
- Co zostało zrobione: główne okno z listą notatek, sortowanie od najnowszych
- Pliki zmienione: `ui/main_window.py`
- Następny etap: Wyszukiwanie i filtry

---

## Etap 4 — Wyszukiwanie i filtry
- Status: ✅ ukończony
- Co zostało zrobione: wyszukiwanie po treści, filtry: all / active / done / archived / with_reminder
- Pliki zmienione: `core/db.py`, `ui/main_window.py`
- Następny etap: Globalny skrót klawiszowy

---

## Etap 5 — Globalny skrót klawiszowy
- Status: ✅ ukończony
- Co zostało zrobione: Ctrl+Shift+Space przywołuje okno aplikacji (ctypes FindWindowW + ShowWindow)
- Pliki zmienione: `ui/webview_app.py`
- Następny etap: Przypomnienia

---

## Etap 6 — Przypomnienia
- Status: ✅ ukończony
- Co zostało zrobione: scheduler w osobnym wątku (co 60s), showReminder() w JS, remind_at w bazie
- Pliki zmienione: `ui/webview_app.py`, `core/db.py`, `ui/web/app.js`
- Następny etap: Statusy notatek

---

## Etap 7 — Statusy notatek
- Status: ✅ ukończony
- Co zostało zrobione: statusy active/done/archived, zmiana statusu przez przyciski na kartach
- Pliki zmienione: `core/db.py`, `ui/web/app.js`, `ui/web/style.css`
- Następny etap: Przepisanie UI na pywebview

---

## Etap 8 — Przepisanie UI na pywebview
- Status: ✅ ukończony
- Co zostało zrobione: porzucenie tkinter, nowy frontend HTML/CSS/JS, backend API w klasie Api
- Pliki zmienione: `ui/webview_app.py`, `ui/web/index.html`, `ui/web/style.css`, `ui/web/app.js`, `app.py`
- Następny etap: Tray icon

---

## Etap 9 — Tray icon
- Status: ✅ ukończony
- Co zostało zrobione: ikona pystray w zasobniku, chowanie do traya przez X, menu Pokaż/Zakończ
- Pliki zmienione: `ui/webview_app.py`, `requirements.txt`, `assets/icon.ico`
- Następny etap: Build .exe

---

## Etap 10 — Build .exe
- Status: ✅ ukończony
- Co zostało zrobione: PyInstaller onedir + windowed, LittleBrain.spec, runtime paths dla dev i .exe
- Pliki zmienione: `LittleBrain.spec`, `app.py`, `ui/webview_app.py`, `requirements.txt`
- Następny etap: —

---

## Poprawki po buildzie

### Ikona na pasku zadań Windows
- Status: ✅ ukończony
- Co zostało zrobione: AppUserModelID + WM_SETICON przez ctypes
- Pliki zmienione: `app.py`, `ui/webview_app.py`

### Single instance (jedna instancja aplikacji)
- Status: ✅ ukończony
- Co zostało zrobione: named mutex przez WinDLL z use_last_error=True
- Pliki zmienione: `app.py`

---

## Znane bugi (do naprawy)

| # | Priorytet | Opis |
|---|-----------|------|
| 1 | ✅ | `created_at` zapisywane w UTC zamiast czasu lokalnego |
| 2 | ✅ | XSS — treść notatki wstrzykiwana przez `innerHTML` |
| 3 | ✅ | Brak klawisza Enter do zapisywania notatek w modalach |
| 4 | ✅ | Brak Escape do zamykania modali |
| 5 | ✅ | `_set_window_icon()` blokuje wątek przez `time.sleep(0.5)` |
| 6 | ✅ | Filtr `with_reminder` pokazuje notatki z już pokazanym przypomnieniem |

---

## Sesja — ulepszenia UX i nowe funkcje

### Lewy klik na ikonę w trayu
- Status: ✅ ukończony
- Co zostało zrobione: `default=True` na MenuItem "Pokaż" w pystray
- Pliki zmienione: `ui/webview_app.py`

### Skrót Ctrl+N — nowa notatka
- Status: ✅ ukończony
- Co zostało zrobione: obsługa Ctrl+N w handleModalKeyboard(), otwiera modal nowej notatki
- Pliki zmienione: `ui/web/app.js`

### Liczniki przy filtrach
- Status: ✅ ukończony
- Co zostało zrobione: get_notes_counts() w db.py, get_counts() w Api, updateFilterCounts() w JS
- Pliki zmienione: `core/db.py`, `ui/webview_app.py`, `ui/web/app.js`

### Ikonka 🔔 na kartach z przypomnieniem
- Status: ✅ ukończony
- Co zostało zrobione: has_reminder w API, ikonka warunkowa w renderCards(), styl .reminder-icon
- Pliki zmienione: `core/db.py`, `ui/webview_app.py`, `ui/web/app.js`, `ui/web/style.css`

### Potwierdzenie niezapisanych zmian w modalu edycji
- Status: ✅ ukończony
- Co zostało zrobione: originalEditContent, hasUnsavedChanges(), confirm() przed zamknięciem
- Pliki zmienione: `ui/web/app.js`

### Ctrl+Z — cofnięcie zmian w modalu edycji
- Status: ✅ ukończony
- Co zostało zrobione: obsługa Ctrl+Z w handleModalKeyboard(), przywrócenie originalEditContent
- Pliki zmienione: `ui/web/app.js`

### Sortowanie kart
- Status: ✅ ukończony
- Co zostało zrobione: dropdown #sort w toolbarze, sort_by w fetch_notes(), 3 opcje sortowania
- Pliki zmienione: `ui/web/index.html`, `ui/web/app.js`, `ui/webview_app.py`, `core/db.py`

### Ciemny motyw (dark mode)
- Status: ✅ ukończony
- Co zostało zrobione: zmienne CSS, body.dark, przełącznik 🌙/☀️, zapamiętywanie w localStorage
- Pliki zmienione: `ui/web/index.html`, `ui/web/style.css`, `ui/web/app.js`

---

## Sesja — naprawa bugów i refactor

### Bugi naprawione
| # | Opis | Pliki |
|---|------|-------|
| 1 | Popup przypomnienia nie obsługiwał dark mode | `app.js`, `style.css` |
| 2 | Escape zamykał modal nowej notatki bez czyszczenia pól | `app.js` |
| 3 | `STATUS_COLORS` — martwy kod | `app.js` |
| 4 | `alert()` w Ctrl+Z zastąpiony toastem | `app.js`, `style.css` |
| 5 | "za miesiąc" dodawało zawsze 30 dni zamiast używać setMonth | `app.js` |
| 6 | `resetCaptureFields()` wywoływana dwa razy po zapisaniu notatki | `app.js` |
| 7 | Trailing spaces powodowały fałszywy confirm po zapisaniu notatki | `app.js` |

### Refactor kodu
- Status: ✅ ukończony
- Co zostało zrobione:
  - `app.js` — pogrupowano funkcje sekcjami, usunięto redundancje
  - `webview_app.py` — pogrupowano funkcje sekcjami
  - `db.py` — pogrupowano funkcje sekcjami, ujednolicono styl `get_connection()`
- Pliki zmienione: `ui/web/app.js`, `ui/webview_app.py`, `core/db.py`

---

## Plan rozwoju — kolejne funkcje

### Runda 1 — szybkie i widoczne
- [x] Puste stany (komunikat gdy brak notatek)
- [x] Podgląd daty przypomnienia na karcie
- [x] Skrót Ctrl+F — focus na wyszukiwarce

### Runda 2 — funkcjonalność
- [x] Edycja przypomnienia w istniejącej notatce
- [x] Notatki przypięte (pinned)
- [x] Licznik znaków w modalu edycji

### Animacje i splash screen
- [x] Animacje kart, modali, toastów, hover efekty
- [x] Splash screen przy starcie aplikacji

### Runda 2.5 — dodatki po Rundzie 2
- [x] Przycisk "Usuń przypomnienie" w modalu edycji

### Runda 3 — większe
- [ ] Widok listy jako alternatywa dla siatki
- [ ] Animacje kart
- [ ] Statystyki
- [ ] Tagi / masowe operacje
