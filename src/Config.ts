import {
    WorkspaceConfiguration,
    workspace
} from 'vscode';
import * as path from 'path';
import * as child from 'child_process';

export class Site { 
    
    constructor(
        public name: string,
        public upOnly: boolean,
        public downOnly: boolean,
        public localPath: string,
        public remotePath: string,
        public deleteFiles: boolean,
        public flags: string,
        public exclude: Array<string>,
        public include: Array<string>,
        public chmod: string,
        public shell: string,
        public executableShell: string,
        public executable: string,
        public afterSync: string[],
        public options: Array<Array<string>>,
        public args: Array<string>
    ) {}

}

export class Config {
    notification: boolean;
    autoShowOutput: boolean;
    autoShowOutputOnError: boolean;
    autoHideOutput: boolean;
    onFileSave: boolean;
    onFileSaveIndividual: boolean;
    onFileLoadIndividual: boolean;
    showProgress: boolean;
    sites: Array<Site>;
    cygpath: string;
    watchGlobs: Array<string>;
    useWSL: boolean;
    siteMap: Map<string, Site>;
    _workspaceFolder: string = workspace.rootPath ? workspace.rootPath : "";
    _workspaceFolderBasename: string = workspace.rootPath ? path.basename(workspace.rootPath) : "";

    constructor(config: WorkspaceConfiguration) {
        this.onFileSave = config.get('onSave', false);
        this.onFileSaveIndividual = config.get('onSaveIndividual', false);
        this.onFileLoadIndividual = config.get('onLoadIndividual', false);
        this.showProgress = config.get('showProgress', true);
        this.notification = config.get('notification', false);
        this.autoShowOutput = config.get('autoShowOutput', false);
        this.autoShowOutputOnError = config.get('autoShowOutputOnError', true);
        this.autoHideOutput = config.get('autoHideOutput', false);
        this.cygpath = config.get('cygpath', undefined);
        this.watchGlobs = config.get('watchGlobs', []);
        this.useWSL = config.get('useWSL', false);
        
        let site_default = new Site(
            config.get('name', null),
            false,
            false,
            config.get('local', null),
            config.get('remote', null),
            config.get('delete', false),
            config.get('flags', 'rlptzv'),
            config.get('exclude', ['.git', '.vscode']),
            config.get('include', []),
            config.get('chmod', undefined),
            config.get('shell', undefined),
            config.get('executableShell', undefined),
            config.get('executable', 'rsync'),
            undefined,
            config.get('options', []),
            config.get('args', []),
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

        let workspaceLocal = workspace.rootPath

        for(let site of sites) {
            if(site.localPath === null || site.localPath == "null") {
                site.localPath = workspaceLocal;
            }
            if(workspaceLocal != null) {
                site.localPath = this.expandVars(site.localPath)
                
                for(let i = 0; i < site.options.length; i ++) {
                    const site_option = site.options[i];
                    for(let j = 0; j < site_option.length; j++ ) {
                        site_option[j] = this.expandVars(site_option[j]);
                    }
                }

                if(site.remotePath != null) {
                    site.remotePath = this.expandVars(site.remotePath);
                }
            } 

            site.localPath = this.translatePath(site.localPath);
            site.remotePath = this.translatePath(site.remotePath);
            
            if(undefined != site.localPath && site.localPath[site.localPath.length - 1] != '/') site.localPath += '/';
            if(undefined != site.remotePath && site.remotePath[site.remotePath.length - 1] != '/') site.remotePath += '/';
        }

        var siteMap = new Map<string, Site>(); 

        for(let s of sites) {
            var s_key = s.name ? s.name : s.remotePath;
            siteMap.set(s_key,s);
        }

        this.siteMap = siteMap;

        this.sites = sites;
    }

    expandVars(path: string) {
        path = path.replace("${workspaceRoot}",this._workspaceFolder);
        path = path.replace("${workspaceFolder}",this._workspaceFolder);
        path = path.replace("${workspaceFolderBasename}",this._workspaceFolderBasename);
        return path;
    }

    translatePath(path: string): string {
        
        if(path == null) return null;
        
        if(path[0] == '/') return path;

        if(this.cygpath) {
            let rtn = child.spawnSync(this.cygpath, [path]);
            if(rtn.status != 0) {
                throw new Error("Path Tranlate Issue:" + rtn.stderr.toString());
            }
            if(rtn.error) {
                throw rtn.error;
            }
            let s_rtn = rtn.stdout.toString();
            s_rtn = s_rtn.trim();
            return s_rtn;
        }

        if(this.useWSL) {
            let r_path = path.replace(/\\/g,"\\\\");
            let rtn = child.spawnSync("wsl", ["wslpath", r_path]);
            if(rtn.status != 0) {
                throw new Error("Path Tranlate Issue:" + rtn.stderr.toString());
            }
            if(rtn.error) {
                throw rtn.error;
            }
            let s_rtn = rtn.stdout.toString();
            s_rtn = s_rtn.trim();
            return s_rtn;
        }

        return path;
    }

}
