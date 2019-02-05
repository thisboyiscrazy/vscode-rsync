import {
    WorkspaceConfiguration,
    workspace
} from 'vscode';
import * as path from 'path';
import * as child from 'child_process';
import * as Rsync from 'rsync';

import { exists, lstat } from 'fs';
import { promisify } from 'util';

const path_exists = promisify(exists);
const path_lstat = promisify(lstat);

export class Site { 
    
    constructor(
        public name: string,
        public upOnly: boolean,
        public downOnly: boolean,
        public localPath: string,
        public remotePath: string,
        public deleteFiles: boolean,
        public flags: string,
        public progress: boolean,
        public exclude: Array<string>,
        public include: Array<string>,
        public chmod: string,
        public shell: string,
        public executableShell: string,
        public executable: string,
        public afterSync: string[],
        public options: Array<Array<String>>,
        public args: Array<string>,
        public translatedLocalPath: string,
        public config: Config,
    ) {}

    async rsync(down: boolean, dry: boolean, path?: string): Promise<Rsync> {

        if (this.translatedLocalPath === null) {
            throw new Error('You must have a folder open or configured local');
        }
    
        if (this.remotePath === null) {
            throw new Error('You must configure a remote');
        }

        let local = this.translatedLocalPath;
        let remote = this.remotePath;

        if(path != undefined) {
            
            let info = await path_lstat(path);

            path = this.config.translatePath(path);
            if(info.isDirectory()) {
                path = this.config.ensureTralingSlash(path);
            }

            if(!path.startsWith(local)) {
                return null;
            }

            let path_l = local.length;
            let post = path.slice(path_l);
            local += post;
            remote +=  post;
        }

        let rsync: Rsync = new Rsync();
    
        if (dry) {
            rsync = rsync.dry();
        }
    
        for (let option of this.options) {
            rsync.set.apply(rsync, option)
        }
    
        rsync = rsync
            .flags(this.flags)
            .progress(this.progress);
    
        if (this.include.length > 0) {
            rsync = rsync.include(this.include);
        }
    
        if (this.exclude.length > 0) {
            rsync = rsync.exclude(this.exclude);
        }
    
        if (this.shell !== undefined) {
            rsync = rsync.shell(this.shell);
        }
    
        if (this.deleteFiles) {
            rsync = rsync.delete();
        }
    
        if (this.chmod !== undefined) {
            rsync = rsync.chmod(this.chmod);
        }

        if (down) {
            rsync = rsync
                .source(remote)
                .destination(local)
        } else {
            rsync = rsync
                .source(remote)
                .destination(local)
        }

        return rsync;
    
    }

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
            this.showProgress,
            config.get('exclude', ['.git', '.vscode']),
            config.get('include', []),
            config.get('chmod', undefined),
            config.get('shell', undefined),
            config.get('executableShell', undefined),
            config.get('executable', 'rsync'),
            undefined,
            config.get('options', []),
            config.get('args', []),
            undefined,
            this
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
        
        for(let site of sites) {
            if(site.localPath === null) {
                site.localPath = workspaceLocal;
            }
            if(workspaceLocal != null) {
                site.localPath = site.localPath.replace("${workspaceRoot}",workspaceLocal);
                
                for(let i = 0; i < site.options.length; i ++) {
                    let t_workspaceLocal = this.translatePath(workspaceLocal);
                    const site_option = site.options[i];
                    for(let j = 0; j < site_option.length; j++ ) {
                        const option = site_option[j];
                        site_option[j] = option.replace("${workspaceRoot}",t_workspaceLocal);
                    }
                }

                if(site.remotePath != null) {
                    site.remotePath = site.remotePath.replace("${workspaceRoot}",workspaceLocal);   
                    site.remotePath = site.remotePath.replace("${workspaceFolder}",workspaceLocal);
                    site.remotePath = site.remotePath.replace("${workspaceFolderBasename}",path.basename(workspace.rootPath));
                }
            }

            site.remotePath = this.ensureTralingSlash(site.remotePath);
            site.translatedLocalPath = this.translatePath(site.localPath);
            site.translatedLocalPath = this.ensureTralingSlash(site.translatedLocalPath);
        }

        var siteMap = new Map<string, Site>(); 

        for(let s of sites) {
            var s_key = s.name ? s.name : s.remotePath;
            siteMap.set(s_key,s);
        }

        this.siteMap = siteMap;

        this.sites = sites;
    }

    ensureTralingSlash(path: string): string {
        if(null == path) return null;
        if(path[path.length - 1] != '/') path += '/';   
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

    checkPath

}
