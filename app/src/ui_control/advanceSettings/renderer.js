const loaderContainer = document.getElementById('loader-container');
const projectContainer = document.getElementById('project-container');
const errorContainer = document.getElementById('error-container');
const dependenciesContainer = document.getElementById('dependencies-container');
const fixesAndroid = document.getElementById('fixes-android');
const fixesIos = document.getElementById('fixes-ios');
const fixesNodeModules = document.getElementById('fixes-node_modules');
const addNewPackageButton = document.getElementById('add-new-package-button');
const addPackageButton = document.getElementById('add-package');
const packageNameInput = document.getElementById('package_name');
const addNewModulesButton = document.getElementById('add-new-node_modules-fix');
const testTextArea = document.getElementById('test-textarea');
const commandInput = document.getElementById('command_input');


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const result = await window.projectDetail.startReadAdvance();
        console.log('%c result', 'background: #222; color: #bada55', result);
        if (result.error) {
            loaderContainer.classList.add('--hidden');
            errorContainer.classList.remove('--hidden');
        } else {
            const dependencies = await create_tree(result.data.package_json.package_json_dependencies, 'Dependencies');
            const devDependencies = await create_tree(result.data.package_json.package_json_devDependencies, 'Dev Dependencies');

            dependenciesContainer.appendChild(dependencies);
            dependenciesContainer.appendChild(devDependencies);

            result.data.node_modules_fixes.map(async (d) => {
                const icons = await createIcons('Plugin: ' + d.plugin + ', Name: ' + d.name + ', Type: ' + d.type);
                fixesNodeModules.appendChild(icons);
            });

            result.data.android_fixes.map(async (d) => {
                const icons = await createIcons('Plugin: ' + d.plugin + ', Name: ' + d.name + ', Type: ' + d.type);
                fixesAndroid.appendChild(icons);
            });

            result.data.ios_fixes.map(async (d) => {
                const icons = await createIcons('Plugin: ' + d.plugin + ', Name: ' + d.name + ', Type: ' + d.type);
                fixesIos.appendChild(icons);
            });

            loaderContainer.classList.add('--hidden');
            projectContainer.classList.remove('--hidden');

            const toggler = document.getElementsByClassName('caret');
            let i;
            for (i = 0; i < toggler.length; i++) {
                toggler[i].addEventListener('click', function () {
                    this.parentElement.querySelector('.nested').classList.toggle('active');
                    this.classList.toggle('caret-down');
                });
            }

        }
    }, 1000);
});
const createIcons = async (title) => {
    return new Promise(
        async (resolve) => {
            const createDiv = document.createElement('div');
            createDiv.setAttribute('class', 'fixes');

            const createSpan = document.createElement('span');
            createSpan.innerText = title;
            createDiv.appendChild(createSpan);

            const iconContainer = document.createElement('div');
            iconContainer.setAttribute('class', 'icon-container');
            const trashIcon = document.createElement('i');
            trashIcon.setAttribute('class', 'fa-solid fa-trash');
            const penIcon = document.createElement('i');
            penIcon.setAttribute('class', 'fa-solid fa-pen');
            iconContainer.appendChild(penIcon);
            iconContainer.appendChild(trashIcon);
            createDiv.appendChild(iconContainer);
            resolve(createDiv);
        }
    );
};

const create_tree = async (dependencies, title) => {
    return new Promise(
        async (resolve) => {
            const treeContainerUl = document.createElement('ul');
            treeContainerUl.setAttribute('id', 'tree-container');

            const treeContainerLi = document.createElement('li');

            const titleSpan = document.createElement('span');
            titleSpan.setAttribute('class', 'caret');
            titleSpan.innerText = title;
            treeContainerLi.appendChild(titleSpan);

            const nestedUl = document.createElement('ul');
            nestedUl.setAttribute('class', 'nested');

            Object.keys(dependencies).map((value) => {
                const nestedLi = document.createElement('li');

                const trashIcon = document.createElement('i');
                trashIcon.setAttribute('class', 'fa-solid fa-trash');

                const liSpan = document.createElement('span');
                liSpan.setAttribute('class', 'title');
                liSpan.innerText = value + ': ' + dependencies[value];

                nestedLi.appendChild(liSpan);
                nestedLi.appendChild(trashIcon);
                nestedUl.appendChild(nestedLi);
            });

            treeContainerLi.appendChild(nestedUl);
            treeContainerUl.appendChild(treeContainerLi);
            resolve(treeContainerUl);
        }
    );
};
/*
<ul id="tree-container">
    <li>
    <span class="caret">Beverages</span>
    <ul class="nested">
            <li>Water</li>
            <li>Coffee</li>
            <li><span class="caret">Tea</span>
                <ul class="nested">
                    <li>Black Tea</li>
                    <li>White Tea</li>
                    <li><span class="caret">Green Tea</span>
                        <ul class="nested">
                            <li>Sencha</li>
                            <li>Gyokuro</li>
                            <li>Matcha</li>
                            <li>Pi Lo Chun</li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </li>
</ul>*/
