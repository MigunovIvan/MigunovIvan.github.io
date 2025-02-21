document.getElementById('toggle-theme').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
});

document.querySelectorAll('.expand-btn').forEach(button => {
    button.addEventListener('click', function () {
        const projectInfo = this.parentElement;
        projectInfo.classList.toggle('expanded');
        this.textContent = projectInfo.classList.contains('expanded') ? 'Назад' : 'Развернуть';
    });
});
