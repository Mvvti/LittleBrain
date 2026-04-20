from __future__ import annotations

import sqlite3
import tkinter as tk
from pathlib import Path


class ReminderScheduler:
    def __init__(self, root: tk.Tk, db_path: Path | None = None) -> None:
        self.root = root
        self.db_path = db_path or (Path(__file__).resolve().parent.parent / "notes.db")
        self._running = False
        self._interval_ms = 60_000

    def start(self) -> None:
        self._running = True
        self._check()

    def stop(self) -> None:
        self._running = False

    def _check(self) -> None:
        if not self._running:
            return

        with sqlite3.connect(self.db_path) as conn:
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
                self._notify(note_id, content)
                conn.execute(
                    """
                    UPDATE notes
                    SET reminder_shown = 1
                    WHERE id = ?
                    """,
                    (note_id,),
                )

        if self._running:
            self.root.after(self._interval_ms, self._check)

    def _notify(self, note_id: int, content: str) -> None:
        self._show_popup(content)
        print(f"[REMINDER] {note_id}: {content}")

    def _show_popup(self, content: str) -> None:
        popup = tk.Toplevel(self.root)
        popup.title("LittleBrain — przypomnienie")
        popup.geometry("320x120")
        popup.resizable(False, False)
        popup.attributes("-topmost", True)

        title_label = tk.Label(
            popup,
            text="🔔 Przypomnienie:",
            font=("TkDefaultFont", 10, "bold"),
        )
        title_label.pack(anchor="w", padx=12, pady=(10, 4))

        content_label = tk.Label(
            popup,
            text=content,
            wraplength=280,
            justify="left",
        )
        content_label.pack(anchor="w", padx=12, pady=(0, 10))

        ok_button = tk.Button(popup, text="OK", command=popup.destroy)
        ok_button.pack(pady=(0, 10))

        popup.update_idletasks()
        width = 320
        height = 120
        x = (popup.winfo_screenwidth() - width) // 2
        y = (popup.winfo_screenheight() - height) // 2
        popup.geometry(f"{width}x{height}+{x}+{y}")
