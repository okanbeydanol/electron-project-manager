const { ChildProcess } = require('./child_process');

class BrewManager extends ChildProcess {

    constructor() {
        super();
    }

    async getBrewVersion() {
        return new Promise((resolve) => {
            this.execCommand('brew -v', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Brew not install!' });
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

    async installBrew() {
        return new Promise((resolve) => {
            this.execCommand('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', (event) => {
                if (event.error) {
                    return resolve({ error: true, data: null, message: 'Brew not install!' });
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

}


module.exports = { BrewManager };
