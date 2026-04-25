import ctypes
import os
import sys
from pathlib import Path

_mutex_handle = None
APP_TITLE = os.environ.get("LITTLEBRAIN_APP_TITLE", "LittleBrain")
ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_TITLE)


def _ensure_single_instance() -> None:
    global _mutex_handle
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateMutexW.restype = ctypes.c_void_p
    kernel32.CreateMutexW.argtypes = [ctypes.c_void_p, ctypes.c_bool, ctypes.c_wchar_p]
    _mutex_handle = kernel32.CreateMutexW(None, False, "LittleBrainSingleInstance")
    if ctypes.get_last_error() == 183:  # ERROR_ALREADY_EXISTS
        hwnd = ctypes.windll.user32.FindWindowW(None, APP_TITLE)
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 9)
            ctypes.windll.user32.SetForegroundWindow(hwnd)
        sys.exit(0)


def _runtime_paths() -> tuple[Path, Path]:
    if getattr(sys, "frozen", False):
        app_dir = Path(sys.executable).resolve().parent
        resource_dir = Path(getattr(sys, "_MEIPASS", app_dir))
        return app_dir, resource_dir

    project_root = Path(__file__).resolve().parent
    return project_root, project_root


def main() -> None:
    _ensure_single_instance()
    app_dir, resource_dir = _runtime_paths()
    db_path = app_dir / "notes.db"

    os.environ["LITTLEBRAIN_APP_TITLE"] = APP_TITLE
    os.environ["LITTLEBRAIN_DB_PATH"] = str(db_path)
    os.environ["LITTLEBRAIN_RESOURCE_DIR"] = str(resource_dir)

    from core.db import init_db
    from ui.webview_app import run_webview_app

    init_db(db_path=db_path)
    run_webview_app()


if __name__ == "__main__":
    main()
