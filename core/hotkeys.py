from __future__ import annotations

import queue
import tkinter as tk
from typing import Callable

try:
    import keyboard
except ImportError:
    keyboard = None


class GlobalHotkeyManager:
    def __init__(self, root: tk.Tk, on_trigger: Callable[[], None]) -> None:
        self.root = root
        self.on_trigger = on_trigger
        self._hotkey_handle = None
        self._queue: queue.Queue[str] = queue.Queue()
        self._running = False

    def start(self) -> bool:
        if keyboard is None:
            return False
        try:
            self._hotkey_handle = keyboard.add_hotkey(
                "ctrl+shift+space",
                self._schedule_callback,
                suppress=False,
            )
            self._running = True
            self._poll()
            return True
        except Exception as e:
            print(f"[DEBUG] Blad rejestracji hotkey: {e}")
            self._hotkey_handle = None
            self._running = False
            return False

    def stop(self) -> None:
        self._running = False
        if keyboard is None or self._hotkey_handle is None:
            return
        try:
            keyboard.remove_hotkey(self._hotkey_handle)
        finally:
            self._hotkey_handle = None

    def _schedule_callback(self) -> None:
        # Callback z keyboard dziala w watku tla, wiec wrzucamy zdarzenie do kolejki.
        self._queue.put_nowait("hotkey_triggered")

    def _poll(self) -> None:
        try:
            self._queue.get_nowait()
            self.on_trigger()
        except queue.Empty:
            pass

        if self._running:
            self.root.after(100, self._poll)
