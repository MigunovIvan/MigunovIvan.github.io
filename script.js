// ----- элементы -----
const themeBtn = document.getElementById('toggle-theme');
const projectsGrid = document.getElementById('projects-grid');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const counterSpan = document.querySelector('#counter span');
const errorMsgDiv = document.getElementById('error-message');
const retryBtn = document.getElementById('retry');

let allProjects = [];       // все проекты из API
let filteredSorted = [];    // текущий список

const GITHUB_USER = 'MigunovIvan';

// ----- тёмная тема -----
function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        themeBtn.textContent = '☀️';
    } else if (saved === 'light') {
        document.body.classList.remove('dark');
        themeBtn.textContent = '🌙';
    } else {
        // если система в тёмном режиме
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

// ----- вспомогательные функции -----
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// создание карточки с fallback для изображения
function createCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';

    // картинка
    const img = document.createElement('img');
    img.className = 'project-img';
    img.src = `images/${project.name}.png`;
    img.alt = project.name;
    img.onerror = function() {
        // если картинка не загрузилась — заменяем на цветной блок с названием
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

// отрисовка (фильтр + сортировка)
function render() {
    // фильтр
    const query = searchInput.value.trim().toLowerCase();
    let filtered = allProjects.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
    );

    // сортировка
    const sortType = sortSelect.value;
    if (sortType === 'stars') {
        filtered.sort((a,b) => b.stargazers_count - a.stargazers_count);
    } else if (sortType === 'updated') {
        filtered.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else {
        filtered.sort((a,b) => a.name.localeCompare(b.name));
    }

    filteredSorted = filtered;
    counterSpan.textContent = filteredSorted.length;

    projectsGrid.innerHTML = '';
    if (filteredSorted.length === 0) {
        projectsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;">😕 Нет проектов по запросу</div>`;
        return;
    }

    for (let p of filteredSorted) {
        projectsGrid.appendChild(createCard(p));
    }
}

// скелетоны загрузки
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

// загрузка с GitHub
async function loadProjects() {
    showSkeletons();
    errorMsgDiv.style.display = 'none';

    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        const repos = await res.json();
        // исключаем форки (можно убрать если нужно показывать форки)
        allProjects = repos.filter(r => !r.fork);
        if (allProjects.length === 0) {
            projectsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center">📭 Репозитории не найдены</div>';
        } else {
            render();
        }
    } catch (err) {
        console.error(err);
        errorMsgDiv.style.display = 'block';
        projectsGrid.innerHTML = '';
    }
}

// обработчики событий
searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);
retryBtn.addEventListener('click', () => loadProjects());

// запуск
loadTheme();
loadProjects();