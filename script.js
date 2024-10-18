const username = "MigunovIvan";  // твой GitHub username
const projectList = document.getElementById('project-list');

// Функция для получения списка репозиториев пользователя
async function fetchGitHubProjects() {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const projects = await response.json();
        displayProjects(projects);
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
    }
}

// Функция для отображения репозиториев на странице
function displayProjects(projects) {
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.classList.add('project');

        projectElement.innerHTML = `
            <h3><a href="${project.html_url}" target="_blank">${project.name}</a></h3>
            <p>${project.description || 'No description provided.'}</p>
        `;

        projectList.appendChild(projectElement);
    });
}

// Запускаем функцию для загрузки проектов при загрузке страницы
fetchGitHubProjects();
