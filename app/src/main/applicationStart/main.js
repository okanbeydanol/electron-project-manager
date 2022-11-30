'use strict';
const { CordovaManager } = require('../../functions/cordova-manager');
const { app, BrowserWindow, ipcMain, nativeTheme, ipcRenderer } = require('electron');
const path = require('path');
const { dialog } = require('electron');
const { writeFileSync } = require('fs');
const request = require('request');
const { homedir } = require('os');
const { join } = require('path');
const { ChildProcess } = require('../../functions/child_process');
const { FsManager } = require('../../functions/fs-manager');
const { PackageJsonManager } = require('../../functions/package_json_control');
const { AndroidCleaner } = require('../../functions/android-cleaner');
const config_path = path.join(__dirname, '../../config');
(async () => {

    const config = await new FsManager().readFile(config_path + '/settings.json', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then((d) => {
        return JSON.parse(d.data);
    });
    const node_modules_fixes = await new FsManager().readFile(config_path + '/node_modules_fixes.json', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then((d) => {
        return JSON.parse(d.data);
    });
    const android_fixes = await new FsManager().readFile(config_path + '/android_fixes.json', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then((d) => {
        return JSON.parse(d.data);
    });
    const ios_fixes = await new FsManager().readFile(config_path + '/ios_fixes.json', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then((d) => {
        return JSON.parse(d.data);
    });
    const builds = config.builds;
    const scripts = config.scripts;
    const keystore_config = config.keystore;
    const build_android = config['build-android'];
    const build_ios = config['build-ios'];
    const desktop_dir = join(homedir(), build_android.output.direction);
    const folders = config.folders;
    const types = { remove: 0, add: 1, replace: 2 };
    const env = process.env.NODE_ENV || 'development';
    let mainWindow = null;
    let projectDetailWindow = null;
    let advanceSettingsWindow = null;
    let currentBranch = 'master';
    let github_project_url = null;
    let android_version = null;
    let ios_version = null;
    let android_build_number = null;
    let ios_build_number = null;
    const createWindow = async () => {
        mainWindow = new BrowserWindow({
            width: 300,
            height: 320,
            webPreferences: {
                devTools: false,
                disableHtmlFullscreenWindowResize: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                webSecurity: true,
                experimentalFeatures: false,
                contextIsolation: true,
                preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js')
            }
        });
        // Open the DevTools.
        await mainWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/applicationStart/index.html'));
        mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
    };

    const startHandle = async () => {
        //Backend Response
        //Dark Theme Light Theme Toggle Response
        ipcMain.handle('switch-checked:toggle', () => {
            if (nativeTheme.shouldUseDarkColors) {
                nativeTheme.themeSource = 'light';
            } else {
                nativeTheme.themeSource = 'dark';
            }
            return nativeTheme.shouldUseDarkColors;
        });

        ipcMain.handle('toggle-input:reset', (ev) => {
            return nativeTheme.shouldUseDarkColors;
        });

        ipcMain.handle('folder-process:check', async (ev) => {
            return await readConfigXml();
        });

        ipcMain.handle('folder-process:add', async (ev) => {
            return await dialog.showOpenDialog({ properties: ['openDirectory'] }).then(async (event) => {
                if (!event.canceled) {
                    config.project_path = event.filePaths[0];
                    const write = await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(config));
                    if (write.error) {
                        return { error: true, road: 'ApplicationStart/main.js:add:writeFile' };
                    }
                    return await readConfigXml();
                }
                return { error: true, road: 'ApplicationStart/main.js:add:showOpenDialog' };
            });
        });

        ipcMain.handle('folder-process:remove', async (ev) => {
            config.project_path = '';
            await writeFileSync(config_path + '/settings.json', JSON.stringify(config));
            return true;
        });

        ipcMain.handle('project:detail', async (ev) => {
            projectDetailWindow = new BrowserWindow({
                width: 440,
                height: 520,
                webPreferences: {
                    devTools: true,
                    disableHtmlFullscreenWindowResize: true,
                    nodeIntegration: true,
                    webSecurity: true,
                    experimentalFeatures: false,
                    contextIsolation: true,
                    preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js')
                }
            });
            // Open the DevTools.
            await projectDetailWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/projectDetail/index.html'));
            projectDetailWindow.webContents.openDevTools({ mode: 'detach', activate: true });
            mainWindow.minimize();
            return true;
        });

        ipcMain.handle('projectDetail:startRead', async (ev) => {
            const access_token = config.access_token;
            if (access_token === '') {
                return {
                    data: null,
                    error: true,
                    message: 'Access token doesnt exist!',
                    road: 'ApplicationStart/main.js:startRead:access_token'
                };
            }
            const userInfo = await get_user_info(access_token);
            if (userInfo.error) {
                return userInfo;
            }

            const gitConfig = await get_git_config();
            if (gitConfig.error) {
                return gitConfig;
            }
            const owner = gitConfig.data.githubProjectUrl.split('/')[gitConfig.data.githubProjectUrl.split('/').length - 2].trim();
            const repo = gitConfig.data.githubProjectUrl.split('/')[gitConfig.data.githubProjectUrl.split('/').length - 1].split('.git')[0].trim();
            const branches = await get_branches(owner, repo, access_token);
            if (branches.error) {
                return branches;
            }

            const workflows = await get_workflows(owner, repo, access_token);
            if (workflows.error) {
                return workflows;
            }

            return {
                data: {
                    userInfo: userInfo.data,
                    branches: branches.data,
                    workflows: workflows.data,
                    gitConfig: gitConfig.data,
                    owner: owner,
                    repo: repo
                },
                error: false
            };

        });

        ipcMain.handle('projectDetail:openAdvanceSettings', async (ev) => {
            advanceSettingsWindow = new BrowserWindow({
                width: 1400,
                height: 800,
                webPreferences: {
                    devTools: true,
                    disableHtmlFullscreenWindowResize: true,
                    nodeIntegration: true,
                    webSecurity: true,
                    experimentalFeatures: false,
                    contextIsolation: true,
                    preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js')
                }
            });
            // Open the DevTools.
            await advanceSettingsWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/advanceSettings/index.html'));
            advanceSettingsWindow.webContents.openDevTools({ mode: 'detach', activate: true });

            return true;
        });

        ipcMain.handle('projectDetail:startReadAdvance', async (ev) => {
            const package_json = await new PackageJsonManager().init();
            return {
                data: {
                    node_modules_fixes: node_modules_fixes.fixes,
                    android_fixes: android_fixes.fixes,
                    ios_fixes: ios_fixes.fixes,
                    package_json: package_json.data
                },
                error: false
            };
        });
        let child = null;

        ipcMain.handle('projectDetail:addPackage', async (_event, value) => {
            child = await new AndroidCleaner();
            const cleanNode = await child.cleanNode();
            console.log('%c cleanNode', 'background: #222; color: #bada55', cleanNode);


            return await child.startAndroidCleaner();

            /*
                        return await child.init(value);
            */
        });

        ipcMain.handle('projectDetail:stopProcess', async (_event, value) => {
            console.log('%c child', 'background: #222; color: #bada55', child);
            await child.abort();
        });
        ipcMain.handle('projectDetail:startTerminal', async (_event, value) => {

        });


        ipcMain.handle('projectDetail:abortTerminal', async (_event, value) => {
            /* const app = require('electron').remote.app;
             let id = app.getGlobal('abortController');*/
            /*            const test = require('electron').remote.getGlobal('abortController');
                        console.log('%c test', 'background: #222; color: #bada55', test);*/
            return true;
        });

        ipcMain.handle('abortController', function (event, data) {
            console.log('received data', data);

            alert('received data');
        });
    };

    const get_workflows = async (owner, repo_name, access_token) => {
        return new Promise(
            async (resolve) => {
                const options = {
                    'method': 'GET',
                    'url': 'https://api.github.com/repos/' + owner + '/' + repo_name + '/actions/workflows',
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Cookie': '_octo=GH1.1.137167768.1664605773; logged_in=no',
                        'User-Agent': 'php'
                    }
                };
                request(options, function (error, response) {
                    if (error) return resolve({
                        data: null,
                        error: true,
                        message: error.message,
                        road: 'ApplicationStart/main.js:get_workflows:request'
                    });
                    return resolve({
                        data: JSON.parse(response.body).workflows.filter((o) => o.state === 'active'),
                        error: false
                    });
                });
            }
        );
    };

    const get_branches = async (owner, repo_name, access_token) => {
        return new Promise(
            async (resolve) => {
                let i = 1;
                const branchesCounter = [];
                while (i !== -1) {
                    const branch = await fetch_branch(owner, repo_name, access_token, i);
                    if (!branch.error && branch.data.length > 0) {
                        const data = branch.data;
                        for (const d of data) {
                            branchesCounter.push(d);
                        }
                        i = i + 1;
                    } else {
                        i = -1;
                    }
                }
                return resolve({ data: branchesCounter, error: false });
            }
        );
    };

    const fetch_branch = async (owner, repo_name, access_token, i) => {
        return new Promise(
            async (resolve) => {
                const options = {
                    'method': 'GET',
                    'url': 'https://api.github.com/repos/' + owner + '/' + repo_name + '/branches?page=' + i + '&per_page=100',
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Cookie': '_octo=GH1.1.137167768.1664605773; logged_in=no',
                        'User-Agent': 'php'
                    }
                };
                request(options, function (error, response) {
                    if (error) return resolve({
                        data: null,
                        error: true,
                        message: error.message,
                        road: 'ApplicationStart/main.js:fetch_branch:request'
                    });
                    return resolve({ data: JSON.parse(response.body), error: false });
                });

            }
        );
    };

    const get_git_config = async () => {
        return new Promise(
            async (resolve) => {
                const currentBranchFile = await new FsManager().readFile(config.project_path + '/' + folders.GIT_FOLDER + '/' + folders.CURREN_BRANCH_FILE, {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                if (!currentBranchFile.error) {
                    currentBranch = currentBranchFile.data.split('ref: ')[1].split('/')[2].trim();
                } else {
                    return resolve(currentBranchFile);
                }
                const gitConfigFile = await new FsManager().readFile(config.project_path + '/' + folders.GIT_FOLDER + '/' + folders.CONFIG_FILE);
                if (!gitConfigFile.error) {
                    const github_url_regex = /(\/*\[remote "origin"]\n	url = \S+\/*)/;
                    const projectTitleMatch = github_url_regex.exec(gitConfigFile.data);
                    github_project_url = projectTitleMatch[0].split('=')[1].trim();
                } else {
                    return resolve(gitConfigFile);
                }
                return resolve({
                    data: { currentBranch: currentBranch, githubProjectUrl: github_project_url },
                    error: false
                });
            }
        );
    };

    const get_user_info = async (access_token) => {
        return new Promise(
            (resolve, reject) => {
                const options = {
                    'method': 'POST',
                    'url': 'https://api.github.com/user',
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Cookie': '_octo=GH1.1.137167768.1664605773; logged_in=no',
                        'User-Agent': 'php'
                    }
                };
                request(options, function (error, response) {
                    if (error) return resolve({
                        data: null,
                        error: true,
                        message: error.message,
                        road: 'ApplicationStart/main.js:get_user_info:request'
                    });
                    return resolve({ data: JSON.parse(response.body), error: false });
                });
            }
        );
    };

    const readConfigXml = async () => {
        const configExist = await new FsManager().pathExist(config.project_path + '/config.xml');
        if (!configExist.data) {
            return configExist;
        }
        const configXml = await new FsManager().readFile(config.project_path + '/config.xml', {
            encoding: 'utf8',
            flag: 'r',
            signal: null
        });
        if (configXml.error) {
            return configXml;
        }
        /*
            StartWatcher(path.resolve(app.getAppPath(), 'app/src/'));
        */
        const versionRegex = /(\/*version="\S+\/*)/;
        const versionCodeRegex = /(\/* versionCode="\S+\/*)/;
        const androidVersionCodeRegex = /(\/*android-versionCode="\S+\/*)/;
        const iosCFBundleVersionRegex = /(\/*ios-CFBundleVersion="\S+\/*)/;
        const projectTitleRegex = /(\/*<name>\S+<\/name>\/*)/;

        const versionRegexMatch = versionRegex.exec(configXml.data);
        const androidVersionCodeRegexMatch = androidVersionCodeRegex.exec(configXml.data);
        const iosCFBundleVersionRegexMatch = iosCFBundleVersionRegex.exec(configXml.data);
        const versionCodeRegexMatch = versionCodeRegex.exec(configXml.data);
        const projectTitleMatch = projectTitleRegex.exec(configXml.data);

        android_version = versionRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        ios_version = versionCodeRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        android_build_number = androidVersionCodeRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        ios_build_number = iosCFBundleVersionRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        const project_title = projectTitleMatch[0].replace('<name>', '').replace('</name>', '');
        return {
            error: false,
            data: {
                path: config.project_path,
                androidVersion: android_version,
                iosVersion: ios_version,
                androidBuildNumber: android_build_number,
                iosBuildNumber: ios_build_number,
                projectTitle: project_title
            }
        };
    };

    app.whenReady().then(async () => {
        await startHandle();
        await createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });
    app.on('activate-with-no-open-windows', function () {
        mainWindow.show();
    });
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    const NODE_MODULES_EDIT_FILES_INFO = [
        {
            path: folders.NODE_MODULES + '/@awesome-cordova-plugins/core/decorators/common.d.ts',
            name: 'common.d.ts',
            type: types.replace,
            multiple: false,
            regex: /(\/*Promise<unknown>\/*)/,
            text: 'Promise<any>'
        },
        {
            path: folders.NODE_MODULES + '/@types/node/index.d.ts',
            name: 'index.d.ts',
            type: types.replace,
            multiple: false,
            regex: /(\/*\/\/\/ <reference lib="es2017" \/>\/*)/,
            text: '// <reference lib="es2017" />'
        },
        {
            path: folders.NODE_MODULES + '/@ionic/app-scripts/dist/util/config.js',
            name: 'config.js',
            type: types.replace,
            multiple: false,
            regex: /(\/*context\.isProd \|\| hasArg\('--optimizeJs'\)\/*)/,
            text: 'hasArg(\'--optimizeJs\')'
        },
        {
            path: folders.NODE_MODULES + '/@angular/platform-browser-dynamic/esm5/platform-browser-dynamic.js',
            name: 'platform-browser-dynamic.js',
            type: types.replace,
            multiple: false,
            regex: /(\/*throw new Error\("No ResourceLoader implementation has been provided\. Can't read the url \\"" \+ url \+ "\\""\);\/*)/,
            text: '    url = "templates/" + url;\n    var resolve;\n    var reject;\n    var promise = new Promise(function (res, rej) {\n        resolve = res;\n        reject = rej;\n    });\n    var xhr = new XMLHttpRequest();\n    xhr.open("GET", url, true);\n    xhr.responseType = "text";\n    xhr.onload = function () {\n        var response = xhr.response || xhr.responseText;\n        var status = xhr.status === 1223 ? 204 : xhr.status;\n        if (status === 0) {\n            status = response ? 200 : 0;\n}\n        if (200 <= status && status <= 300) {\n            resolve(response);\n        }\nelse {\n            reject("Failed to load " + url);\n        }\n};\n    xhr.onerror = function () { reject("Failed to load " + url); };\n    xhr.send();\n    return promise;\n'
        },
        {
            path: folders.NODE_MODULES + '/cordova-sqlite-storage/src/android/io/sqlc/SQLitePlugin.java',
            name: 'SQLitePlugin.java',
            type: types.replace,
            multiple: false,
            regex: /(\/*mydb\.open\(dbfile\);\/*)/,
            text: '    try {\n                    mydb.open(dbfile);\n                } catch (Exception e) {\n                    if (mydb instanceof SQLiteConnectorDatabase &&\n                        (e instanceof NullPointerException || e instanceof java.sql.SQLException)) {\n                        Log.v(SQLitePlugin.class.getSimpleName(), "Applying hotfix for Android 11+");\n                        mydb = new SQLiteAndroidDatabase();\n                        mydb.open(dbfile);\n                    }\n                    else {\n                        throw e;\n                    }\n                }\n'
        },
        {
            path: folders.NODE_MODULES + '/cordova-plugin-qrscanner/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*<uses-permission android:name="android\.permission\.CAMERA" android:required="false" \/>\/*)/
                    },
                    {
                        regex: /(\/*<uses-feature android:name="android\.hardware\.camera" android:required="false" \/>\/*)/
                    }
                ]
        },
        {
            path: folders.NODE_MODULES + '/cordova-plugin-file-transfer/src/ios/CDVFileTransfer.m',
            name: 'CDVFileTransfer.m',
            type: types.remove,
            multiple: false,
            regex: /(\/*NSString\* userAgent = \[self\.commandDelegate userAgent];\n +if \(userAgent\) {\n + \[req setValue:userAgent forHTTPHeaderField:@"User-Agent"];\n +}\/*)/
        }
    ];

    const IOS_EDIT_FILES_INFO = [
        //
        //
        //
        //1
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/cordova-plugin-geolocation/src/ios/CDVLocation.m',
            name: 'CDVLocation.m',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*@synthesize locationManager, locationData;\/*)/,
                        text: 'NSInteger _prevData = 20;\n@synthesize locationManager, locationData;\n'
                    },
                    {
                        regex: /(\/*if\(!__locationStarted\){\/*)/,
                        text: 'if(!__locationStarted){\n        if (_prevData != kCLAuthorizationStatusNotDetermined && status == kCLAuthorizationStatusNotDetermined) {\n            _prevData = status;\n            return;\n        }\n        _prevData = status;\n'
                    }
                ]
        },
        {
            path: folders.PLUGINS + '/cordova-plugin-geolocation/src/ios/CDVLocation.m',
            name: 'CDVLocation.m',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*@synthesize locationManager, locationData;\/*)/,
                        text: 'NSInteger _prevData = 20;\n@synthesize locationManager, locationData;\n'
                    },
                    {
                        regex: /(\/*if\(!__locationStarted\){\/*)/,
                        text: 'if(!__locationStarted){\n        if (_prevData != kCLAuthorizationStatusNotDetermined && status == kCLAuthorizationStatusNotDetermined) {\n            _prevData = status;\n            return;\n        }\n        _prevData = status;\n'
                    }
                ]
        },
        {
            path: folders.IOS + '/SkillCat/Plugins/cordova-plugin-geolocation/CDVLocation.m',
            name: 'CDVLocation.m',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*@synthesize locationManager, locationData;\/*)/,
                        text: 'NSInteger _prevData = 20;\n@synthesize locationManager, locationData;\n'
                    },
                    {
                        regex: /(\/*if\(!__locationStarted\){\/*)/,
                        text: 'if(!__locationStarted){\n        if (_prevData != kCLAuthorizationStatusNotDetermined && status == kCLAuthorizationStatusNotDetermined) {\n            _prevData = status;\n            return;\n        }\n        _prevData = status;\n'
                    }
                ]
        },
        //
        //
        //
        //2
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/cordova-plugin-ionic-webview/src/ios/CDVWKWebViewEngine.m',
            name: 'CDVWKWebViewEngine.m',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +return a;\/*)/,
                        text: '    removeBounces(self);\n    return a;\n'
                    },
                    {
                        regex: /(\/*#pragma mark - Method Swizzling\/*)/,
                        text: '#pragma mark - Method Swizzling\n\nint *removeBounces(UIScrollView* d) {\n    NSTimeInterval delayInSeconds = 0.1;\n    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));\n    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){\n      d.bounces = NO;\n      d.alwaysBounceVertical = NO;\n      d.alwaysBounceHorizontal = NO;\n    });\n    return 0;\n}\n\n- (void)didMoveToWindow {\n    [super didMoveToWindow];\n  NSTimeInterval delayInSeconds = 0.1;\n    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));\n    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){\n  self.bounces = NO;\n    self.alwaysBounceVertical = NO;\n    self.alwaysBounceHorizontal = NO;\n });\n }\n'
                    }
                ]
        },
        {
            path: folders.IOS + '/SkillCat/Plugins/cordova-plugin-ionic-webview/CDVWKWebViewEngine.m',
            name: 'CDVWKWebViewEngine.m',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +return a;\/*)/,
                        text: '    removeBounces(self);\n    return a;\n'
                    },
                    {
                        regex: /(\/*#pragma mark - Method Swizzling\/*)/,
                        text: '#pragma mark - Method Swizzling\n\nint *removeBounces(UIScrollView* d) {\n    NSTimeInterval delayInSeconds = 0.1;\n    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));\n    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){\n      d.bounces = NO;\n      d.alwaysBounceVertical = NO;\n      d.alwaysBounceHorizontal = NO;\n    });\n    return 0;\n}\n\n- (void)didMoveToWindow {\n    [super didMoveToWindow];\n  NSTimeInterval delayInSeconds = 0.1;\n    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));\n    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){\n  self.bounces = NO;\n    self.alwaysBounceVertical = NO;\n    self.alwaysBounceHorizontal = NO;\n });\n }\n'
                    }
                ]
        },
        {
            path: folders.PLUGINS + '/cordova-plugin-ionic-webview/src/ios/CDVWKWebViewEngine.m',
            name: 'CDVWKWebViewEngine.m',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +return a;\/*)/,
                        text: '    removeBounces(self);\n    return a;\n'
                    },
                    {
                        regex: /(\/*#pragma mark - Method Swizzling\/*)/,
                        text: '#pragma mark - Method Swizzling\n\nint *removeBounces(UIScrollView* d) {\n    NSTimeInterval delayInSeconds = 0.1;\n    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));\n    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){\n      d.bounces = NO;\n      d.alwaysBounceVertical = NO;\n      d.alwaysBounceHorizontal = NO;\n    });\n    return 0;\n}\n\n- (void)didMoveToWindow {\n    [super didMoveToWindow];\n  NSTimeInterval delayInSeconds = 0.1;\n    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));\n    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){\n  self.bounces = NO;\n    self.alwaysBounceVertical = NO;\n    self.alwaysBounceHorizontal = NO;\n });\n }\n'
                    }
                ]
        },
        //
        //
        //
        //3
        //
        //
        //
        {
            path: folders.IOS + '/SkillCat.xcodeproj/project.pbxproj',
            name: 'project.pbxproj',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*buildSettings = {\/*)/gim,
                        text: 'buildSettings = {\n\t\t\t\tCODE_SIGN_IDENTITY = "Apple Development";\n\t\t\t\tDEVELOPMENT_TEAM = FFW57BUP6B;'
                    }
                ]
        },
        {
            path: folders.IOS + '/Pods/Pods.xcodeproj/project.pbxproj',
            name: 'project.pbxproj',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*IPHONEOS_DEPLOYMENT_TARGET = \/*)/gim,
                        text: 'IPHONEOS_DEPLOYMENT_TARGET = 11.0;'
                    },
                    {
                        regex: /(\/*CONFIGURATION_BUILD_DIR = "\$\(BUILD_DIR\)\/\$\(CONFIGURATION\)\$\(EFFECTIVE_PLATFORM_NAME\)\/FBSDKCoreKit";\/*)/gim,
                        text: 'CONFIGURATION_BUILD_DIR = "$(BUILD_DIR)/$(CONFIGURATION)$(EFFECTIVE_PLATFORM_NAME)/FBSDKCoreKit";\n\t\t\t\tDEVELOPMENT_TEAM = FFW57BUP6B;'
                    }
                ]
        },
        {
            path: folders.IOS + '/SkillCat/SkillCat-Info.plist',
            name: 'project.pbxproj',
            type: types.replace,
            order: 'after_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*<key>UIBackgroundModes<\/key>\n	<array>\n	+\S+\n	+\S+\n	+<\/array>\/*)/,
                        text: '\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>remote-notification</string>\n\t</array>'

                    }
                ]
        }

    ];

    const ANDROID_EDIT_FILES_INFO = [
        //
        //
        //
        //1 cordova-plugin-file-opener2/plugin.xml
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/cordova-plugin-file-opener2/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +<uses-permission android:name="android\.permission\.REQUEST_INSTALL_PACKAGES" \/>\/*)/
        },
        {
            path: folders.PLUGINS + '/cordova-plugin-file-opener2/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" \/>\/*)/
        },
        //
        //
        //
        //2 com-darryncampbell-cordova-plugin-intent/plugin.xml
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/com-darryncampbell-cordova-plugin-intent/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +<config-file target="AndroidManifest\.xml" platform="android" parent="\/manifest" mode="merge">\r\n +<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" \/>\r\n +<\/config-file>\r\n\/*)/
        },
        {
            path: folders.PLUGINS + '/com-darryncampbell-cordova-plugin-intent/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +<config-file target="AndroidManifest\.xml" platform="android" parent="\/manifest" mode="merge">\r\n +<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" \/>\r\n +<\/config-file>\r\n\/*)/
        },
        //
        //
        //
        //3 AndroidManifest.xml
        //
        //
        //
        {
            path: folders.ANDROID + '/app/src/main/AndroidManifest.xml',
            name: 'AndroidManifest.xml',
            type: types.remove,
            order: 'before_build',
            multiple: false,
            regex: /(\/*<uses-permission android:name="android\.permission\.REQUEST_INSTALL_PACKAGES" \/>\/*)/
        },

        {
            path: folders.ANDROID + '/app/src/main/AndroidManifest.xml',
            name: 'AndroidManifest.xml',
            type: types.remove,
            order: 'before_build',
            multiple: false,
            regex: /(\/*<uses-permission android:name="android\.permission\.CAMERA" \/>\/*)/
        },
        //
        //
        //
        //4 CameraLauncher.java
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/cordova-plugin-camera/src/android/CameraLauncher.java',
            name: 'CameraLauncher.java',
            type: types.replace,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +if\(intent.resolveActivity\(mPm\) != null\)\n +{\n +this\.cordova\.startActivityForResult\(\(CordovaPlugin\) this, intent, \(CAMERA \+ 1\) \* 16 \+ returnType \+ 1\);\n +}\n +else\n +{\n +LOG\.d\(LOG_TAG, "Error: You don't have a default camera\.  Your device may not be CTS complaint\."\);\n +}\/*)/,
            text: '            this.cordova.startActivityForResult((CordovaPlugin) this, intent, (CAMERA + 1) * 16 + returnType + 1);'
        },
        {
            path: folders.PLUGINS + '/cordova-plugin-camera/src/android/CameraLauncher.java',
            name: 'CameraLauncher.java',
            type: types.replace,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +if\(intent.resolveActivity\(mPm\) != null\)\n +{\n +this\.cordova\.startActivityForResult\(\(CordovaPlugin\) this, intent, \(CAMERA \+ 1\) \* 16 \+ returnType \+ 1\);\n +}\n +else\n +{\n +LOG\.d\(LOG_TAG, "Error: You don't have a default camera\.  Your device may not be CTS complaint\."\);\n +}\/*)/,
            text: '            this.cordova.startActivityForResult((CordovaPlugin) this, intent, (CAMERA + 1) * 16 + returnType + 1);'
        },
        {
            path: folders.ANDROID + '/app/src/main/java/org/apache/cordova/camera/CameraLauncher.java',
            name: 'CameraLauncher.java',
            type: types.replace,
            order: 'before_build',
            multiple: false,
            regex: /(\/* +if\(intent.resolveActivity\(mPm\) != null\)\n +{\n +this\.cordova\.startActivityForResult\(\(CordovaPlugin\) this, intent, \(CAMERA \+ 1\) \* 16 \+ returnType \+ 1\);\n +}\n +else\n +{\n +LOG\.d\(LOG_TAG, "Error: You don't have a default camera\.  Your device may not be CTS complaint\."\);\n +}\/*)/,
            text: '            this.cordova.startActivityForResult((CordovaPlugin) this, intent, (CAMERA + 1) * 16 + returnType + 1);'
        },
        //
        //
        //
        //5 MainActivity.java
        //
        //
        //
        {
            path: folders.ANDROID + '/app/src/main/java/com/skillcat/MainActivity.java',
            name: 'MainActivity.java',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +Bundle extras = getIntent\(\)\.getExtras\(\);\/*)/,
                        text: '        Bundle extras = getIntent().getExtras();\n        if (extras != null) {\n            PushPlugin.sendExtras(extras);\n            intentDone = true;\n        }\n'
                    },
                    {
                        regex: /(\/*import org.apache.cordova.\*;\/*)/,
                        text: 'import com.adobe.phonegap.push.PushPlugin;\nimport org.apache.cordova.*;\n'
                    },
                    {
                        regex: /(\/*public class MainActivity extends CordovaActivity\n{\/*)/,
                        text: 'public class MainActivity extends CordovaActivity\n' +
                            '{\n' +
                            '    protected boolean intentDone = false;\n' +
                            '    @Override\n' +
                            '    public void onResume()\n' +
                            '    {\n' +
                            '        super.onResume();\n' +
                            '        Bundle extras = getIntent().getExtras();\n' +
                            '        if (extras != null && !intentDone) {\n' +
                            '            PushPlugin.sendExtras(extras);\n' +
                            '            intentDone = true;\n' +
                            '        }\n' +
                            '    }\n'
                    }
                ]
        },
        //
        //
        //
        //6 plugin.xml
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/cordova-plugin-qrscanner/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*<uses-permission android:name="android\.permission\.CAMERA" android:required="false" \/>\/*)/
                    },
                    {
                        regex: /(\/*<uses-feature android:name="android\.hardware\.camera" android:required="false" \/>\/*)/
                    }
                ]
        },
        {
            path: folders.PLUGINS + '/cordova-plugin-qrscanner/plugin.xml',
            name: 'plugin.xml',
            type: types.remove,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/*<uses-permission android:name="android\.permission\.CAMERA" android:required="false" \/>\/*)/
                    },
                    {
                        regex: /(\/*<uses-feature android:name="android\.hardware\.camera" android:required="false" \/>\/*)/
                    }
                ]
        },
        //
        //
        //
        //7 ContactManager.java
        //
        //
        //
        {
            path: folders.NODE_MODULES + '/cordova-plugin-contact/src/android/ContactManager.java',
            name: 'ContactManager.java',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +else if \(action\.equals\("save"\)\) {\n +if\(PermissionHelper\.hasPermission\(this, WRITE\)\)\/*)/,
                        text: '        else if (action.equals("save")) {\n' +
                            '            if(PermissionHelper.hasPermission(this, WRITE) && PermissionHelper.hasPermission(this, READ))'
                    },
                    {
                        regex: /(\/* +else if \(action\.equals\("remove"\)\) {\n +if\(PermissionHelper\.hasPermission\(this, WRITE\)\)\/*)/,
                        text: '        else if (action.equals("remove")) {\n' +
                            '            if(PermissionHelper.hasPermission(this, WRITE) && PermissionHelper.hasPermission(this, READ))'
                    },
                    {
                        regex: /(\/* +JSONArray res = contactAccessor\.search\(filter, options\);\n +callbackContext\.success\(res\);\/*)/,
                        text: '                try {\n' +
                            '                    JSONArray res = contactAccessor.search(filter, options);\n' +
                            '                    callbackContext.success(res);\n' +
                            '                } catch (SecurityException e) {\n' +
                            '                    getReadPermission(SEARCH_REQ_CODE);\n' +
                            '                }'
                    },
                    {
                        regex: /(\/* +case SAVE_REQ_CODE:\n +save\(executeArgs\);\/*)/,
                        text: '            case SAVE_REQ_CODE:\n' +
                            '                if (!PermissionHelper.hasPermission(this, READ)) getReadPermission(SAVE_REQ_CODE);\n' +
                            '                else save(executeArgs);'
                    },
                    {
                        regex: /(\/* +case REMOVE_REQ_CODE:\n +save\(executeArgs\);\/*)/,
                        text: '            case SAVE_REQ_CODE:\n' +
                            '                if (!PermissionHelper.hasPermission(this, READ)) getReadPermission(REMOVE_REQ_CODE);\n' +
                            '                else remove(executeArgs);'
                    }
                ]

        },
        {
            path: folders.PLUGINS + '/cordova-plugin-contacts/src/android/ContactManager.java',
            name: 'ContactManager.java',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +else if \(action\.equals\("save"\)\) {\n +if\(PermissionHelper\.hasPermission\(this, WRITE\)\)\/*)/,
                        text: '        else if (action.equals("save")) {\n' +
                            '            if(PermissionHelper.hasPermission(this, WRITE) && PermissionHelper.hasPermission(this, READ))'
                    },
                    {
                        regex: /(\/* +else if \(action\.equals\("remove"\)\) {\n +if\(PermissionHelper\.hasPermission\(this, WRITE\)\)\/*)/,
                        text: '        else if (action.equals("remove")) {\n' +
                            '            if(PermissionHelper.hasPermission(this, WRITE) && PermissionHelper.hasPermission(this, READ))'
                    },
                    {
                        regex: /(\/* +JSONArray res = contactAccessor\.search\(filter, options\);\n +callbackContext\.success\(res\);\/*)/,
                        text: '                try {\n' +
                            '                    JSONArray res = contactAccessor.search(filter, options);\n' +
                            '                    callbackContext.success(res);\n' +
                            '                } catch (SecurityException e) {\n' +
                            '                    getReadPermission(SEARCH_REQ_CODE);\n' +
                            '                }'
                    },
                    {
                        regex: /(\/* +case SAVE_REQ_CODE:\n +save\(executeArgs\);\/*)/,
                        text: '            case SAVE_REQ_CODE:\n' +
                            '                if (!PermissionHelper.hasPermission(this, READ)) getReadPermission(SAVE_REQ_CODE);\n' +
                            '                else save(executeArgs);'
                    },
                    {
                        regex: /(\/* +case REMOVE_REQ_CODE:\n +save\(executeArgs\);\/*)/,
                        text: '            case SAVE_REQ_CODE:\n' +
                            '                if (!PermissionHelper.hasPermission(this, READ)) getReadPermission(REMOVE_REQ_CODE);\n' +
                            '                else remove(executeArgs);'
                    }
                ]
        },
        {
            path: folders.ANDROID + '/app/src/main/java/org/apache/cordova/contacts/ContactManager.java',
            name: 'ContactManager.java',
            type: types.replace,
            order: 'before_build',
            multiple: true,
            data:
                [
                    {
                        regex: /(\/* +else if \(action\.equals\("save"\)\) {\n +if\(PermissionHelper\.hasPermission\(this, WRITE\)\)\/*)/,
                        text: '        else if (action.equals("save")) {\n' +
                            '            if(PermissionHelper.hasPermission(this, WRITE) && PermissionHelper.hasPermission(this, READ))'
                    },
                    {
                        regex: /(\/* +else if \(action\.equals\("remove"\)\) {\n +if\(PermissionHelper\.hasPermission\(this, WRITE\)\)\/*)/,
                        text: '        else if (action.equals("remove")) {\n' +
                            '            if(PermissionHelper.hasPermission(this, WRITE) && PermissionHelper.hasPermission(this, READ))'
                    },
                    {
                        regex: /(\/* +JSONArray res = contactAccessor\.search\(filter, options\);\n +callbackContext\.success\(res\);\/*)/,
                        text: '                try {\n' +
                            '                    JSONArray res = contactAccessor.search(filter, options);\n' +
                            '                    callbackContext.success(res);\n' +
                            '                } catch (SecurityException e) {\n' +
                            '                    getReadPermission(SEARCH_REQ_CODE);\n' +
                            '                }'
                    },
                    {
                        regex: /(\/* +case SAVE_REQ_CODE:\n +save\(executeArgs\);\/*)/,
                        text: '            case SAVE_REQ_CODE:\n' +
                            '                if (!PermissionHelper.hasPermission(this, READ)) getReadPermission(SAVE_REQ_CODE);\n' +
                            '                else save(executeArgs);'
                    },
                    {
                        regex: /(\/* +case REMOVE_REQ_CODE:\n +save\(executeArgs\);\/*)/,
                        text: '            case SAVE_REQ_CODE:\n' +
                            '                if (!PermissionHelper.hasPermission(this, READ)) getReadPermission(REMOVE_REQ_CODE);\n' +
                            '                else remove(executeArgs);'
                    }
                ]
        }
    ];

})().catch((err) => {
    console.log('%c err', 'background: #222; color: #bada55', err);
});
