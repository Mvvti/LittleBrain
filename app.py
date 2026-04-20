import ctypes
ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("LittleBrain")

import os
import sys
from pathlib import Path


def _runtime_paths() -> tuple[Path, Path]:
    if getattr(sys, "frozen", False):
        app_dir = Path(sys.executable).resolve().parent
        resource_dir = Path(getattr(sys, "_MEIPASS", app_dir))
        return app_dir, resource_dir

    project_root = Path(__file__).resolve().parent
    return project_root, project_root


def main() -> None:
    app_dir, resource_dir = _runtime_paths()
    db_path = app_dir / "notes.db"

    os.environ["LITTLEBRAIN_DB_PATH"] = str(db_path)
    os.environ["LITTLEBRAIN_RESOURCE_DIR"] = str(resource_dir)

    from core.db import init_db
    from ui.webview_app import run_webview_app

    init_db(db_path=db_path)
    run_webview_app()


if __name__ == "__main__":
    main()
