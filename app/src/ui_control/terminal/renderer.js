const loaderContainer = document.getElementById('loader-container');
const projectContainer = document.getElementById('project-container');
const abort = document.getElementById('abort');


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        /*        loaderContainer.classList.add('--hidden');
                errorContainer.classList.remove('--hidden');*/
        loaderContainer.classList.add('--hidden');

        projectContainer.classList.remove('--hidden');
        abort.addEventListener('click', () => {
            window.projectDetail.abortTerminal();
        });
    }, 1000);
});

