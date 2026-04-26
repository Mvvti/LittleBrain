from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Note:
    id: int
    content: str
    created_at: str
    updated_at: str
    status: str
    remind_at: str | None
    reminder_shown: int
