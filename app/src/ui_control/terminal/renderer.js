const commandInput = document.getElementById('command-input');
const terminal = document.getElementById('terminal');
const container = document.getElementById('container');
const commandInputLabel = document.getElementById('command-input-label');

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        window.terminalDetail.listenCommandNode((ev, value) => {
            if (value.type === 'stderr' || value.type === 'stdout') {
                const span = document.createElement('span');
                span.setAttribute('style', 'display: block;')
                span.innerHTML = value.data
                terminal.insertAdjacentElement('beforeend', span);
            } else if (!value.type) {
                const span = document.createElement('span');
                span.setAttribute('style', 'display: block;margin-top:16px;padding: 16px;color: #976262;')
                span.innerHTML = value.data
                terminal.insertAdjacentElement('beforeend', span);
            } else if (value.type === 'folder_change') {
                commandInputLabel.innerText = value.data;
            }
        });

    }, 1000);
});

