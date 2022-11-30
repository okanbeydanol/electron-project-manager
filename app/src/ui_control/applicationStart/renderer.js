const swpBtn = document.getElementById('swap-btn');
const toggle = document.getElementById('toggle');
const loader = document.getElementById('loader');
const project = document.getElementById('project');
const projectAdd = document.getElementById('project-add');
const refreshContainer = document.getElementById('refresh-container');
const trashContainer = document.getElementById('trash-container');
const androidIosTitle = document.getElementById('android-ios-title');
const android = document.getElementById('android');
const ios = document.getElementById('ios');

swpBtn.addEventListener('change', async () => {
    if (toggle.getAttribute('checked') !== null) {
        toggle.removeAttribute('checked');
    } else {
        toggle.setAttribute('checked', '');
    }
    await window.mode.switch();
});

const startLoading = async () => {
    project.classList.add('--hidden');
    projectAdd.classList.add('--hidden');
    refreshContainer.classList.add('--hidden');
    loader.classList.remove('--hidden');
    trashContainer.classList.add('--hidden');
};
const addFolder = async () => {
    await startLoading();
    const result = await window.path.addFolder();
    if (!result.error) {
        android.innerText = 'Android: v' + result.data.androidVersion + '(' + result.data.androidBuildNumber + ')';
        ios.innerText = 'Ios: v' + result.data.iosVersion + '(' + result.data.iosBuildNumber + ')';
        androidIosTitle.innerText = result.data.projectTitle;
        project.classList.remove('--hidden');
        projectAdd.classList.add('--hidden');
        loader.classList.add('--hidden');
        refreshContainer.classList.remove('--hidden');
        trashContainer.classList.remove('--hidden');
    } else {
        await showPlus();
    }
};
const showPlus = async () => {
    project.classList.add('--hidden');
    projectAdd.classList.remove('--hidden');
    loader.classList.add('--hidden');
    refreshContainer.classList.add('--hidden');
    trashContainer.classList.add('--hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (toggle) {
            setTimeout(async () => {
                const att = toggle.getAttribute('checked');
                const theme = await window.toggleInput.reset();

                if (theme && att !== null) {
                    toggle.removeAttribute('checked');
                }
                if (!theme && att === null) {
                    toggle.setAttribute('checked', '');
                }
            }, 1);
        }

        if (swpBtn) {
            setTimeout(async () => {
                const att = swpBtn.getAttribute('checked');
                const theme = await window.toggleInput.reset();

                if (!theme && att !== null) {
                    swpBtn.removeAttribute('checked');
                }
                if (theme && att === null) {
                    swpBtn.setAttribute('checked', '');
                }
            }, 1);
        }


        if (loader && project && projectAdd) {
            setTimeout(async () => {
                const result = await window.path.checkFolder();
                console.log('%c result', 'background: #222; color: #bada55', result);
                if (result.error) {
                    await showPlus();
                } else {
                    android.innerText = 'Android: v' + result.data.androidVersion + '(' + result.data.androidBuildNumber + ')';
                    ios.innerText = 'Ios: v' + result.data.iosVersion + '(' + result.data.iosBuildNumber + ')';
                    androidIosTitle.innerText = result.data.projectTitle;
                    project.classList.remove('--hidden');
                    projectAdd.classList.add('--hidden');
                    loader.classList.add('--hidden');
                    refreshContainer.classList.remove('--hidden');
                    trashContainer.classList.remove('--hidden');
                }
            }, 1000);
            projectAdd.addEventListener('click', async (ev) => {
                await addFolder();
            });
            refreshContainer.addEventListener('click', async (ev) => {
                await addFolder();
            });
            trashContainer.addEventListener('click', async (ev) => {
                await startLoading();
                setTimeout(async () => {
                    const result = await window.path.removeFolder();
                    if (result) {
                        await showPlus();
                    }
                }, 400);

            });
            project.addEventListener('click', async (ev) => {
                window.projectBridge.open();
            });

        }
    }, 1000);
});
