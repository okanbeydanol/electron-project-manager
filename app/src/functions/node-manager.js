const {ChildProcess} = require('./child_process');
const {BrewManager} = require('./brew-manager');

class NodeManager extends ChildProcess {
    BrewManager = new BrewManager();

    constructor() {
        super();
    }

    async getNodeVersion() {
        return new Promise(async (resolve) => {
            await this.execCommand('node -v', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Node not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async getNvmVersion() {
        return new Promise(async (resolve) => {
            const command = 'nvm -v';
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Nvm not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async installNvm(nvmVersion = 'v0.39.2') {
        return new Promise(async (resolve) => {
            let wgetVersion = await this.wgetVersion();
            if (wgetVersion.error) {
                const installWgetWithBrew = await this.installWgetWithBrew();
                if (installWgetWithBrew.error) {
                    return resolve(installWgetWithBrew);
                }

                wgetVersion = await this.wgetVersion();
                if (wgetVersion.error) {
                    return resolve(wgetVersion);
                }
            }

            await this.execCommand('wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/' + nvmVersion + '/install.sh | bash', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Nvm not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async installWgetWithBrew() {
        return new Promise(async (resolve) => {
            // Brew Version
            let brewVersion = await this.BrewManager.getBrewVersion();
            if (brewVersion.error) {
                const installBrew = await this.tryInstallBrew();
                if (installBrew.error) {
                    return resolve(installBrew);
                }
                brewVersion = await this.BrewManager.getBrewVersion();
                if (brewVersion.error) {
                    return resolve(installBrew);
                }
            }
            this.BREW_VERSION = brewVersion.data;
            await this.execCommand('eval "$(~/homebrew/bin/brew shellenv)"&&brew install wget', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Wget cannot install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async wgetVersion() {
        return new Promise((resolve) => {
            this.execCommand('wget -V', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Wget not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }


    async installNode(nodeVersion) {
        return new Promise(async (resolve) => {
            const command = await this.installNodeVersionWithNvmText(nodeVersion);
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Nvm not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async removeNode(nodeVersion, nodeVersion2) {
        return new Promise(async (resolve) => {
            const command = await this.setNodeVersionWithNvmText(nodeVersion2) + '&&' + await this.removeNodeVersionWithNvmText(nodeVersion) + '&&' + await this.setNodeVersionWithNvmText(nodeVersion2);
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Nvm not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async setNodeVersionWithNvmText(node_version) {
        return new Promise((resolve) => {
            resolve('nvm use ' + node_version + '&&nvm alias default ' + node_version);
        });
    }

    async exportNvmDirPathEcho() {
        return new Promise((resolve) => {
            resolve(`echo 'export NVM_DIR="$HOME/.nvm"&&[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc`);
        });
    }

    async removeNodeVersionWithNvmText(node_version) {
        return new Promise((resolve) => {
            resolve('nvm uninstall ' + node_version);
        });
    }

    async installNodeVersionWithNvmText(node_version) {
        return new Promise((resolve) => {
            resolve('nvm install ' + node_version + '&&nvm use ' + node_version + '&&nvm alias default ' + node_version);
        });
    }
}


module.exports = {NodeManager};
