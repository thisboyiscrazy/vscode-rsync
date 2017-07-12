import {
    window,
    WorkspaceConfiguration,
    workspace
} from 'vscode';
import * as path from 'path';

export class Site { 
    
    constructor(
        public localPath: string,
        public remotePath: string,
        public deleteFiles: boolean,
        public flags: string,
        public exclude: Array<string>,
        public chmod: string,
        public shell: string,
    ) {}

}

export default class Config {
    autoShowOutput: boolean;
    autoHideOutput: boolean;
    onFileSave: boolean;
    sites: Array<Site>;

    constructor(config: WorkspaceConfiguration) {
        this.onFileSave = config.get('onSave', false);
        this.autoShowOutput = config.get('autoShowOutput', false);
        this.autoHideOutput = config.get('autoHideOutput', false);
        
        let site_default = new Site(
            config.get('local', null),
            config.get('remote', null),
            config.get('delete', false),
            config.get('flags', 'rlptzv'),
            config.get('exclude', ['.git', '.vscode']),
            config.get('chmod', undefined),
            config.get('shell', undefined),
        )

        let sites: Array<Site> = [];
        let config_sites: Array<Site> = config.get('sites', []);

        if(config_sites.length == 0) {
            sites.push(site_default);
        } else {
            for(let site of config_sites) {
                let clone = Object.assign({},site_default);
                clone = Object.assign(clone,site);
                sites.push(clone);
            }
        }

        let workspaceLocal = workspace.rootPath + path.sep;
        let noLocal: boolean = false;
        let noRemote: boolean = false;

        for(let site of sites) {
            if(site.localPath === null) {
                site.localPath = workspaceLocal;
            }
            noLocal = noLocal ||  site.localPath === null;
            noRemote = noRemote ||  site.remotePath === null;
        }

        if(noLocal) {
            window.showErrorMessage('Sync-Rsync: you must have a folder open or conffigured local');
        }

        if(noRemote) {
            window.showErrorMessage('Sync-Rsync: you must configure a remote');
        }

        if(noLocal == false && noRemote == false) {
            this.sites = sites;
        }
    }
}
