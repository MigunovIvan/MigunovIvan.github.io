// ========== Тёмная тема ==========
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

// ========== Навигация между разделами ==========
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

function switchSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) btn.classList.add('active');
    });
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

// ========== Проекты (GitHub API) ==========
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

// ========== Новости (статичные) ==========
const newsContainer = document.getElementById('news-container');
const newsData = [
    { title: "🚀 Запуск обновлённого портфолио", date: "2025-04-07", content: "Добавил разделы с новостями и контактами. Проекты загружаются с GitHub." },
    { title: "📚 Изучаю React и TypeScript", date: "2025-03-28", content: "Планирую переписать некоторые проекты на современный стек." },
    { title: "💡 Идея для open-source", date: "2025-03-15", content: "Хочу сделать утилиту для автоматической генерации документации." }
];

function renderNews() {
    if (!newsContainer) return;
    newsContainer.innerHTML = '';
    newsData.forEach(news => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-title">${escapeHtml(news.title)}</div>
            <div class="news-date">📅 ${news.date}</div>
            <div class="news-content">${escapeHtml(news.content)}</div>
        `;
        newsContainer.appendChild(card);
    });
}

// ========== Старт ==========
loadTheme();
loadProjects();
renderNews();
switchSection('projects'); // показываем проекты по умолчанию