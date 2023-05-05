const loaderContainer = document.getElementById('loader-container');
const projectContainer = document.getElementById('project-container');
const errorContainer = document.getElementById('error-container');
const branchesSelect = document.getElementById('branches');
const advanceSettings = document.getElementById('advance_settings');
const androidCleanerButton = document.getElementById('android_cleaner_button');


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const result = await window.projectDetail.startRead();
        console.log('%c result', 'background: #222; color: #bada55', result);
        if (result.error) {
            loaderContainer.classList.add('--hidden');
            errorContainer.classList.remove('--hidden');
        } else {
            const branches = result.data.branches;
            branchesSelect.innerHTML = '';
            branches.map((branch) => {
                const option = document.createElement('option');
                option.text = branch.name;
                option.value = branch.name;
                branchesSelect.appendChild(option);
            });


            const findIndex = Array.from(branchesSelect.options).findIndex((o) => o.value === result.data.gitConfig.currentBranch);
            if (findIndex !== -1) {
                branchesSelect.options[findIndex].selected = true;
            }

            $('#branches').select2({
                theme: 'dark'
            });
            loaderContainer.classList.add('--hidden');
            projectContainer.classList.remove('--hidden');
        }
        androidCleanerButton.addEventListener('click', () => {
            window.projectDetail.startAndroidCleaner();
        });
        if (advanceSettings) {
            advanceSettings.addEventListener('click', async () => {
                const result = await window.projectDetail.openAdvanceSettings();
            });
        }
    }, 1000);
});
