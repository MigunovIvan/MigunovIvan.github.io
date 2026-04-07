// ========== 1. ТЁМНАЯ ТЕМА ==========
const themeBtn = document.getElementById('toggle-theme');

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        themeBtn.textContent = '☀️';
    } else if (saved === 'light') {
        document.body.classList.remove('dark');
        themeBtn.textContent = '🌙';
    } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
            themeBtn.textContent = '☀️';
        } else {
            themeBtn.textContent = '🌙';
        }
    }
}

themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    themeBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
loadTheme();

// ========== 2. НАВИГАЦИЯ МЕЖДУ СЕКЦИЯМИ ==========
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

function switchSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) btn.classList.add('active');
    });
    // Если переключились на комментарии — подгружаем их
    if (sectionId === 'comments') loadComments();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

// ========== 3. ПРОЕКТЫ (GitHub API) ==========
const projectsGrid = document.getElementById('projects-grid');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const counterSpan = document.querySelector('#counter span');
const errorMsgDiv = document.getElementById('error-message');
const retryBtn = document.getElementById('retry');

let allProjects = [];
const GITHUB_USER = 'MigunovIvan';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function createCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    const img = document.createElement('img');
    img.className = 'project-img';
    img.src = `images/${project.name}.png`;
    img.alt = project.name;
    img.onerror = function() {
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'img-fallback';
        fallbackDiv.innerHTML = `📁 ${escapeHtml(project.name.slice(0, 20))}`;
        img.replaceWith(fallbackDiv);
    };
    const stars = project.stargazers_count || 0;
    const updated = new Date(project.updated_at).toLocaleDateString('ru-RU');
    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `
        <div class="project-name">${escapeHtml(project.name)}</div>
        <div class="project-desc">${escapeHtml(project.description) || '— без описания —'}</div>
        <div class="project-meta">
            <span>⭐ ${stars}</span>
            <span>🕒 ${updated}</span>
            <span>💻 ${escapeHtml(project.language) || '—'}</span>
        </div>
        <a href="${project.html_url}" class="project-link" target="_blank" rel="noopener">Открыть на GitHub →</a>
    `;
    card.appendChild(img);
    card.appendChild(body);
    return card;
}

function renderProjects() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = allProjects.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
    const sortType = sortSelect.value;
    if (sortType === 'stars') {
        filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (sortType === 'updated') {
        filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    counterSpan.textContent = filtered.length;
    projectsGrid.innerHTML = '';
    if (filtered.length === 0) {
        projectsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;">😕 Нет проектов по запросу</div>`;
        return;
    }
    filtered.forEach(p => projectsGrid.appendChild(createCard(p)));
}

function showSkeletons() {
    projectsGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text">
                <div class="skeleton-line"></div>
                <div class="skeleton-line" style="width: 70%"></div>
                <div class="skeleton-line" style="width: 40%"></div>
            </div>
        `;
        projectsGrid.appendChild(skeleton);
    }
}

async function loadProjects() {
    showSkeletons();
    errorMsgDiv.style.display = 'none';
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        const repos = await res.json();
        allProjects = repos.filter(r => !r.fork);
        if (allProjects.length === 0) {
            projectsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center">📭 Репозитории не найдены</div>';
        } else {
            renderProjects();
        }
    } catch (err) {
        console.error(err);
        errorMsgDiv.style.display = 'block';
        projectsGrid.innerHTML = '';
    }
}

if (searchInput) searchInput.addEventListener('input', renderProjects);
if (sortSelect) sortSelect.addEventListener('change', renderProjects);
if (retryBtn) retryBtn.addEventListener('click', loadProjects);

// ========== 4. НОВОСТИ (Firestore) ==========
async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;
    newsContainer.innerHTML = '<div class="news-card">📡 Загрузка новостей...</div>';
    try {
        const q = query(collection(window.db, 'news'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            newsContainer.innerHTML = '<div class="news-card">Новостей пока нет. Добавьте через консоль Firebase.</div>';
            return;
        }
        newsContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const news = doc.data();
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <div class="news-title">${escapeHtml(news.title)}</div>
                <div class="news-date">📅 ${news.date || 'без даты'}</div>
                <div class="news-content">${escapeHtml(news.content)}</div>
            `;
            newsContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Ошибка загрузки новостей:', err);
        newsContainer.innerHTML = '<div class="news-card">⚠️ Не удалось загрузить новости</div>';
    }
}

