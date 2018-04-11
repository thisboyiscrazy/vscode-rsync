'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
    WorkspaceConfiguration,
    ExtensionContext,
    StatusBarAlignment,
    OutputChannel,
    StatusBarItem,
    Disposable,
    window as vscWindow,
    workspace,
    commands,
    TextDocument
} from 'vscode';
import * as path from 'path';
import * as debounce from 'lodash.debounce';
import * as Rsync from 'rsync';
import * as chokidar from 'chokidar';
import { Config, Site } from './Config';
import * as child from 'child_process';
import { DH_UNABLE_TO_CHECK_GENERATOR } from 'constants';

const outputChannel: OutputChannel = vscWindow.createOutputChannel('Sync-Rsync');
const statusBar: StatusBarItem = vscWindow.createStatusBarItem(StatusBarAlignment.Right, 1);
const createStatusText = (text: string): string => `Rsync: ${text}`;
const getConfig = (): Config => new Config(workspace.getConfiguration('sync-rsync'));

let currentSync: child.ChildProcess = undefined;
let syncKilled = true;

const execute = function( config: Config, cmd: string,args :string[] = [], shell: string = undefined): Promise<number> {
    return new Promise<number>(resolve => {

        let error = false;

        outputChannel.appendLine(`> ${cmd} ${args.join(" ")} `);

        if (config.autoShowOutput) {
            outputChannel.show();
        }

        let showOutput = (data: Buffer): void => {
                outputChannel.append(data.toString());
        };

        if (process.platform === 'win32' && shell) {
            // when the platform is win32, spawn would add /s /c flags, making it impossible for the 
            // shell to be something other than cmd or powershell (e.g. bash)
            args = ["\"", cmd].concat(args, "\"");
            currentSync = child.spawn(shell + " -c", args, {stdio: 'pipe', shell: "cmd.exe"});
        } else {
            currentSync = child.spawn(cmd,args,{stdio: 'pipe', shell: shell});
        }

        currentSync.on('error',function(err: {code: string, message: string}) {
            outputChannel.append("ERROR > " + err.message);
            error = true;
            resolve(1);
        });
        currentSync.stdout.on('data',showOutput);
        currentSync.stderr.on('data',showOutput);

        currentSync.on('close', function(code) {

            if(error) return;

            if(code != 0) {
                resolve(code);
            }

            resolve(0);

        });
    });
}

const runSync = function (rsync: Rsync, paths: string[], site: Site, config: Config): Promise<number> {
    const syncStartTime: Date = new Date();
    const isDryRun: boolean = rsync.isSet('n');
    outputChannel.appendLine(`\n${syncStartTime.toString()} ${isDryRun ? 'comparing' : 'syncing'}`);
    return execute(config, site.executable, rsync.args().concat(paths), site.executableShell);
};

const runCommand = function (site: Site, config: Config): Promise<number> {
    let command = site.afterSync[0];
    let args = site.afterSync.slice(1);
    return execute(config,command,args, site.executableShell);
};

const sync = async function (config: Config, {down, dry}: {down: boolean, dry: boolean}): Promise<void> {
    
    statusBar.color = 'mediumseagreen';
    statusBar.text = createStatusText('$(sync)');
    
    let success = true;
    syncKilled = false;
    statusBar.command = 'sync-rsync.killSync';

    for(let site of config.sites) {

        let paths = [];

        if (syncKilled) continue;

        if(site.localPath === null) {
            vscWindow.showErrorMessage('Sync-Rsync: you must have a folder open or configured local');
            continue;
        }

        if(site.remotePath === null) {
            vscWindow.showErrorMessage('Sync-Rsync: you must configure a remote');
            continue;
        }

        let rsync: Rsync = new Rsync();

        if (down) {
            paths = [site.remotePath,site.localPath];
        } else {
            paths = [site.localPath,site.remotePath];
        }

        if (dry) {
            rsync = rsync.dry();
        }

        for(let option of site.options) {
            rsync.set.apply(rsync,option)
        }

        rsync = rsync
            .flags(site.flags)
            .exclude(site.exclude)
            .progress();

        if (site.shell !== undefined) {
            rsync = rsync.shell(site.shell);
        }

        if (site.deleteFiles) {
            rsync = rsync.delete();
        }

        if (site.chmod !== undefined) {
            rsync = rsync.chmod(site.chmod);
        }

        let rtn = await runSync(rsync, paths, site, config);
        if(rtn == 0) {
            if(!down && site.afterSync) {
                rtn = await runCommand(site,config);
                if(rtn == 0) {
                    success = success && true;
                } else {
                    vscWindow.showErrorMessage("afterSync return " + rtn);
                }
            }
            success = success && true;
        } else {
            vscWindow.showErrorMessage("rsync return " + rtn);
            success = false;
        }
        
    }

    syncKilled = true;
    statusBar.command = 'sync-rsync.showOutput';

    if(success) {
        if (config.autoHideOutput) {
            outputChannel.hide();
        }
        statusBar.color = undefined;
        statusBar.text = createStatusText('$(check)');
    } else {
        outputChannel.show();
        statusBar.color = 'red';
        statusBar.text = createStatusText('$(alert)');
    }
};

