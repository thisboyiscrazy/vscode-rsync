'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
    workspace,
    WorkspaceConfiguration,
    ExtensionContext,
    StatusBarAlignment,
    OutputChannel,
    StatusBarItem,
    Disposable,
    window as vscWindow,
    commands
} from 'vscode';
import * as path from 'path';
import * as debounce from 'lodash.debounce';
import * as Rsync from 'rsync';
import Config from './Config';

const outputChannel: OutputChannel = vscWindow.createOutputChannel('Sync-Rsync');
const statusBar: StatusBarItem = vscWindow.createStatusBarItem(StatusBarAlignment.Right, 1);
const createStatusText = (text: string): string => `Rsync: ${text}`;
const getConfig = (): Config => new Config(workspace.getConfiguration('sync-rsync'));

const runSync: Function = function (rsync: Rsync, config: Config): void {
    statusBar.color = 'yellow';
    statusBar.text = createStatusText('$(sync)');
    const syncStartTime: Date = new Date();
    const rsyncArgs: Array<string> = rsync.args();
    outputChannel.appendLine(`\n${syncStartTime.toString()} syncing`);
    outputChannel.appendLine(`> rsync ${rsyncArgs.join(' ')}`);

    if (config.autoShowOutput) {
        outputChannel.show();
    }

    rsync.execute(
        (error, code, cmd): void => {
            if (error) {
                vscWindow.showErrorMessage(error.message);
                statusBar.color = 'red';
                statusBar.text = createStatusText('$(alert)');
            } else {
                if (config.autoHideOutput) {
                    outputChannel.hide();
                }
                statusBar.color = 'mediumseagreen';
                statusBar.text = createStatusText('$(check)');
            }
        },
        (data: Buffer): void => {
            outputChannel.append(data.toString());
        },
        (data: Buffer): void => {
            outputChannel.append(data.toString());
        },
    );
};

const sync: Function = function (config: Config, down: boolean): void {
    let localPath: string = config.localPath;
    const remotePath: string = config.remotePath;

    if (localPath === null) {
        localPath = workspace.rootPath;

        if (localPath === null) {
            vscWindow.showErrorMessage('Sync-Rsync: you must have a folder open');
            return;
        }

        localPath = localPath + path.sep;
    }

    if (remotePath === null) {
        vscWindow.showErrorMessage('Sync-Rsync is not configured');
        return;
    }

    let rsync: Rsync = new Rsync();

    if (down) {
        rsync = rsync.source(remotePath).destination(localPath);
    } else {
        rsync = rsync.source(localPath).destination(remotePath);
    }

    rsync = rsync
        .flags(config.flags)
        .exclude(config.exclude)
        .progress();

    if (config.shell !== undefined) {
        rsync = rsync.shell(config.shell);
    }

    if (config.delete) {
        rsync = rsync.delete();
    }

    if (config.chmod !== undefined) {
        rsync = rsync.chmod(config.chmod);
    }

    runSync(rsync, config);
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): void {
    const syncDown: Disposable = commands.registerCommand('sync-rsync.syncDown', (): void => {
        sync(getConfig(), true);
    });
    const syncUp: Disposable = commands.registerCommand('sync-rsync.syncUp', (): void => {
        sync(getConfig(), false);
    });
    const showStatus: Disposable = commands.registerCommand('sync-rsync.showStatus', (): void => {
        outputChannel.show();
    });

    context.subscriptions.push(syncDown);
    context.subscriptions.push(syncUp);
    context.subscriptions.push(showStatus);

    const debouncedSync: Function = debounce(sync, 100); // debounce 100ms in case of 'Save All'
    workspace.onDidSaveTextDocument((): void => {
        const config: Config = getConfig();

        if (config.onFileSave) {
            debouncedSync(config, false);
        }
    });

    statusBar.text = createStatusText('$(info)');
    statusBar.command = 'sync-rsync.showStatus';
    statusBar.show();
    outputChannel.appendLine('Sync-Rsync started');
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
