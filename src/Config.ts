import {
    window,
    WorkspaceConfiguration,
    workspace
} from 'vscode';
import * as path from 'path';
import * as child from 'child_process';

export class Site { 
    
    constructor(
        public localPath: string,
        public remotePath: string,
        public deleteFiles: boolean,
        public flags: string,
        public exclude: Array<string>,
        public chmod: string,
        public shell: string,
        public executableShell: string,
        public executable: string,
        public afterSync: string[],
        public options: Array<Array<any>>
    ) {}

}

export class Config {
    autoShowOutput: boolean;
    autoHideOutput: boolean;
    onFileSave: boolean;
    onFileSaveIndividual: boolean;
    exclude: Array<string>;
    shell: string;
    sites: Array<Site>;
    cygpath: string;
    watchGlobs: Array<string>;

    constructor(config: WorkspaceConfiguration) {
        this.onFileSave = config.get('onSave', false);
        this.onFileSaveIndividual = config.get('onSaveIndividual', false);
        this.autoShowOutput = config.get('autoShowOutput', false);
        this.autoHideOutput = config.get('autoHideOutput', false);
        this.exclude = config.get('exclude', ['.git', '.vscode']);
        this.shell = config.get('shell', undefined);
        this.cygpath = config.get('cygpath', undefined);
        this.watchGlobs = config.get('watchGlobs', []);
        
        let site_default = new Site(
            this.translatePath(config.get('local', null)),
            this.translatePath(config.get('remote', null)),
            config.get('delete', false),
            config.get('flags', 'rlptzv'),
            config.get('exclude', this.exclude),
            config.get('chmod', undefined),
            config.get('shell', this.shell),
            config.get('executableShell', undefined),
            config.get('executable', 'rsync'),
            undefined,
            config.get('options', []),
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

        if (workspaceLocal !== undefined) {
            workspaceLocal += path.sep;
        } else {
            workspaceLocal === null;
        }

        workspaceLocal = this.translatePath(workspaceLocal);
        
        for(let site of sites) {
            if(site.localPath === null) {
                site.localPath = workspaceLocal;
            }
            if(workspaceLocal != null) {
                site.localPath = site.localPath.replace("${workspaceRoot}",workspaceLocal);
                if(site.remotePath != null) {
                    site.remotePath = site.remotePath.replace("${workspaceRoot}",workspaceLocal);   
                }
            }
        }
        
        this.sites = sites;
    }

    translatePath(path: string): string {
        if(this.cygpath) {
            let rtn = child.spawnSync(this.cygpath, [path]);
            if(rtn.status != 0) {
                throw new Error("Path Tranlate Issue");
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
