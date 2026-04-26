let editingNoteId = null;
let originalEditContent = '';
let clearReminderRequested = false;
let captureModalHideTimeoutId = null;
let editModalHideTimeoutId = null;

// --- THEME ---
function applyTheme(theme) {
    const toggleButton = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        toggleButton.textContent = '☀️';
        return;
    }
    document.body.classList.remove('dark');
    toggleButton.textContent = '🌙';
}

function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
        localStorage.setItem('theme', 'light');
        applyTheme('light');
        return;
    }
    localStorage.setItem('theme', 'dark');
    applyTheme('dark');
}

// --- NOTES LOADING ---
async function loadNotes() {
    const search = document.getElementById('search').value;
    const filter = document.getElementById('filter').value;
    const sortBy = document.getElementById('sort').value;
    const notes = await window.pywebview.api.get_notes(search, filter, sortBy);
    renderCards(notes);
    await updateFilterCounts();
}

function formatRemindAt(remindAt) {
    const [date, time] = remindAt.split(' ');
    const [, month, day] = date.split('-');
    return `🔔 ${day}.${month} ${time}`;
}

function renderCards(notes) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    if (notes.length === 0) {
        const filter = document.getElementById('filter').value;
        const search = document.getElementById('search').value.trim();
        const message = search
            ? `Brak notatek pasujących do "${search}"`
            : filter === 'all'
            ? 'Nie masz jeszcze żadnych notatek'
            : `Brak notatek w filtrze "${filter}"`;
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧠</div>
                <div class="empty-state-text">${message}</div>
            </div>`;
        return;
    }

    notes.forEach((note, index) => {
        const actions = [];
        if (note.pinned === true) {
            actions.push('<button class="action-btn pin-active" title="Odepnij">📌</button>');
        } else {
            actions.push('<button class="action-btn pin-btn" title="Przypiąż">📌</button>');
        }
        if (note.status !== 'done') {
            actions.push('<button class="action-btn status-done" data-status="done" title="Oznacz jako done">✓</button>');
        }
        if (note.status !== 'archived') {
            actions.push('<button class="action-btn status-archived" data-status="archived" title="Archiwizuj">📦</button>');
        }
        if (note.status !== 'active') {
            actions.push('<button class="action-btn status-active" data-status="active" title="Przywróć do active">↩</button>');
        }

        const reminderHtml = note.remind_at
            ? `<span class="reminder-date">${formatRemindAt(note.remind_at)}</span>`
            : '';
        const pinIconHtml = note.pinned === true ? '<span class="pin-icon">📌</span>' : '';

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.status = note.status;
        card.dataset.id = note.id;
        card.style.animationDelay = `${Math.min(index, 8) * 40}ms`;
        card.innerHTML = `
            <div class="card-actions">
                ${actions.join('')}
                <button class="delete-btn" title="Usuń notatkę">🗑️</button>
            </div>
            <div class="card-content"></div>
            <div class="card-footer">
                <span class="card-date">${note.created_at.slice(0, 10)}</span>
                <span class="card-status-group">
                    ${reminderHtml}
                    <span class="badge badge-${note.status}">${note.status}</span>${pinIconHtml}
                </span>
            </div>
        `;

        const contentEl = card.querySelector('.card-content');
        contentEl.textContent = note.content;

        card.addEventListener('click', () => openEditModal(note.id, note.content, note.remind_at));

        const statusButtons = card.querySelectorAll('.action-btn');
        statusButtons.forEach((btn) => {
            btn.addEventListener('click', async (event) => {
                event.stopPropagation();
                const newStatus = btn.dataset.status;
                if (!newStatus) {
                    return;
                }
                await window.pywebview.api.update_status(note.id, newStatus);
                await loadNotes();
            });
        });

        const pinButton = card.querySelector('.pin-btn, .pin-active');
        if (pinButton) {
            pinButton.addEventListener('click', async (event) => {
                event.stopPropagation();
                await window.pywebview.api.toggle_pin(note.id);
                await loadNotes();
            });
        }

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const confirmed = confirm('Czy na pewno chcesz usunąć tę notatkę?');
            if (!confirmed) {
                return;
            }
            card.classList.add('card-removing');
            await new Promise((resolve) => setTimeout(resolve, 200));
            await window.pywebview.api.delete_note(note.id);
            await loadNotes();
        });

        grid.appendChild(card);
    });
}

async function updateFilterCounts() {
    const counts = await window.pywebview.api.get_counts();
    const filter = document.getElementById('filter');
    for (const option of filter.options) {
        const key = option.value;
        const count = counts[key] ?? 0;
        option.textContent = `${key} (${count})`;
    }
}

// --- CAPTURE MODAL ---
function showCaptureModal() {
    const modal = document.getElementById('capture-modal');
    if (captureModalHideTimeoutId !== null) {
        clearTimeout(captureModalHideTimeoutId);
        captureModalHideTimeoutId = null;
    }
    modal.style.display = 'block';
    modal.classList.remove('modal-closing');
    void modal.offsetWidth;
    modal.classList.add('modal-visible');
    document.getElementById('capture-content').focus();
}

function hideCaptureModal() {
    const modal = document.getElementById('capture-modal');
    modal.classList.add('modal-closing');
    captureModalHideTimeoutId = setTimeout(() => {
        modal.classList.remove('modal-visible', 'modal-closing');
        modal.style.display = 'none';
        resetCaptureFields();
        captureModalHideTimeoutId = null;
    }, 150);
}

function resetCaptureFields() {
    document.getElementById('capture-content').value = '';
    document.getElementById('capture-day').value = '—';
    document.getElementById('capture-hour').value = '—';
}

async function saveCaptureNote() {
    const content = document.getElementById('capture-content').value.trim();
    const day = document.getElementById('capture-day').value;
    const hour = document.getElementById('capture-hour').value;

    if (!content) {
        alert('Treść notatki nie może być pusta');
        return;
    }

    const remindAt = computeRemindAt(day, hour);
    if (remindAt === false) {
        return;
    }

    await window.pywebview.api.save_note(content, remindAt);
    hideCaptureModal();
    await loadNotes();
}

function computeRemindAt(day, hour) {
    if (day === '—' && hour === '—') {
        return null;
    }
    if (day === '—' || hour === '—') {
        alert('Wybierz zarówno dzień jak i godzinę');
        return false;
    }

    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayOffsets = {
        'dziś': 0,
        'jutro': 1,
        'pojutrze': 2,
        'za tydzień': 7,
        'za 2 tygodnie': 14,
    };

    if (day === 'za miesiąc') {
        target.setMonth(target.getMonth() + 1);
    } else {
        target.setDate(target.getDate() + dayOffsets[day]);
    }

    const [h, m] = hour.split(':').map(Number);
    target.setHours(h, m, 0, 0);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// --- EDIT MODAL ---
function openEditModal(noteId, content, _remindAt) {
    editingNoteId = noteId;
    originalEditContent = content;
    document.getElementById('edit-content').value = content;
    document.getElementById('edit-remind-day').value = '—';
    document.getElementById('edit-remind-hour').value = '—';
    clearReminderRequested = false;
    const clearReminderButton = document.getElementById('edit-clear-reminder');
    clearReminderButton.disabled = _remindAt === null;
    clearReminderButton.textContent = _remindAt === null ? 'Brak przypomnienia' : 'Usuń przypomnienie';
    document.getElementById('edit-char-count').textContent = `${content.length} znaków`;
    const modal = document.getElementById('edit-modal');
    if (editModalHideTimeoutId !== null) {
        clearTimeout(editModalHideTimeoutId);
        editModalHideTimeoutId = null;
    }
    modal.style.display = 'block';
    modal.classList.remove('modal-closing');
    void modal.offsetWidth;
    modal.classList.add('modal-visible');
    document.getElementById('edit-content').focus();
}

function hasUnsavedChanges() {
    if (editingNoteId === null) {
        return false;
    }
    const currentContent = document.getElementById('edit-content').value;
    return currentContent !== originalEditContent;
}

function closeEditModal() {
    if (hasUnsavedChanges()) {
        const confirmed = confirm('Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?');
        if (!confirmed) {
            return;
        }
    }
    const modal = document.getElementById('edit-modal');
    modal.classList.add('modal-closing');
    editModalHideTimeoutId = setTimeout(() => {
        modal.classList.remove('modal-visible', 'modal-closing');
        modal.style.display = 'none';
        editModalHideTimeoutId = null;
    }, 150);
    editingNoteId = null;
    originalEditContent = '';
}

async function saveEditNote() {
    const content = document.getElementById('edit-content').value.trim();
    const day = document.getElementById('edit-remind-day').value;
    const hour = document.getElementById('edit-remind-hour').value;
    if (!content) {
        alert('Treść notatki nie może być pusta');
        return;
    }
    if (editingNoteId === null) {
        return;
    }

    let remindAt = null;
    if (!(day === '—' && hour === '—')) {
        remindAt = computeRemindAt(day, hour);
        if (remindAt === false) {
            return;
        }
    }

    await window.pywebview.api.update_note(editingNoteId, content);
    if (remindAt !== null) {
        await window.pywebview.api.update_reminder(editingNoteId, remindAt);
    } else if (clearReminderRequested) {
        await window.pywebview.api.clear_reminder(editingNoteId);
    }
    clearReminderRequested = false;
    document.getElementById('edit-content').value = content;
    originalEditContent = content;
    closeEditModal();
    await loadNotes();
}

// --- REMINDERS ---
function showReminder(content) {
    const existing = document.getElementById('reminder-overlay');
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'reminder-overlay';
    overlay.className = 'reminder-overlay';

    const box = document.createElement('div');
    box.className = 'reminder-box';

    const title = document.createElement('div');
    title.className = 'reminder-title';
    title.textContent = 'Przypomnienie';

    const text = document.createElement('div');
    text.className = 'reminder-text';
    text.textContent = content;

    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'btn-primary';
    okBtn.style.width = '100%';
    okBtn.addEventListener('click', () => overlay.remove());

    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(okBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    return true;
}

// --- UTILS ---
function showToast(message) {
    const existing = document.getElementById('toast');
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 200);
    }, 1800);
}

// --- KEYBOARD ---
function handleModalKeyboard(event) {
    const captureModal = document.getElementById('capture-modal');
    const editModal = document.getElementById('edit-modal');
    const isCaptureVisible = captureModal.style.display === 'block';
    const isEditVisible = editModal.style.display === 'block';

    if (isEditVisible && event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        const editContent = document.getElementById('edit-content');
        editContent.value = originalEditContent;
        showToast('Przywrócono oryginalną treść');
        return;
    }

    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        if (!isCaptureVisible && !isEditVisible) {
            showCaptureModal();
        }
        return;
    }

    if (event.ctrlKey && event.key === 'f') {
        if (!isCaptureVisible && !isEditVisible) {
            event.preventDefault();
            const search = document.getElementById('search');
            search.focus();
            search.select();
        }
        return;
    }

    if (isCaptureVisible) {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveCaptureNote();
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            hideCaptureModal();
            return;
        }
    }

    if (isEditVisible && event.key === 'Escape') {
        event.preventDefault();
        closeEditModal();
    }
}

// --- INIT ---
document.getElementById('search').addEventListener('input', loadNotes);
document.getElementById('filter').addEventListener('change', loadNotes);
document.getElementById('sort').addEventListener('change', loadNotes);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

document.getElementById('btn-new').addEventListener('click', showCaptureModal);
document.getElementById('capture-close').addEventListener('click', hideCaptureModal);
document.getElementById('capture-save').addEventListener('click', saveCaptureNote);
document.getElementById('edit-close').addEventListener('click', closeEditModal);
document.getElementById('edit-save').addEventListener('click', saveEditNote);
document.getElementById('edit-clear-reminder').addEventListener('click', () => {
    const clearReminderButton = document.getElementById('edit-clear-reminder');
    if (clearReminderButton.disabled) {
        return;
    }
    clearReminderRequested = true;
    document.getElementById('edit-remind-day').value = '—';
    document.getElementById('edit-remind-hour').value = '—';
    showToast('Przypomnienie zostanie usunięte po zapisaniu');
});
document.getElementById('edit-content').addEventListener('input', (event) => {
    document.getElementById('edit-char-count').textContent = `${event.target.value.length} znaków`;
});
document.addEventListener('keydown', handleModalKeyboard);

initTheme();
window.addEventListener('pywebviewready', async () => {
    try {
        await loadNotes();
    } finally {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.classList.add('hidden');
        }
    }
});
