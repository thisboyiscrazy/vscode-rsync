# sync-rsync

Basic sync using Rsync

## Features

This extension syncs with a remote server using rsync

With these commands:

* `Sync-Rsync: Sync Local to Remote`
* `Sync-Rsync: Sync Remote to local`
* `Sync-Rsync: Compare Local to Remote` (dry run)
* `Sync-Rsync: Compare Remote to local` (dry run)
* `Sync-Rsync: Kills the current sync`

If no sync is running clicking the status bar item will show the output

If a sync is running clicking the status bar item will kill the running sync, see [Debian Note](#debian-notes) and [Windows Notes](#windows-notes)

## Requirements

Rsync installed both locally and remotely

## Extension Settings

Overall Settings (all optional):

* `sync-rsync.autoShowOutput`: Auto show rsync output when rsync is working
* `sync-rsync.autoHideOutput`: Auto hide rsync output when rsync is done
* `sync-rsync.onSave`: sync project on save (currently syncs entire project because I do not have an easy way to deal with excluded files)
* `sync-rsync.executableShell`: The executable shell to run rsync in (e.g. /bin/bash)

Default Site Options:

* `sync-rsync.local`: the local location defaults to workspace (must end in path separator)
* `sync-rsync.remote`: the rsync remote location e.g. user@remote:path (must end in path separator)
* `sync-rsync.delete`: true or false if you want rsync to delete files
* `sync-rsync.flags`: rsync flags
* `sync-rsync.exclude`: rsync exclude patterns e.g. [".git",".vscode"]
* `sync-rsync.shell`: Rsync's -e option e.g. ssh -p 1234
* `sync-rsync.chmod`: Rsync's --chmod option
* `sync.rsync.options`: Array of extra rsync options, set each element using [rsync.set](https://github.com/mattijs/node-rsync#setoption-value)

Sites (Completely Optional, If no sites are defined Sync Rsync creates one using defaults):

* `sync-rsync.sites`: Multiple Site Support [Multiple Sites](#multiple-sites)

## Workspaces

For workspaces you have to define ```localPath``` and ```remotePath``` for each folder you want synced. e.g.

```
{
	"folders": [
		{
			"path": "/home/user/project/s1"
		},
		{
			"path": "/home/user/projects/t2"
		}
	],
    "settings": {
    	"sync-rsync.sites": [
    		{
    			"localPath": "/home/user/project/s1",
    			"remotePath": "user@server:/var/www/s1"
    		},
    		{
    			"localPath": "/home/user/projects/t2",
    			"remotePath": "user@server:/var/www/s2"
    		}
    	]
    }
}
```

## Multiple Sites

Sites have these options, they are all optional sync-rsync will use the defaults if they are not defined:

* `localPath`: the local location defaults to workspace (must end in path separator)
* `remotePath`: the rsync remote location e.g. user@remote:path (must end in path separator)
* `deleteFiles`: true or false if you want rsync to delete files
* `flags`: rsync flags
* `exclude`: rsync exclude patterns e.g. [".git",".vscode"]
* `shell`: Rsync's -e option e.g. ssh -p 1234
* `chmod`: Rsync's --chmod option
* `options`: Array of extra rsync options, set each element using [rsync.set](https://github.com/mattijs/node-rsync#setoption-value)

localPath and remotePath will replace ${workspaceRoot} with the current Workspace Path

Example :

```javascript
{
    "sync-rsync.delete": true,
    "sync-rsync.sites": [
        {
            "remotePath":"user1@server1:/path1/",   // Sync sync-rsync.local to user1@server1:/path1/ using port 1234
            "shell":"ssh -p 1234"
        },
        {
            "remotePath":"user2@server2:/path2/",  // Sync sync-rsync.local to user2@server2:/path2/
        },
        {
            "localPath":"project/static/",
            "remotePath":"user3server3:/static/", // Sync project/static/ to user3@server3:/static/
        }
    ]
}
```

## Windows Notes

If you are using rsync that uses cygwin you will need to set `"sync-rsync.local"` to use cygwin drives e.g.:

```
"sync-rsync.local": "/cygdrive/c/Users/joe/Documents/projects/sync_test/"
```

## Mac OS Notes

If you are using the `shell` option to do something like `ssh -p 123` you will most likely have the set `sync-rsync.executableShell` to `/bin/bash`
