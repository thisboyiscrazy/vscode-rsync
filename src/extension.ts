'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as rsync from 'rsync';

import * as path from 'path';

let out = vscode.window.createOutputChannel("Sync- Rsync");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Should fix r to be Rsync type
    let runSync = function (r: any) {

        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')
        
        r = r
            .flags(config.get('flags','rlptzv'))
            .exclude(config.get('exclude',[".git",".vscode"]))
            .progress();

        let shell = config.get('shell',undefined);
        if(shell !== undefined) {
            r = r.shell(shell);
        }

        if(config.get('delete',false)) {
            r = r.delete()
        }

        let chmod = config.get('chmod',undefined);
        if(chmod !== undefined) {
            r = r.chmod(chmod);
        }

        out.show();
        r.execute(
            (error,code,cmd) => {
                if(error) {
                    vscode.window.showErrorMessage(error.message);
                } else {
                    if(config.get('autoHideOutput',true)) {
                        out.hide();
                    }
                }
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

        if(down) {
            r = r.source(remote).destination(local);
        } else {
            r = r.source(local).destination(remote);
        }
        
        runSync(r);

    }

    let syncDown = vscode.commands.registerCommand('sync-rsync.syncDown', () => {
        sync(true);
    });

    let syncUp = vscode.commands.registerCommand('sync-rsync.syncUp', () => {
        sync(false);
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