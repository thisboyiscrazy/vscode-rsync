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
    commands
} from 'vscode';
import * as path from 'path';
import * as debounce from 'lodash.debounce';
import * as Rsync from 'rsync';
import { Config, Site } from './Config';
import * as child from 'child_process';

const outputChannel: OutputChannel = vscWindow.createOutputChannel('Sync-Rsync');
const statusBar: StatusBarItem = vscWindow.createStatusBarItem(StatusBarAlignment.Right, 1);
const createStatusText = (text: string): string => `Rsync: ${text}`;
const getConfig = (): Config => new Config(workspace.getConfiguration('sync-rsync'));

let currentSync: child.ChildProcess = undefined;
let syncKilled = true;

const runSync = function (rsync: Rsync, site: Site, config: Config): Promise<boolean> {
    return new Promise<boolean>(resolve => {
        const syncStartTime: Date = new Date();
        const isDryRun: boolean = rsync.isSet('n');
        outputChannel.appendLine(`\n${syncStartTime.toString()} ${isDryRun ? 'comparing' : 'syncing'}`);
        outputChannel.appendLine(`> ${rsync.command()}`);

        if (config.autoShowOutput) {
            outputChannel.show();
        }

        let showOutput = (data: Buffer): void => {
                outputChannel.append(data.toString());
        };

        currentSync = child.spawn('rsync',rsync.args(),{stdio: 'pipe', shell: site.executableShell});
        currentSync.stdout.on('data',showOutput);
        currentSync.stderr.on('data',showOutput);

        currentSync.on('close', function(code) {
            
            if(code != 0) {
                vscWindow.showErrorMessage("rsync return " + code);
                resolve(false);
            }
            resolve(true);
            
        });
    });
};

const sync = async function (config: Config, {down, dry}: {down: boolean, dry: boolean}): Promise<void> {
    
    statusBar.color = 'mediumseagreen';
    statusBar.text = createStatusText('$(sync)');
    
    let success = true;
    syncKilled = false;
    statusBar.command = 'sync-rsync.killSync';

    for(let site of config.sites) {

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
            rsync = rsync.source(site.remotePath).destination(site.localPath);
        } else {
            rsync = rsync.source(site.localPath).destination(site.remotePath);
        }

        if (dry) {
            rsync = rsync.dry();
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

        let rtn = await runSync(rsync, site, config)
        success = success && rtn;
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): void {
    let config: Config = getConfig();

    workspace.onDidChangeConfiguration((): void => {
        config = getConfig();
    });

    const debouncedSyncUp: (config: Config) => void = debounce(syncUp, 100); // debounce 100ms in case of 'Save All'
    workspace.onDidSaveTextDocument((): void => {
        if (config.onFileSave) {
            debouncedSyncUp(config);
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
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
