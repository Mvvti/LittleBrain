import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import ctypes
import json
import os
import sqlite3
import threading
import time

import keyboard
from PIL import Image, ImageDraw
import pystray
from core.db import fetch_notes, insert_note
import webview

APP_TITLE = "LittleBrain"
RESOURCE_DIR = Path(os.environ.get("LITTLEBRAIN_RESOURCE_DIR", str(Path(__file__).resolve().parent.parent)))
DB_PATH = Path(os.environ.get("LITTLEBRAIN_DB_PATH", str(Path(__file__).resolve().parent.parent / "notes.db")))
ICON_PATH = RESOURCE_DIR / "assets" / "icon.ico"

_tray_icon: pystray.Icon | None = None


class Api:
    def get_notes(self, search="", filter_name="all"):
        notes = fetch_notes(search_text=search, filter_name=filter_name, db_path=DB_PATH)
        return [
            {"id": n[0], "content": n[1], "status": n[2], "created_at": n[3]}
            for n in notes
        ]

    def save_note(self, content, remind_at=None):
        insert_note(content=content, remind_at=remind_at, db_path=DB_PATH)
        return {"ok": True}

    def delete_note(self, note_id: int):
        from core.db import delete_note
        delete_note(note_id=note_id, db_path=DB_PATH)
        return {"ok": True}

    def update_note(self, note_id: int, content: str):
        from core.db import update_note_content
        update_note_content(note_id=note_id, content=content, db_path=DB_PATH)
        return {"ok": True}

    def update_status(self, note_id: int, status: str):
        from core.db import update_note_status
        update_note_status(note_id=note_id, new_status=status, db_path=DB_PATH)
        return {"ok": True}


def _set_window_icon() -> None:
    try:
        time.sleep(0.5)
        WM_SETICON = 0x0080
        hwnd = ctypes.windll.user32.FindWindowW(None, APP_TITLE)
        if hwnd and ICON_PATH.exists():
            hicon_small = ctypes.windll.user32.LoadImageW(
                None, str(ICON_PATH), 1, 16, 16, 0x10
            )
            hicon_large = ctypes.windll.user32.LoadImageW(
                None, str(ICON_PATH), 1, 32, 32, 0x10
            )
            if hicon_small:
                ctypes.windll.user32.SendMessageW(hwnd, WM_SETICON, 0, hicon_small)
            if hicon_large:
                ctypes.windll.user32.SendMessageW(hwnd, WM_SETICON, 1, hicon_large)
    except Exception:
        pass


def _restore_window() -> None:
    try:
        hwnd = ctypes.windll.user32.FindWindowW(None, APP_TITLE)
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 9)
            ctypes.windll.user32.SetForegroundWindow(hwnd)
    except Exception:
        pass


def _ensure_icon_file() -> None:
    ICON_PATH.parent.mkdir(parents=True, exist_ok=True)
    if ICON_PATH.exists():
        return

    image = Image.new("RGBA", (32, 32), "#F4D03F")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 31, 31), fill="#F4D03F")
    image.save(ICON_PATH, format="ICO")


def _load_tray_image() -> Image.Image:
    try:
        _ensure_icon_file()
        return Image.open(ICON_PATH)
    except Exception:
        return Image.new("RGBA", (32, 32), "#F4D03F")


def start_hotkey(window: webview.Window) -> None:
    def _on_hotkey() -> None:
        try:
            _restore_window()
        except Exception:
            pass

    keyboard.add_hotkey("ctrl+shift+space", _on_hotkey)


def start_tray_icon(window: webview.Window) -> None:
    def _on_show(icon, _item) -> None:
        _restore_window()

    def _on_quit(icon, _item) -> None:
        try:
            icon.stop()
        finally:
            os._exit(0)

    def _run() -> None:
        global _tray_icon
        menu = pystray.Menu(
            pystray.MenuItem("Pokaż", _on_show),
            pystray.MenuItem("Zakończ", _on_quit),
        )
        _tray_icon = pystray.Icon("littlebrain", _load_tray_image(), APP_TITLE, menu)
        _tray_icon.run()

    threading.Thread(target=_run, daemon=True).start()


def start_reminder_scheduler(window: webview.Window) -> None:
    def _reminder_loop() -> None:
        while True:
            try:
                with sqlite3.connect(DB_PATH) as conn:
                    rows = conn.execute(
                        """
                        SELECT id, content
                        FROM notes
                        WHERE remind_at IS NOT NULL
                          AND remind_at <= datetime('now', 'localtime')
                          AND reminder_shown = 0
                        """
                    ).fetchall()

                    for note_id, content in rows:
                        window.evaluate_js(f"showReminder({json.dumps(content)})")
                        conn.execute(
                            """
                            UPDATE notes
                            SET reminder_shown = 1
                            WHERE id = ?
                            """,
                            (note_id,),
                        )
            except Exception:
                pass

            time.sleep(60)

    threading.Thread(target=_reminder_loop, daemon=True).start()


def on_start(window: webview.Window) -> None:
    start_hotkey(window)
    start_reminder_scheduler(window)
    start_tray_icon(window)
    _set_window_icon()

    def _on_closing() -> bool:
        try:
            window.hide()
        except Exception:
            pass
        return False

    window.events.closing += _on_closing


def run_webview_app() -> None:
    html_path = RESOURCE_DIR / "ui" / "web" / "index.html"
    api = Api()
    window = webview.create_window(
        title=APP_TITLE,
        url=str(html_path),
        width=900,
        height=600,
        resizable=True,
        js_api=api,
    )
    webview.start(on_start, args=(window,))


if __name__ == "__main__":
    run_webview_app()
