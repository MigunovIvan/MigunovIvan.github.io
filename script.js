// Тёмная тема
document.getElementById('toggle-theme').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    this.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Автоматическая загрузка проектов с GitHub
async function fetchGitHubProjects() {
    const username = "MigunovIvan"; // Твой GitHub username
    const response = await fetch(`https://api.github.com/users/${username}/repos`);
    const projects = await response.json();
    const projectContainer = document.getElementById('project-container');

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.classList.add('project-card');
        
        // Подставляем изображение проекта, если его нет — `default.png`
        const projectImage = `images/${project.name}.png`;

        projectCard.innerHTML = `
            <img src="${projectImage}" alt="${project.name}" class="project-image" onerror="this.src='images/default.png'">
            <h3>${project.name}</h3>
            <p>${project.description || "Описание отсутствует"}</p>
            <a href="${project.html_url}" target="_blank">Перейти на GitHub</a>
        `;

        projectContainer.appendChild(projectCard);
    });
}

fetchGitHubProjects();
