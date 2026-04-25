let editingNoteId = null;
let originalEditContent = '';

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

function renderCards(notes) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    notes.forEach((note) => {
        const actions = [];
        if (note.status !== 'done') {
            actions.push('<button class="action-btn status-done" data-status="done" title="Oznacz jako done">✓</button>');
        }
        if (note.status !== 'archived') {
            actions.push('<button class="action-btn status-archived" data-status="archived" title="Archiwizuj">📦</button>');
        }
        if (note.status !== 'active') {
            actions.push('<button class="action-btn status-active" data-status="active" title="Przywróć do active">↩</button>');
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.status = note.status;
        card.dataset.id = note.id;
        card.innerHTML = `
            <div class="card-actions">
                ${actions.join('')}
                <button class="delete-btn" title="Usuń notatkę">🗑️</button>
            </div>
            <div class="card-content"></div>
            <div class="card-footer">
                <span class="card-date">${note.created_at.slice(0, 10)}</span>
                <span class="card-status-group">
                    <span class="badge badge-${note.status}">${note.status}</span>
                    ${note.has_reminder === true ? '<span class="reminder-icon">🔔</span>' : ''}
                </span>
            </div>
        `;

        const contentEl = card.querySelector('.card-content');
        contentEl.textContent = note.content;

        card.addEventListener('click', () => openEditModal(note.id, note.content));

        const statusButtons = card.querySelectorAll('.action-btn');
        statusButtons.forEach((btn) => {
            btn.addEventListener('click', async (event) => {
                event.stopPropagation();
                const newStatus = btn.dataset.status;
                await window.pywebview.api.update_status(note.id, newStatus);
                await loadNotes();
            });
        });

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const confirmed = confirm('Czy na pewno chcesz usunąć tę notatkę?');
            if (!confirmed) {
                return;
            }
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
    document.getElementById('capture-modal').style.display = 'block';
    document.getElementById('capture-content').focus();
}

function hideCaptureModal() {
    document.getElementById('capture-modal').style.display = 'none';
    resetCaptureFields();
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
function openEditModal(noteId, content) {
    editingNoteId = noteId;
    originalEditContent = content;
    document.getElementById('edit-content').value = content;
    document.getElementById('edit-modal').style.display = 'block';
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
    document.getElementById('edit-modal').style.display = 'none';
    editingNoteId = null;
    originalEditContent = '';
}

async function saveEditNote() {
    const content = document.getElementById('edit-content').value.trim();
    if (!content) {
        alert('Treść notatki nie może być pusta');
        return;
    }
    if (editingNoteId === null) {
        return;
    }

    await window.pywebview.api.update_note(editingNoteId, content);
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
    setTimeout(() => toast.remove(), 2000);
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
document.addEventListener('keydown', handleModalKeyboard);

initTheme();
window.addEventListener('pywebviewready', loadNotes);
