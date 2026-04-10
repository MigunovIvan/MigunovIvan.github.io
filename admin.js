// admin.js
let currentUser = null;

// Элементы DOM
const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Проверка авторизации
window.onAuthStateChanged(window.auth, (user) => {
    currentUser = user;
    if (user) {
        loginView.style.display = 'none';
        adminView.style.display = 'block';
        loadMessages();
        loadComments();
        loadNews();
    } else {
        loginView.style.display = 'block';
        adminView.style.display = 'none';
    }
});

// Вход
loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    loginError.textContent = '';
    try {
        await window.signInWithEmailAndPassword(window.auth, email, password);
    } catch (err) {
        loginError.textContent = 'Ошибка: неверный email или пароль';
    }
});

// Выход
logoutBtn.addEventListener('click', async () => {
    await window.signOut(window.auth);
});

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${tabName}-section`).classList.add('active');
        if (tabName === 'messages') loadMessages();
        if (tabName === 'comments') loadComments();
        if (tabName === 'news') loadNews();
    });
});

// ========== СООБЩЕНИЯ ==========
async function loadMessages() {
    const container = document.getElementById('messages-list');
    container.innerHTML = '<p>Загрузка...</p>';
    try {
        const q = window.query(window.collection(window.db, 'messages'), window.orderBy('timestamp', 'desc'));
        const snapshot = await window.getDocs(q);
        if (snapshot.empty) {
            container.innerHTML = '<p>Нет сообщений</p>';
            return;
        }
        container.innerHTML = '';
        for (const docSnap of snapshot.docs) {
            const msg = docSnap.data();
            const id = docSnap.id;
            const date = msg.timestamp?.toDate().toLocaleString() || 'без даты';
            const div = document.createElement('div');
            div.className = 'message-item';
            div.innerHTML = `
                <div class="message-header">
                    <strong>${escapeHtml(msg.name)}</strong> (${escapeHtml(msg.email)})
                    <span class="badge ${msg.read ? '' : 'unread'}">${msg.read ? 'Прочитано' : 'Новое'}</span>
                </div>
                <div>${escapeHtml(msg.message)}</div>
                <div style="font-size:0.75rem; color:#666; margin-top:8px;">${date}</div>
                <div style="margin-top:8px;">
                    ${!msg.read ? `<button class="small" data-id="${id}" data-action="mark">📖 Отметить прочитанным</button>` : ''}
                    <button class="small" data-id="${id}" data-action="delete" style="background:#dc2626;">🗑 Удалить</button>
                </div>
            `;
            container.appendChild(div);
        }
        // Добавляем обработчики
        container.querySelectorAll('button[data-action="mark"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await window.updateDoc(window.doc(window.db, 'messages', id), { read: true });
                loadMessages();
            });
        });
        container.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Удалить сообщение?')) {
                    const id = btn.dataset.id;
                    await window.deleteDoc(window.doc(window.db, 'messages', id));
                    loadMessages();
                }
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Ошибка загрузки</p>';
    }
}

// ========== КОММЕНТАРИИ ==========
async function loadComments() {
    const container = document.getElementById('comments-list');
    container.innerHTML = '<p>Загрузка...</p>';
    try {
        const q = window.query(window.collection(window.db, 'comments'), window.orderBy('timestamp', 'desc'));
        const snapshot = await window.getDocs(q);
        if (snapshot.empty) {
            container.innerHTML = '<p>Нет комментариев</p>';
            return;
        }
        container.innerHTML = '';
        for (const docSnap of snapshot.docs) {
            const comm = docSnap.data();
            const id = docSnap.id;
            const date = comm.timestamp?.toDate().toLocaleString() || 'только что';
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-header">
                    <strong>${escapeHtml(comm.name)}</strong>
                    <button class="small" data-id="${id}" style="background:#dc2626;">🗑 Удалить</button>
                </div>
                <div>${escapeHtml(comm.text)}</div>
                <div style="font-size:0.75rem; color:#666; margin-top:8px;">${date}</div>
            `;
            container.appendChild(div);
        }
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Удалить комментарий?')) {
                    const id = btn.dataset.id;
                    await window.deleteDoc(window.doc(window.db, 'comments', id));
                    loadComments();
                }
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Ошибка загрузки</p>';
    }
}

// ========== НОВОСТИ ==========
async function loadNews() {
    const container = document.getElementById('news-list');
    container.innerHTML = '<p>Загрузка...</p>';
    try {
        const q = window.query(window.collection(window.db, 'news'), window.orderBy('date', 'desc'));
        const snapshot = await window.getDocs(q);
        if (snapshot.empty) {
            container.innerHTML = '<p>Нет новостей</p>';
            return;
        }
        container.innerHTML = '';
        for (const docSnap of snapshot.docs) {
            const news = docSnap.data();
            const id = docSnap.id;
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div class="flex-between">
                    <strong>${escapeHtml(news.title)}</strong>
                    <div>
                        <button class="small edit-news" data-id="${id}" data-title="${escapeHtml(news.title)}" data-date="${news.date}" data-content="${escapeHtml(news.content)}">✏️ Редактировать</button>
                        <button class="small delete-news" data-id="${id}" style="background:#dc2626;">🗑 Удалить</button>
                    </div>
                </div>
                <div style="font-size:0.8rem; color:#666;">📅 ${news.date}</div>
                <div style="margin-top:8px;">${escapeHtml(news.content)}</div>
            `;
            container.appendChild(div);
        }
        // Редактирование
        document.querySelectorAll('.edit-news').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const oldTitle = btn.dataset.title;
                const oldDate = btn.dataset.date;
                const oldContent = btn.dataset.content;
                const newTitle = prompt('Новый заголовок', oldTitle);
                if (newTitle === null) return;
                const newDate = prompt('Новая дата (YYYY-MM-DD)', oldDate);
                if (newDate === null) return;
                const newContent = prompt('Новый текст', oldContent);
                if (newContent === null) return;
                window.updateDoc(window.doc(window.db, 'news', id), {
                    title: newTitle,
                    date: newDate,
                    content: newContent
                }).then(() => loadNews());
            });
        });
        document.querySelectorAll('.delete-news').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Удалить новость?')) {
                    const id = btn.dataset.id;
                    await window.deleteDoc(window.doc(window.db, 'news', id));
                    loadNews();
                }
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Ошибка загрузки</p>';
    }
}

// Создание новости
document.getElementById('create-news-btn')?.addEventListener('click', async () => {
    const title = document.getElementById('news-title').value.trim();
    const date = document.getElementById('news-date').value.trim();
    const content = document.getElementById('news-content').value.trim();
    if (!title || !date || !content) {
        alert('Заполните все поля');
        return;
    }
    try {
        await window.addDoc(window.collection(window.db, 'news'), { title, date, content });
        document.getElementById('news-title').value = '';
        document.getElementById('news-date').value = '';
        document.getElementById('news-content').value = '';
        loadNews();
        alert('Новость добавлена!');
    } catch (err) {
        console.error(err);
        alert('Ошибка добавления');
    }
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}