// ========== 5. ГОСТЕВАЯ КНИГА (Firestore) ==========
async function loadComments() {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    commentsList.innerHTML = '<div class="comment-item">Загрузка...</div>';
    try {
        const q = query(collection(window.db, 'comments'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            commentsList.innerHTML = '<div class="comment-item">Пока нет комментариев. Будьте первым!</div>';
            return;
        }
        commentsList.innerHTML = '';
        snapshot.forEach(doc => {
            const c = doc.data();
            const div = document.createElement('div');
            div.className = 'comment-item';
            let dateStr = 'только что';
            if (c.timestamp && c.timestamp.toDate) {
                dateStr = c.timestamp.toDate().toLocaleString();
            }
            div.innerHTML = `
                <div class="comment-author">✍️ ${escapeHtml(c.name)}</div>
                <div class="comment-date">🕒 ${dateStr}</div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
            `;
            commentsList.appendChild(div);
        });
    } catch (err) {
        console.error('Ошибка загрузки комментариев:', err);
        commentsList.innerHTML = '<div class="comment-item">❌ Ошибка загрузки</div>';
    }
}

async function addComment(name, text) {
    if (!name.trim() || !text.trim()) {
        alert("Заполните имя и текст!");
        return false;
    }
    try {
        await addDoc(collection(window.db, 'comments'), {
            name: name.trim(),
            text: text.trim(),
            timestamp: serverTimestamp()
        });
        return true;
    } catch (err) {
        console.error('Ошибка добавления комментария:', err);
        alert("Не удалось отправить комментарий. Попробуйте позже.");
        return false;
    }
}

const submitCommentBtn = document.getElementById('submit-comment');
if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('comment-name');
        const textInput = document.getElementById('comment-text');
        const ok = await addComment(nameInput.value, textInput.value);
        if (ok) {
            nameInput.value = '';
            textInput.value = '';
            loadComments();
        }
    });
}

// ========== 6. ФОРМА ОБРАТНОЙ СВЯЗИ (Firestore) ==========
const contactForm = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();
        if (!name || !email || !message) {
            formFeedback.innerHTML = '<span style="color:red;">Заполните все поля</span>';
            return;
        }
        if (!email.includes('@')) {
            formFeedback.innerHTML = '<span style="color:red;">Введите корректный email</span>';
            return;
        }
        formFeedback.innerHTML = '<span style="color:#0066cc;">Отправка...</span>';
        try {
            await addDoc(collection(window.db, 'messages'), {
                name: name,
                email: email,
                message: message,
                timestamp: serverTimestamp(),
                read: false
            });
            formFeedback.innerHTML = '<span style="color:green;">✅ Сообщение отправлено! Я отвечу вам.</span>';
            contactForm.reset();
            setTimeout(() => formFeedback.innerHTML = '', 5000);
        } catch (err) {
            console.error('Ошибка отправки формы:', err);
            formFeedback.innerHTML = '<span style="color:red;">❌ Ошибка сервера. Попробуйте позже.</span>';
        }
    });
}

// ========== 7. СТАРТ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ==========
window.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadNews();
    // Загружаем комментарии только если секция активна? Нет, loadComments вызовется при первом переключении.
    // Но можно сразу вызвать, чтобы данные были готовы.
    loadComments();
    switchSection('projects'); // показываем проекты по умолчанию
});