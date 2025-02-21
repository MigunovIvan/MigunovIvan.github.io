// Тёмная тема
document.getElementById('toggle-theme').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    this.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Раскрытие проектов
document.querySelectorAll('.expand-btn').forEach(button => {
    button.addEventListener('click', function () {
        const projectInfo = this.closest('.project-card');
        const hiddenContent = projectInfo.querySelector('.hidden-content');
        
        if (hiddenContent) {
            hiddenContent.classList.toggle('visible');
            this.textContent = hiddenContent.classList.contains('visible') ? 'Назад' : 'Развернуть';
        }
    });
});
