import {WorkspaceConfiguration} from 'vscode';

export default class Config {
    flags: string;
    exclude: Array<string>;
    shell: string;
    delete: boolean;
    chmod: string;
    autoShowOutput: boolean;
    autoHideOutput: boolean;
    localPath: string;
    remotePath: string;
    onFileSave: boolean;

    constructor(config: WorkspaceConfiguration) {
        this.flags = config.get('flags', 'rlptzv'),
        this.exclude = config.get('exclude', ['.git', '.vscode']),
        this.shell = config.get('shell', undefined),
        this.delete = config.get('delete', false),
        this.chmod = config.get('chmod', undefined),
        this.autoShowOutput = config.get('autoShowOutput', false),
        this.autoHideOutput = config.get('autoHideOutput', false),
        this.localPath = config.get('local', null),
        this.remotePath = config.get('remote', null),
        this.onFileSave = config.get('onSave', false);
    }
}
