const STATUS_COLORS = {
    active: '#FFFDE7',
    done: '#E8F5E9',
    archived: '#F5F5F5',
};

let editingNoteId = null;

async function loadNotes() {
    const search = document.getElementById('search').value;
    const filter = document.getElementById('filter').value;
    const notes = await window.pywebview.api.get_notes(search, filter);
    renderCards(notes);
}

function renderCards(notes) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    notes.forEach(note => {
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
            <div class="card-content">${note.content}</div>
            <div class="card-footer">
                <span class="card-date">${note.created_at.slice(0, 10)}</span>
                <span class="badge badge-${note.status}">${note.status}</span>
            </div>
        `;

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
        'za miesiąc': 30,
    };

    target.setDate(target.getDate() + dayOffsets[day]);
    const [h, m] = hour.split(':').map(Number);
    target.setHours(h, m, 0, 0);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function showCaptureModal() {
    document.getElementById('capture-modal').style.display = 'block';
    document.getElementById('capture-content').focus();
}

function hideCaptureModal() {
    document.getElementById('capture-modal').style.display = 'none';
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
    resetCaptureFields();
    await loadNotes();
}

function openEditModal(noteId, content) {
    editingNoteId = noteId;
    document.getElementById('edit-content').value = content;
    document.getElementById('edit-modal').style.display = 'block';
    document.getElementById('edit-content').focus();
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    editingNoteId = null;
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
    closeEditModal();
    await loadNotes();
}

function showReminder(content) {
    const existing = document.getElementById('reminder-overlay');
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'reminder-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.25)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2000';

    const box = document.createElement('div');
    box.style.width = '340px';
    box.style.background = '#FFFDF5';
    box.style.borderRadius = '12px';
    box.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.2)';
    box.style.padding = '16px';

    const title = document.createElement('div');
    title.textContent = 'Przypomnienie';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.color = '#333';

    const text = document.createElement('div');
    text.textContent = content;
    text.style.color = '#333';
    text.style.marginBottom = '14px';
    text.style.whiteSpace = 'pre-wrap';

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
}

document.getElementById('search').addEventListener('input', loadNotes);
document.getElementById('filter').addEventListener('change', loadNotes);

document.getElementById('btn-new').addEventListener('click', showCaptureModal);
document.getElementById('capture-close').addEventListener('click', hideCaptureModal);
document.getElementById('capture-save').addEventListener('click', saveCaptureNote);
document.getElementById('edit-close').addEventListener('click', closeEditModal);
document.getElementById('edit-save').addEventListener('click', saveEditNote);

window.addEventListener('pywebviewready', loadNotes);
