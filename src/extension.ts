'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as rsync from 'rsync';

import * as path from 'path';

import * as child_process from 'child_process';

let currentSync: child_process.ChildProcess = undefined;

let out = vscode.window.createOutputChannel('Sync- Rsync');
let status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left,0)
status.hide();
status.text = 'Syncing (click to kill)';
status.command = 'sync-rsync.syncKill';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Should fix r to be Rsync type
    let runSync = function (r: any) {

        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')

        r = r
            .flags(config.get('flags','rlptzv'))
            .exclude(config.get('exclude',[".git",".vscode"]))
            .executableShell(config.get('executableShell','/bin/bash'))
            .progress();

        let shell = config.get('shell', undefined);
        if(shell !== undefined) {
            r = r.shell(shell);
        }

        if(config.get('delete',false)) {
            r = r.delete();
        }

        let chmod = config.get('chmod', undefined);
        if(chmod !== undefined) {
            r = r.chmod(chmod);
        }

        
        out.show();
        status.show();
        currentSync = r.execute(
            (error,code,cmd) => {
                if(error) {
                    vscode.window.showErrorMessage(error.message);
                } else {
                    if(config.get('autoHideOutput',true)) {
                        out.hide();
                    }
                }
                currentSync = undefined;
                status.hide()
            },
            (data: Buffer) => {
                out.append(data.toString());
            },
            (data: Buffer) => {
                out.append(data.toString());
            },
        )
    }

    let sync = function(down: boolean) {

        if(currentSync != undefined) {
            vscode.window.showErrorMessage('Sync - Rsync there is a sync in process');
            return;
        }

        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync');

        let local: string = config.get('local',null);

        if(local === null) {
            local = vscode.workspace.rootPath
            if(local === null) {
                vscode.window.showErrorMessage('Sync - Rsync: you must have a folder open');    
                return;
            }
            local = local + path.sep
        }

        let remote: string = config.get('remote',null);

        if(remote === null) {
            vscode.window.showErrorMessage('Sync - Rsync is not configured');
            return;
        }

        let r = new rsync();

        r.cwd(local);

        if(down) {
            r = r.source(remote).destination('.');
        } else {
            r = r.source('.').destination(remote);
        }

        runSync(r);

    }

    let syncDown = vscode.commands.registerCommand('sync-rsync.syncDown', () => {
        sync(true);
    });

    let syncUp = vscode.commands.registerCommand('sync-rsync.syncUp', () => {
        sync(false);
    });

    let syncKill = vscode.commands.registerCommand('sync-rsync.syncKill', () => {
        if(currentSync != undefined) {
            currentSync.kill();
        }
    });

    context.subscriptions.push(syncDown);
    context.subscriptions.push(syncUp);


    // On Save
    vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')
        let onSave: boolean = config.get('onSave',false);

        if(onSave) {
            sync(false);
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}
