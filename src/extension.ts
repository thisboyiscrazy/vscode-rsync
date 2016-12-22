'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as rsync from 'rsync';

let r = new rsync();

let out = vscode.window.createOutputChannel("Sync- Rsync");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    /*
    vscode.workspace.onDidSaveTextDocument((e) => {
        e.fileName;
    })
    */

    let sync = function(down: boolean) {
        
        let local: string = vscode.workspace.rootPath;

        if(local === null) {
            vscode.window.showErrorMessage('Sync - Rsync: you must have a folder open');    
            return;
        }

        local = local + '/';

        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')
        let remote: string = config.get('remote',null);

        if(remote === null) {
            vscode.window.showErrorMessage('Sync - Rsync is not configured');    
            return;
        }

        remote = remote + '/';

        out.show();

        let r = new rsync().flags(config.get('flags','rlptzv')).progress()

        if(down) {
            r = r.source(remote).destination(local);
        } else {
            r = r.source(local).destination(remote);
        }

        if(config.get('delete',false)) {
            r = r.delete()
        }

        r.execute(
            (error,code,cmd) => {
                if(error) {
                    vscode.window.showErrorMessage(error.message);
                } else {
                    out.hide();
                }
            },
            (data: Buffer) => {out.append(data.toString());},
            (data: Buffer) => {out.append(data.toString());},
        )
    }

    let syncDown = vscode.commands.registerCommand('sync-rsync.syncDown', () => {
        sync(true);
    });

    let syncUp = vscode.commands.registerCommand('sync-rsync.syncUp', () => {
        sync(false);
    });

    context.subscriptions.push(syncDown);
    context.subscriptions.push(syncUp);
}

// this method is called when your extension is deactivated
export function deactivate() {
}