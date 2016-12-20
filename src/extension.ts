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

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "sync-rsync" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.syncDown', () => {

        let local: string = vscode.workspace.rootPath;

        if(local === null) {
            vscode.window.showErrorMessage('Sync - Rsync: you must have a folder open');    
            return;
        }

        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')
        let remote: string = config.get('remote',null);

        if(remote === null) {
            vscode.window.showErrorMessage('Sync - Rsync is not configured');    
            return;
        }

        out.show();

        let r = new rsync()
            .flags('azv')
            .source(remote)
            .destination(local);

        vscode.window.showInformationMessage('Sync - Rsync: Syncing Down');    
        r.execute(
            (error,code,cmd) => {
                if(error) {
                    vscode.window.showErrorMessage(error.message);
                } else {
                    vscode.window.showInformationMessage('Done');
                    out.hide();
                }
            },
            (data: Buffer) => {out.append(data.toString());},
            (data: Buffer) => {out.append(data.toString());},
        )
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}