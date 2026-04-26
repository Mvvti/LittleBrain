# 🧠 LittleBrain — Quick Notes / Second Brain Lite (Windows, Python)

## 🎯 Cel aplikacji

LittleBrain to lekka aplikacja desktopowa na Windows, która umożliwia błyskawiczne zapisywanie notatek oraz zarządzanie nimi (lista, statusy, przypomnienia).

Aplikacja ma działać lokalnie (offline) i być maksymalnie szybka w użyciu:

**myśl → skrót → wpis → Enter → zapis (2 sekundy)**

---

## Zaimplementowane (stan aktualny)

### UI przepisane na pywebview

* stary kod `tkinter`/`customtkinter` usunięty
* frontend: HTML/CSS/JS w `ui/web/` (`index.html`, `style.css`, `app.js`)
* backend API: `ui/webview_app.py` (klasa `Api`)
* `app.py` wywołuje `run_webview_app()`

### Funkcje w nowym UI

* siatka kart 3 kolumny, kolory wg statusu:
  * `active` = żółty
  * `done` = zielony
  * `archived` = szary
* dodawanie notatek: modal popup z dropdownami daty
* edycja notatek: kliknięcie w kartę otwiera modal
* usuwanie notatek: przycisk `🗑️` po najechaniu
* zmiana statusu: przyciski `✓` `📦` `↩` po najechaniu na kartę
* wyszukiwarka i filtry w toolbarze
* hotkey `Ctrl+Shift+Space`: przywraca okno (`ctypes` `FindWindowW` + `ShowWindow`)
* scheduler przypomnień: osobny wątek, co 60s, `showReminder()` w JS
* Python 3.12, `venv` w `.venv/`

## Co zostało do zrobienia

* tray icon (`pystray`) — chowanie do tray zamiast zamykania
* build `.exe` (`PyInstaller`)

## ⚙️ Stack technologiczny

* Python 3.11+
* GUI: tkinter
* Baza danych: SQLite (lokalna)
* Globalne skróty: keyboard (lub alternatywa)
* Powiadomienia: win10toast lub plyer
* Opcjonalnie:

  * pystray (ikona w trayu)
* Build: PyInstaller (.exe)

---

## 🧱 Założenia architektoniczne

* prosta, modularna struktura
* brak overengineeringu
* brak wzorców typu DDD / Clean Architecture na start
* aplikacja rozwijana iteracyjnie
* każda funkcja dodawana w osobnym etapie
* minimalne zmiany w istniejącym kodzie
* kod ma być czytelny i łatwy do debugowania

---

## 📁 Struktura projektu

```
LittleBrain/
├─ app.py
├─ requirements.txt
├─ PROJECT_CONTEXT.md
├─ notes.db
├─ core/
│  ├─ db.py
│  ├─ models.py
│  ├─ notes_service.py
│  ├─ reminders.py
│  └─ hotkeys.py
├─ ui/
│  ├─ quick_capture.py
│  ├─ main_window.py
│  └─ dialogs.py
└─ assets/
   └─ icon.ico
```

---

## 🧾 Model danych (notes)

Tabela: `notes`

| pole           | typ     | opis                           |
| -------------- | ------- | ------------------------------ |
| id             | INTEGER | klucz główny                   |
| content        | TEXT    | treść notatki                  |
| created_at     | TEXT    | data utworzenia                |
| updated_at     | TEXT    | data aktualizacji              |
| status         | TEXT    | active / done / archived       |
| remind_at      | TEXT    | data przypomnienia (nullable)  |
| reminder_shown | INTEGER | 0/1 czy pokazano przypomnienie |

---

## 🏷️ Statusy notatek

* `active` — aktywna notatka
* `done` — zakończona
* `archived` — zarchiwizowana

---

## 🚀 Główne funkcje (docelowe)

### 1. Quick Capture (najważniejsze)

* skrót: `Ctrl + Shift + Space`
* popup:

  * małe okno
  * always on top
  * autofocus na polu tekstowym
* Enter → zapis
* Esc → zamknięcie
* po zapisie:

  * okno się czyści LUB zamyka (minimalne rozwiązanie)

---

### 2. Lista notatek

* osobne okno
* lista wszystkich notatek
* sortowanie od najnowszych
* podstawowe informacje:

  * treść
  * status
  * data utworzenia

---

### 3. Wyszukiwanie i filtry

* wyszukiwanie po treści
* filtry:

  * active
  * with_reminder
  * done
  * archived
  * all

---

### 4. Przypomnienia

* możliwość ustawienia remind_at
* aplikacja działa w tle
* sprawdzanie co X sekund
* powiadomienia systemowe Windows
* przypomnienie pokazuje się tylko raz

---

### 5. Tryb Quick Capture

* działa bez otwierania głównego okna
* szybki popup
* znika po użyciu

---

## 📈 Plan rozwoju (ETAPY)

### ETAP 1 — MVP (Quick Capture + SQLite)

* popup okno
* pole tekstowe
* przycisk "Zapisz"
* zapis do SQLite
* Enter zapisuje
* walidacja pustych notatek

---

### ETAP 2 — UX popupu

* always on top
* autofocus
* Esc zamyka
* czyszczenie pola po zapisie

---

### ETAP 3 — Lista notatek

* główne okno
* lista wszystkich notatek
* sortowanie

---

### ETAP 4 — Wyszukiwanie i filtry

---

### ETAP 5 — Globalny skrót klawiszowy

* Ctrl + Shift + Space
* otwieranie popupu

---

### ETAP 6 — Przypomnienia

* remind_at
* scheduler
* powiadomienia systemowe

---

### ETAP 7 — Statusy notatek

* active / done / archived
* zmiana statusu

---

### ETAP 8 — Build aplikacji

* PyInstaller
* .exe

---

## ⚠️ Ważne zasady dla Codexa

1. Pracujemy iteracyjnie — małe kroki
2. NIE dodawaj funkcji spoza aktualnego zadania
3. NIE rób dużych refactorów bez potrzeby
4. Zachowuj prostotę
5. Jeśli czegoś nie wiesz:
   → NIE zgaduj
   → napisz czego brakuje

---

## 🧪 Standard odpowiedzi Codexa

Po każdej zmianie podaj:

1. Jakie pliki zostały zmienione
2. Co dokładnie zostało dodane/zmienione
3. Jak ręcznie przetestować funkcję

---

## ❌ Czego NIE robimy na start

* AI / integracje API
* parser typu "jutro rano"
* synchronizacja w chmurze
* tagi i zaawansowane systemy organizacji
* rozbudowany UI
* refactor całej aplikacji

---

## ✅ Priorytet

Najważniejsze:

👉 szybkie dodanie notatki w 2 sekundy

Reszta to dodatki.

---

## 🖥️ System docelowy

* Windows
* aplikacja lokalna
* brak wymagań internetowych

---

## 📌 Notatki dodatkowe

* aplikacja ma być szybka i lekka
* kod ma być łatwy do rozwijania
* każdy etap musi działać przed przejściem dalej
* testy manualne po każdym etapie

---

## 🧠 Filozofia projektu

LittleBrain nie ma być rozbudowanym systemem typu Notion.

Ma być:

* szybki
* prosty
* zawsze pod ręką

To narzędzie do łapania myśli, nie do ich analizowania.

---
