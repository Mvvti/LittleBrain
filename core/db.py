from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).resolve().parent.parent / "notes.db"


# --- CONNECTION ---
def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    target_path = db_path or DB_PATH
    return sqlite3.connect(target_path)


# --- SCHEMA ---
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
                reminder_shown INTEGER NOT NULL DEFAULT 0,
                pinned INTEGER DEFAULT 0
            )
            """
        )
        try:
            conn.execute("ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass


# --- CREATE ---
def insert_note(
    content: str,
    remind_at: str | None = None,
    db_path: Optional[Path] = None,
) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            INSERT INTO notes (content, created_at, updated_at, status, remind_at, reminder_shown)
            VALUES (?, datetime('now', 'localtime'), datetime('now', 'localtime'), 'active', ?, 0)
            """,
            (content, remind_at),
        )


# --- READ ---
def fetch_notes(
    search_text: str = "",
    filter_name: str = "all",
    sort_by: str = "newest",
    db_path: Optional[Path] = None,
) -> list[tuple[int, str, str, str, str | None, int, int]]:
    conditions: list[str] = []
    params: list[str] = []

    if search_text.strip():
        conditions.append("content LIKE ?")
        params.append(f"%{search_text.strip()}%")

    if filter_name in {"active", "done", "archived"}:
        conditions.append("status = ?")
        params.append(filter_name)
    elif filter_name == "with_reminder":
        conditions.append("remind_at IS NOT NULL AND reminder_shown = 0")

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    if sort_by == "oldest":
        order_by = "ORDER BY pinned DESC, created_at ASC, id ASC"
    elif sort_by == "status":
        order_by = (
            "ORDER BY pinned DESC, CASE status "
            "WHEN 'active' THEN 1 "
            "WHEN 'done' THEN 2 "
            "WHEN 'archived' THEN 3 "
            "END ASC, created_at DESC, id DESC"
        )
    else:
        order_by = "ORDER BY pinned DESC, created_at DESC, id DESC"

    with get_connection(db_path) as conn:
        rows = conn.execute(
            f"""
            SELECT id, content, status, created_at, remind_at, reminder_shown, pinned
            FROM notes
            {where_clause}
            {order_by}
            """,
            params,
        ).fetchall()
    return rows


def get_notes_counts(db_path: Optional[Path] = None) -> dict[str, int]:
    with get_connection(db_path) as conn:
        all_count = conn.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
        active_count = conn.execute(
            "SELECT COUNT(*) FROM notes WHERE status = 'active'"
        ).fetchone()[0]
        done_count = conn.execute(
            "SELECT COUNT(*) FROM notes WHERE status = 'done'"
        ).fetchone()[0]
        archived_count = conn.execute(
            "SELECT COUNT(*) FROM notes WHERE status = 'archived'"
        ).fetchone()[0]
        with_reminder_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM notes
            WHERE remind_at IS NOT NULL AND reminder_shown = 0
            """
        ).fetchone()[0]

    return {
        "all": all_count,
        "active": active_count,
        "done": done_count,
        "archived": archived_count,
        "with_reminder": with_reminder_count,
    }


# --- UPDATE ---
def update_note_status(note_id: int, new_status: str, db_path: Optional[Path] = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET status = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
            """,
            (new_status, note_id),
        )


def update_note_content(
    note_id: int,
    content: str,
    db_path: Optional[Path] = None,
) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET content = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
            """,
            (content, note_id),
        )


def update_note_reminder(
    note_id: int,
    remind_at: str,
    db_path: Optional[Path] = None,
) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET remind_at = ?, reminder_shown = 0, updated_at = datetime('now', 'localtime')
            WHERE id = ?
            """,
            (remind_at, note_id),
        )


def clear_note_reminder(note_id: int, db_path: Optional[Path] = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET remind_at = NULL, reminder_shown = 0, updated_at = datetime('now', 'localtime')
            WHERE id = ?
            """,
            (note_id,),
        )


def toggle_pin(note_id: int, db_path: Optional[Path] = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            UPDATE notes
            SET pinned = CASE pinned WHEN 1 THEN 0 ELSE 1 END,
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
            """,
            (note_id,),
        )


# --- DELETE ---
def delete_note(note_id: int, db_path: Optional[Path] = None) -> None:
    with get_connection(db_path) as conn:
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