const syncFile = async function (config: Config, file: string): Promise<void> {
    
    statusBar.color = 'mediumseagreen';
    statusBar.text = createStatusText('$(sync)');
    
    let success = true;
    syncKilled = false;
    statusBar.command = 'sync-rsync.killSync';

    for(let site of config.sites) {

        let paths = [];

        if (syncKilled) continue;

        if(site.localPath === null) {
            vscWindow.showErrorMessage('Sync-Rsync: you must have a folder open or configured local');
            continue;
        }

        if(site.remotePath === null) {
            vscWindow.showErrorMessage('Sync-Rsync: you must configure a remote');
            continue;
        }
        
        let path = site.localPath;

        if(file.startsWith(path)) {
        
            let path_l = path.length;
            let post = file.slice(path_l);
            let local = path + post;
            let remote = site.remotePath + post;

            let rsync: Rsync = new Rsync();

            let paths = [local,remote];

            for(let option of site.options) {
                rsync.set.apply(rsync,option)
            }

            rsync = rsync
                .flags(site.flags)
                .exclude(site.exclude)
                .progress();

            if (site.shell !== undefined) {
                rsync = rsync.shell(site.shell);
            }

            if (site.deleteFiles) {
                rsync = rsync.delete();
            }

            if (site.chmod !== undefined) {
                rsync = rsync.chmod(site.chmod);
            }

            let rtn = await runSync(rsync, paths, site, config)
            //We can safly ignore error 3 because it might be excluded.
            if((rtn == 0) || (rtn == 3)) {
                success = success && true;
            } else {
                vscWindow.showErrorMessage("rsync return " + rtn);
                success = false;
            }
        }
    }

    syncKilled = true;
    statusBar.command = 'sync-rsync.showOutput';

    if(success) {
        if (config.autoHideOutput) {
            outputChannel.hide();
        }
        statusBar.color = undefined;
        statusBar.text = createStatusText('$(check)');
    } else {
        outputChannel.show();
        statusBar.color = 'red';
        statusBar.text = createStatusText('$(alert)');
    }
};

const syncUp = (config: Config) => sync(config, {down: false, dry: false});
const syncDown = (config: Config) => sync(config, {down: true, dry: false});
const compareUp = (config: Config) => sync(config, {down: false, dry: true});
const compareDown = (config: Config) => sync(config, {down: true, dry: true});
const debouncedSyncUp: (config: Config) => void = debounce(syncUp, 100); // debounce 100ms in case of 'Save All'

const watch = (config: Config) => {
    if (config.watchGlobs.length === 0) {
        return null;
    }

    outputChannel.appendLine(`Activating watcher on globs: ${config.watchGlobs.join(', ')}`);

    try {
        const watcher = chokidar.watch(config.watchGlobs, {
            cwd: workspace.rootPath,
            ignoreInitial: true
        });

        watcher.on('all', (): void => {
            debouncedSyncUp(config);
        });
    
        return watcher;
    } catch (error) {
        outputChannel.appendLine(`Unable to create watcher: ${error}`);
    }

    return null;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): void {
    let config: Config = getConfig();
    let watcher = null;

    workspace.onDidChangeConfiguration((): void => {
        config = getConfig();

        if (watcher) {
            outputChannel.appendLine('Closing watcher');
            watcher.close();
        }

        watcher = watch(config);
    });

    workspace.onDidSaveTextDocument((doc: TextDocument): void => {
        if(config.onFileSave) {
            debouncedSyncUp(config);
        } else if(config.onFileSaveIndividual) {
            syncFile(config, config.translatePath(doc.fileName));
        }
    });

    const syncDownCommand: Disposable = commands.registerCommand('sync-rsync.syncDown', (): void => {
        syncDown(config);
    });
    const syncUpCommand: Disposable = commands.registerCommand('sync-rsync.syncUp', (): void => {
        syncUp(config);
    });
    const compareDownCommand: Disposable = commands.registerCommand('sync-rsync.compareDown', (): void => {
        compareDown(config);
    });
    const compareUpCommand: Disposable = commands.registerCommand('sync-rsync.compareUp', (): void => {
        compareUp(config);
    });
    const showOutputCommand: Disposable = commands.registerCommand('sync-rsync.showOutput', (): void => {
        outputChannel.show();
    });
    const killSyncCommand: Disposable = commands.registerCommand('sync-rsync.killSync', (): void => {
        syncKilled = true;
        currentSync.kill();
    });

    context.subscriptions.push(syncDownCommand);
    context.subscriptions.push(syncUpCommand);
    context.subscriptions.push(compareDownCommand);
    context.subscriptions.push(compareUpCommand);
    context.subscriptions.push(showOutputCommand);
    context.subscriptions.push(killSyncCommand);

    statusBar.text = createStatusText('$(info)');
    statusBar.command = 'sync-rsync.showOutput';
    statusBar.show();
    outputChannel.appendLine('Sync-Rsync started');
    watcher = watch(config);
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
