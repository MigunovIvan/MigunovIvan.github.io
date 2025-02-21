document.getElementById('toggle-theme').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
});

async function fetchGitHubRepos() {
    let response = await fetch("https://api.github.com/users/MigunovIvan/repos");
    let repos = await response.json();
    let projectList = document.getElementById("project-list");

    repos.forEach(repo => {
        let projectDiv = document.createElement("div");
        projectDiv.innerHTML = `
            <h3>${repo.name}</h3>
            <p>${repo.description || "No description available"}</p>
            <a href="${repo.html_url}" target="_blank">View on GitHub</a>
            <img src="Windows.png" alt="Windows Icon" class="windows-icon">
        `;
        projectList.appendChild(projectDiv);
    });
}

fetchGitHubRepos();
