document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("toggle-theme");
    const body = document.body;

    // Проверяем сохраненную тему в localStorage
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
    }

    themeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");

        // Сохраняем состояние темы в localStorage
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }
    });
});
