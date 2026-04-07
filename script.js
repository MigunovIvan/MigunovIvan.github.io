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

// ========== 2. НАВИГАЦИЯ ==========
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

function switchSection(sectionId) {
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) btn.classList.add('active');
    });
    if (sectionId === 'comments') loadComments();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

// ========== 3. ПРОЕКТЫ (GITHUB API) ==========
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
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function createCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    const img = document.createElement('img');
    img.className = 'project-img';
    img.src = `images/${project.name}.png`;
    img.alt = project.name;
    img.onerror = () => {
        const fallback = document.createElement('div');
        fallback.className = 'img-fallback';
        fallback.innerHTML = `📁 ${escapeHtml(project.name.slice(0, 20))}`;
        img.replaceWith(fallback);
    };
    const stars = project.stargazers_count || 0;
    const updated = formatDate(project.updated_at);
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
    if (sortType === 'stars') filtered.sort((a,b) => b.stargazers_count - a.stargazers_count);
    else if (sortType === 'updated') filtered.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
    else filtered.sort((a,b) => a.name.localeCompare(b.name));

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

// ========== 4. НОВОСТИ (РУЧНЫЕ + АВТОМАТИЧЕСКИЕ ИЗ README) ==========
// Кэш README в localStorage (1 час)
async function fetchReadmeForRepo(repoName, repoUpdatedAt) {
    const cacheKey = `readme_${repoName}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, timestamp, updatedAt } = JSON.parse(cached);
            if (updatedAt === repoUpdatedAt && (Date.now() - timestamp) < 60 * 60 * 1000) {
                return data;
            }
        } catch(e) {}
    }
    try {
        const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/readme`;
        const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3.raw' } });
        if (!res.ok) return null;
        let text = await res.text();
        // Очищаем от markdown и обрезаем до 200 символов
        let plain = text.replace(/[#*`_\[\]()]/g, '').trim();
        plain = plain.length > 200 ? plain.slice(0, 200) + '…' : plain;
        const data = { text: plain, repoName, updatedAt: repoUpdatedAt };
        localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now(),
            updatedAt: repoUpdatedAt
        }));
        return data;
    } catch (err) {
        console.warn(`README для ${repoName} не загружен`, err);
        return null;
    }
}

async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;
    newsContainer.innerHTML = '<div class="news-card">📡 Загрузка новостей...</div>';
    
    let allNewsItems = [];

    // 1. Ручные новости из Firestore
    try {
        const q = query(collection(window.db, 'news'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const n = doc.data();
            allNewsItems.push({
                type: 'manual',
                title: n.title,
                date: n.date,
                content: n.content,
                url: null
            });
        });
    } catch (err) {
        console.error('Ошибка загрузки ручных новостей:', err);
    }

    // 2. Автоматические новости из README проектов
    if (allProjects.length === 0) {
        // ждём максимум 2 секунды
        await new Promise(resolve => {
            let check = setInterval(() => {
                if (allProjects.length > 0) { clearInterval(check); resolve(); }
            }, 200);
            setTimeout(() => resolve(), 2000);
        });
    }
    const readmePromises = allProjects.map(async (project) => {
        const readme = await fetchReadmeForRepo(project.name, project.updated_at);
        if (!readme) return null;
        return {
            type: 'project',
            title: `📁 ${project.name}`,
            date: project.updated_at.slice(0,10),
            content: readme.text,
            url: project.html_url,
            projectName: project.name
        };
    });
    const projectNews = (await Promise.all(readmePromises)).filter(item => item !== null);
    allNewsItems.push(...projectNews);

    // 3. Сортировка по дате (новые сверху)
    allNewsItems.sort((a,b) => new Date(b.date) - new Date(a.date));

    if (allNewsItems.length === 0) {
        newsContainer.innerHTML = '<div class="news-card">Новостей пока нет. Добавьте через Firebase или дождитесь проектов с README.</div>';
        return;
    }

    newsContainer.innerHTML = '';
    for (const item of allNewsItems) {
        const card = document.createElement('div');
        card.className = 'news-card';
        if (item.type === 'manual') {
            card.innerHTML = `
                <div class="news-title">📰 ${escapeHtml(item.title)}</div>
                <div class="news-date">📅 ${formatDate(item.date)}</div>
                <div class="news-content">${escapeHtml(item.content)}</div>
            `;
        } else {
            card.innerHTML = `
                <div class="news-title">${escapeHtml(item.title)}</div>
                <div class="news-date">🕒 Обновлён: ${formatDate(item.date)}</div>
                <div class="news-content">${escapeHtml(item.content)}</div>
                <a href="${item.url}" target="_blank" class="project-link">🔗 Подробнее на GitHub</a>
            `;
        }
        newsContainer.appendChild(card);
    }
}

// ========== 5. ГОСТЕВАЯ КНИГА (FIRESTORE) ==========
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
            let dateStr = 'только что';
            if (c.timestamp && c.timestamp.toDate) dateStr = c.timestamp.toDate().toLocaleString();
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-author">✍️ ${escapeHtml(c.name)}</div>
                <div class="comment-date">🕒 ${dateStr}</div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
            `;
            commentsList.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        commentsList.innerHTML = '<div class="comment-item">❌ Ошибка загрузки</div>';
    }
}

async function addComment(name, text) {
    if (!name.trim() || !text.trim()) { alert("Заполните имя и текст!"); return false; }
    try {
        await addDoc(collection(window.db, 'comments'), {
            name: name.trim(),
            text: text.trim(),
            timestamp: serverTimestamp()
        });
        return true;
    } catch (err) {
        console.error(err);
        alert("Не удалось отправить комментарий.");
        return false;
    }
}

const submitCommentBtn = document.getElementById('submit-comment');
if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', async () => {
        const name = document.getElementById('comment-name').value;
        const text = document.getElementById('comment-text').value;
        const ok = await addComment(name, text);
        if (ok) {
            document.getElementById('comment-name').value = '';
            document.getElementById('comment-text').value = '';
            loadComments();
        }
    });
}

// ========== 6. ФОРМА СВЯЗИ (FIRESTORE) ==========
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
                name, email, message,
                timestamp: serverTimestamp(),
                read: false
            });
            formFeedback.innerHTML = '<span style="color:green;">✅ Сообщение отправлено! Я отвечу вам.</span>';
            contactForm.reset();
            setTimeout(() => formFeedback.innerHTML = '', 5000);
        } catch (err) {
            console.error(err);
            formFeedback.innerHTML = '<span style="color:red;">❌ Ошибка, попробуйте позже.</span>';
        }
    });
}

// ========== 7. СТАРТ ==========
window.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadNews();
    loadComments();  // предзагрузим, но отобразится при переключении
    switchSection('projects');
});