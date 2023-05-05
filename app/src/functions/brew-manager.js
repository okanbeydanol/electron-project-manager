const {ChildProcess} = require('./child_process');
const {FsManager} = require("./fs-manager");

class BrewManager extends ChildProcess {

    constructor() {
        super();
    }

    async getBrewVersion() {
        return new Promise((resolve) => {
            this.execCommand('eval "$(~/homebrew/bin/brew shellenv)"&&brew -v ', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Brew not install!'});
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

    async installBrew(password) {
        return new Promise(async (resolve) => {
            const checkPermission = await this.checkPermission();
            if (checkPermission.error) {
                return resolve(checkPermission);
            }
            const removeFolder = await this.removeFolder();
            if (removeFolder.error) {
                return resolve(removeFolder);
            }
            const createFolder = await this.createFolder();
            if (createFolder.error) {
                return resolve(createFolder);
            }
            const cloneBrew = await this.cloneBrew();
            if (cloneBrew.error) {
                return resolve(cloneBrew);
            }

            const exportAndUpdateBrew = await this.exportAndUpdateBrew();
            if (exportAndUpdateBrew.error) {
                return resolve(exportAndUpdateBrew);
            }

            return resolve({
                error: false,
                data: exportAndUpdateBrew.data
            });
        });
    }

    async exportAndUpdateBrew() {
        return new Promise((resolve) => {
            this.execCommand('eval "$(homebrew/bin/brew shellenv)"&&brew update --force --quiet&&chmod -R go-w "$(brew --prefix)/share/zsh"', (event) => {
                console.log('%c event11', 'background: #222; color: #bada55', event);
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Brew cannot update!'});
                }

                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });

        });
    }

    async cloneBrew() {
        return new Promise((resolve) => {
            this.execCommand('git clone -q --verbose https://github.com/Homebrew/brew ~/homebrew', (event) => {
                console.log('%c event22', 'background: #222; color: #bada55', event);

                if (event.error) {
                    return resolve({error: true, data: null, message: 'We cannot clone!'});
                }

                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async removeFolder() {
        return new Promise((resolve) => {
            this.execCommand("rm -rf ~/homebrew", (event) => {
                console.log('%c event33', 'background: #222; color: #bada55', event);

                if (event.type === 'error:end') {
                    return resolve({
                        error: false,
                        data: true
                    });
                }
                if (event.error) {
                    return resolve({error: true, data: null, message: 'We cannot remove homebrew folder!'});
                }

                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }

    async createFolder() {
        return new Promise((resolve) => {
            this.execCommand("mkdir ~/homebrew", (event) => {
                console.log('%c event4444', 'background: #222; color: #bada55', event);
                if (event.type === 'error:end') {
                    return resolve({
                        error: false,
                        data: true
                    });
                }
                if (event.error) {

                    return resolve({error: true, data: null, message: 'We cannot remove homebrew folder!'});
                }

                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }


    async checkPermission() {
        return new Promise((resolve) => {
            this.execCommand("chmod u+rwx ~/homebrew", (event) => {
                console.log('%c event666', 'background: #222; color: #bada55', event);
                if (event.type === 'error:end') {
                    return resolve({
                        error: false,
                        data: true
                    });
                }
                if (event.error) {

                    return resolve({error: true, data: null, message: 'We cannot remove homebrew folder!'});
                }

                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            });
        });
    }
}


module.exports = {BrewManager};
