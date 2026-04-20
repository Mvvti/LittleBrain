from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).resolve().parent.parent / "notes.db"


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    target_path = db_path or DB_PATH
    return sqlite3.connect(target_path)


def init_db(db_path: Optional[Path] = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                remind_at TEXT,
                reminder_shown INTEGER NOT NULL DEFAULT 0
            )
            """
        )


def insert_note(
    content: str,
    remind_at: str | None = None,
    db_path: Optional[Path] = None,
) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            INSERT INTO notes (content, created_at, updated_at, status, remind_at, reminder_shown)
            VALUES (?, datetime('now'), datetime('now'), 'active', ?, 0)
            """,
            (content, remind_at),
        )


def fetch_notes(
    search_text: str = "",
    filter_name: str = "all",
    db_path: Optional[Path] = None,
) -> list[tuple[int, str, str, str]]:
    conditions: list[str] = []
    params: list[str] = []

    if search_text.strip():
        conditions.append("content LIKE ?")
        params.append(f"%{search_text.strip()}%")

    if filter_name in {"active", "done", "archived"}:
        conditions.append("status = ?")
        params.append(filter_name)
    elif filter_name == "with_reminder":
        conditions.append("remind_at IS NOT NULL")

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    with get_connection(db_path) as conn:
        rows = conn.execute(
            f"""
            SELECT id, content, status, created_at
            FROM notes
            {where_clause}
            ORDER BY created_at DESC, id DESC
            """,
            params,
        ).fetchall()
    return rows


def update_note_status(note_id: int, new_status: str, db_path: Optional[Path] = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET status = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (new_status, note_id),
        )


def update_note_content(
    note_id: int,
    content: str,
    db_path: Optional[Path] = None,
) -> None:
    path = db_path or DB_PATH
    with sqlite3.connect(path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET content = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (content, note_id),
        )


def delete_note(note_id: int, db_path: Optional[Path] = None) -> None:
    path = db_path or DB_PATH
    with sqlite3.connect(path) as conn:
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
