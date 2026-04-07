// ========== DOM элементы ==========
const themeToggle = document.getElementById('toggle-theme');
const projectContainer = document.getElementById('project-container');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const projectsCounterSpan = document.querySelector('#projects-counter span');
const errorDiv = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');

// Состояние
let allProjects = [];       // исходные проекты из API
let currentFiltered = [];   // отфильтрованные/отсортированные

// Имя пользователя GitHub
const GITHUB_USERNAME = 'MigunovIvan';

// ========== ТЁМНАЯ ТЕМА с localStorage ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    } else {
        // Если система предпочитает тёмную
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        }
    }
    updateThemeButton();
}

function updateThemeButton() {
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    updateThemeButton();
});

// ========== ОБРАБОТКА ИЗОБРАЖЕНИЙ (fallback) ==========
function handleImageError(imgElement, projectName) {
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'image-placeholder';
    placeholderDiv.innerHTML = `
        <i class="fab fa-github"></i>
        <span>${projectName}</span>
    `;
    imgElement.parentNode.replaceChild(placeholderDiv, imgElement);
}

// ========== СОЗДАНИЕ КАРТОЧКИ ПРОЕКТА ==========
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // Изображение (локальное / fallback)
    const imgSrc = `images/${project.name}.png`;
    const img = document.createElement('img');
    img.className = 'project-image';
    img.src = imgSrc;
    img.alt = project.name;
    img.loading = 'lazy';
    img.onerror = () => handleImageError(img, project.name);
    
    // Форматирование даты
    const updatedDate = new Date(project.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Язык и звёзды
    const language = project.language || 'N/A';
    const stars = project.stargazers_count || 0;
    const starIcon = stars > 0 ? `<i class="fas fa-star"></i> ${stars}` : '<i class="far fa-star"></i> 0';
    
    // Содержимое карточки
    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-content';
    contentDiv.innerHTML = `
        <h3 class="project-title">${escapeHtml(project.name)}</h3>
        <p class="project-description">${escapeHtml(project.description || 'Нет описания')}</p>
        <div class="project-meta">
            <div class="meta-item"><i class="fas fa-code"></i> ${escapeHtml(language)}</div>
            <div class="meta-item">${starIcon}</div>
            <div class="meta-item"><i class="fas fa-calendar-alt"></i> ${updatedDate}</div>
        </div>
        <a href="${project.html_url}" class="project-link" target="_blank" rel="noopener noreferrer">
            GitHub <i class="fab fa-github"></i>
        </a>
    `;
    
    card.appendChild(img);
    card.appendChild(contentDiv);
    return card;
}

// Простая защита от XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ОТРИСОВКА ПРОЕКТОВ (с учётом фильтрации и сортировки) ==========
function renderProjects() {
    // Фильтрация
    const searchTerm = searchInput.value.trim().toLowerCase();
    let filtered = allProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) || 
        (project.description && project.description.toLowerCase().includes(searchTerm))
    );
    
    // Сортировка
    const sortBy = sortSelect.value;
    if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'stars') {
        filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (sortBy === 'updated') {
        filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    
    currentFiltered = filtered;
    
    // Обновляем счётчик
    projectsCounterSpan.textContent = currentFiltered.length;
    
    // Очищаем контейнер
    projectContainer.innerHTML = '';
    
    if (currentFiltered.length === 0) {
        projectContainer.innerHTML = `<div class="error-state" style="display:flex;"><i class="fas fa-folder-open"></i><p>Проекты не найдены 🧐</p></div>`;
        return;
    }
    
    // Добавляем карточки в DOM
    currentFiltered.forEach(project => {
        projectContainer.appendChild(createProjectCard(project));
    });
}

// ========== ЗАГРУЗКА ДАННЫХ С GITHUB ==========
async function fetchGitHubProjects() {
    // Показываем скелетоны
    showSkeletons();
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const repos = await response.json();
        // Фильтруем форки (по желанию можно оставить все)
        allProjects = repos.filter(repo => !repo.fork);
        
        if (allProjects.length === 0) {
            projectContainer.innerHTML = `<div class="error-state"><i class="fas fa-info-circle"></i><p>Репозитории не найдены</p></div>`;
            return;
        }
        
        renderProjects();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        errorDiv.style.display = 'flex';
        projectContainer.innerHTML = '';
    }
}

// Скелетоны загрузки
function showSkeletons() {
    projectContainer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line" style="width: 80%"></div>
            </div>
        `;
        projectContainer.appendChild(skeleton);
    }
}

// ========== ОБРАБОТЧИКИ ФИЛЬТРОВ ==========
searchInput.addEventListener('input', () => renderProjects());
sortSelect.addEventListener('change', () => renderProjects());
retryBtn.addEventListener('click', () => fetchGitHubProjects());

// ========== СТАРТ ==========
initTheme();
fetchGitHubProjects();