// Тёмная тема
document.getElementById('toggle-theme').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    this.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Автоматическая загрузка проектов с GitHub
async function fetchGitHubProjects() {
    const username = "MigunovIvan";
    const response = await fetch(`https://api.github.com/users/${username}/repos`);
    
    if (!response.ok) {
        console.error("Ошибка загрузки проектов:", response.status);
        document.getElementById('project-container').innerHTML = "<p>Ошибка загрузки проектов.</p>";
        return;
    }
    
    const projects = await response.json();
    console.log("Загруженные проекты:", projects);
    const projectContainer = document.getElementById('project-container');
    projectContainer.innerHTML = ""; // Очищаем сообщение "Загрузка проектов..."

    if (projects.length === 0) {
        projectContainer.innerHTML = "<p>Проекты не найдены.</p>";
        return;
    }
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.classList.add('project-card');
        
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
