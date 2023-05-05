const {ChildProcess} = require('./child_process');

class GradleManager extends ChildProcess {
    constructor() {
        super();
    }

    async getGradleVersion() {
        return new Promise((resolve) => {
            this.execCommand('gradle -v', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Gradle not install!'});
                }

                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: new RegExp(/(\/*Gradle \S+\/*)/).exec(event.data.trim())[0].split('Gradle ')[1]
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: new RegExp(/(\/*Gradle \S+\/*)/).exec(event.data.trim())[0].split('Gradle ')[1]
                    });
                }
            });
        });
    }

    async installGradle() {
        return new Promise(async (resolve) => {
            const command = 'eval "$(~/homebrew/bin/brew shellenv)"&&brew install gradle';
            await this.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Gradle not install!'});
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


module.exports = {GradleManager};
