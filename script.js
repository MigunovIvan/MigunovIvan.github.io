const username = "MigunovIvan";  // твой GitHub username
const projectList = document.getElementById('project-list');

// Описания для репозиториев
const repoDescriptions = {
    "Time_Chisinau": "Точная информация о дате и времени в Кишинёве. Удобный интерфейс. Легкость в использовании. 💻 Виджет на Windows, который можно добавить в автозагрузку. Для использования достаточно скачать на ПК и запустить Time.exe. 👉 Адаптирован для тёмной темы Windows.",
    "News_Moldova": "Deschide instant grupul pe Windows cu un singur clic! Открывай группу на Windows в 1 клик!",
    "Facebook_Auto_Lo-gin": "🚀 Новый проект на GitHub: Facebook Auto Login. Сэкономьте время с автоматическим входом в Facebook! Простой интерфейс, поддержка нескольких профилей, хранение логинов и паролей. Вход в один клик. Бесплатный и open-source. 🌟 Попробуйте сейчас!",
    "Meteo_Chisinau": "Новая программа для прогноза погоды — \"Meteo Chisinau\"! Прогноз на сегодня и завтра, часовой прогноз, поддержка светлого и тёмного режимов."
};

// Функция для получения списка репозиториев
async function fetchGitHubProjects() {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const projects = await response.json();
        displayProjects(projects);
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
    }
}

// Функция для отображения репозиториев
function displayProjects(projects) {
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.classList.add('project');

        const repoName = project.name;
        const repoDescription = repoDescriptions[repoName] || project.description || 'No description provided.';

        projectElement.innerHTML = `
            <img src="https://raw.githubusercontent.com/${username}/${repoName}/main/cover.png" alt="${repoName} cover" onerror="this.src='default-cover.png';">
            <h3><a href="${project.html_url}" target="_blank">${project.name}</a></h3>
            <p>${repoDescription}</p>
        `;

        projectList.appendChild(projectElement);
    });
}

// Запускаем функцию для загрузки проектов при загрузке страницы
fetchGitHubProjects();
