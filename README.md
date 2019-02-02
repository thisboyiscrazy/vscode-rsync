# sync-rsync

Basic sync using Rsync

## Features

This extension syncs with a remote server using rsync

With these commands:

* `Sync-Rsync: Sync Local to Remote`
* `Sync-Rsync: Sync Local to Remote (Single)`
* `Sync-Rsync: Sync Remote to local`
* `Sync-Rsync: Sync Remote to local (Single)`
* `Sync-Rsync: Compare Local to Remote` (dry run)
* `Sync-Rsync: Compare Remote to local` (dry run)
* `Sync-Rsync: Kills the current sync`

If no sync is running clicking the status bar item will show the output

If a sync is running clicking the status bar item will kill the running sync, see [Windows Notes](#windows-notes)

## Requirements

Rsync installed both locally and remotely

## Extension Settings

Overall Settings (all optional):

* `sync-rsync.notification`: Show notifiactions for sync successes (failurers always show notifications)
* `sync-rsync.autoShowOutput`: Auto show rsync output when rsync is working.
* `sync-rsync.autoShowOutputOnError`: Auto show rsync output on error.
* `sync-rsync.autoHideOutput`: Auto hide rsync output when rsync is done.
* `sync-rsync.onSave`: syncs entire local on save.
* `sync-rsync.onSaveIndividual`: syncs the changed file on save (onSave takes presedence). (note: rsync error 3 is ignored because it might be excluded).
* `sync-rsync.onLoadIndividual`: syncs the opened file on load. (note: rsync error 3 is ignored because it might be excluded).
* `sync-rsync.executableShell`: The executable shell to run rsync in (e.g. /bin/bash).
* `sync-rsync.executable`: The rsync executeable (e.g. rsync, C:\cygwin64\bin\rsync.exe).
* `sync-rsync.cygpath`: If using cygwin, this is the path to cygpath (e.g. C:\cygwin64\bin\cygpath.exe) used to translate windows paths to cywgin.
* `sync-rsync.watchGlobs`: Enables file system watcher on given glob patterns (may cause high CPU usage - use carefuly).
* `sync-rsync.useWSL`: Use WSL for executing rsync. See [Windows Notes](#windows-notes)

Global site options (they will be used as the default for each site):

* `sync-rsync.local`: the local location defaults to workspace (must end in path separator).
* `sync-rsync.remote`: the rsync remote location e.g. user@remote:path (must end in path separator).
* `sync-rsync.delete`: true or false if you want rsync to delete files.
* `sync-rsync.flags`: rsync flags.
* `sync-rsync.showProgress`: show progress during rsync, by adding ```--progress```.
* `sync-rsync.exclude`: rsync exclude patterns e.g. [".git",".vscode"] (includes happen before excludes) See [Includes / Excludes](#includes--excludes).
* `sync-rsync.include`: rsync exclude patterns e.g. ["*/","**/*.php] (includes happen before excludes) See [Includes / Excludes](#includes--excludes).
* `sync-rsync.shell`: Rsync's -e option e.g. ssh -p 1234.
* `sync-rsync.chmod`: Rsync's --chmod option.
* `sync-rsync.options`: Array of extra rsync options, set each element using [rsync.set](https://github.com/mattijs/node-rsync#setoption-value). See [Extra Options](#extra-options).
* `sync-rsync.args`: Array of extra arguments to append to rsync e.g. ```["--exclude=venv/", "--include=*/", "--include=**/*.py", "--exclude=*"]```.

Sites (Completely Optional, If no sites are defined Sync Rsync creates one using defaults):

* `sync-rsync.sites`: Multiple Site Support [Multiple Sites](#multiple-sites).

## Workspaces

For workspaces you have to define ```localPath``` and ```remotePath``` for each folder you want synced. e.g.

```javascript
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
				"localPath": "/home/user/project/s1/",
				"remotePath": "user@server:/var/www/s1/"
			},
			{
				"localPath": "/home/user/projects/t2/",
				"remotePath": "user@server:/var/www/s2/"
			}
		]
	}
}
```

## Multiple Sites

Sites have these options, they are all optional sync-rsync will use the defaults if they are not defined:

* `name`: a Nickname for single site sync.
* `upOnly`: this site only sync Local to Remote.
* `downOnly`: this site only sync Remote to Local.
* `localPath`: the local location defaults to workspace (must end in path separator).
* `localPath`: the local location defaults to workspace (must end in path separator).
* `remotePath`: the rsync remote location e.g. user@remote:path (must end in path separator).
* `deleteFiles`: true or false if you want rsync to delete files.
* `flags`: rsync flags.
* `exclude`: rsync exclude patterns e.g. [".git",".vscode"] (includes happen before excludes) See [Includes / Excludes](#includes--excludes).
* `include`: rsync exclude patterns e.g. ["*/","**/*.php] (includes happen before excludes) See [Includes / Excludes](#includes--excludes).
* `shell`: Rsync's -e option e.g. ssh -p 1234.
* `afterSync`: a command to run after successful sync up (e.g. clear cache). First item in array is the command the rest are arguments. e.g.  ['ssh','user@server','~/cr.sh'].
* `chmod`: Rsync's --chmod option.
* `options`: Array of extra rsync options, set each element using [rsync.set](https://github.com/mattijs/node-rsync#setoption-value). See [Extra Options](#extra-options).
* `args`: Array of extra arguments to append to rsync e.g. ```["--exclude=venv/", "--include=*/", "--include=**/*.tpl", "--exclude=*"]```.

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

## Extra Options

The `options` array is an array of arrays [rsync.set](https://github.com/mattijs/node-rsync#setoption-value) is call with each array spread as paramamiters e.g:

```javascript

"sync-rsync.options": [
    ['progress'],
    ['exclude-from', '/path/to/exclude-file'],
    ['delete'],
]
```

## Includes / Excludes

Includes happen before Excludes, this is important because rsync handles a file based on first match, so for example to only upload php files:

```javascript
{
    "sync-rsync.exclude":[
        "*"
    ],
    "sync-rsync.include": [
        "*/",
        "**/*.php"
    ],
}
```

if you need more control use ```sync-rsync.args```


## Windows Notes

If using cywgin, `sync-rsync.cygpath` is needed for things like `onSaveIndividual` to work because cygwin uses diferent paths as windows.

Here is as example config:

```javascript
{
    "sync-rsync.executable": "/bin/rsync",
    "sync-rsync.shell": "/bin/ssh -p 2222",
    "sync-rsync.remote": "root@server:/root/test/",
    "sync-rsync.local": "c:\\Users\\root\\sync_test\\",
    "sync-rsync.onSaveIndividual": true,
    "sync-rsync.cygpath": "C:\\cygwin64\\bin\\cygpath.exe",
    "sync-rsync.executableShell": "C:\\cygwin64\\bin\\bash.exe"
}
```

Here is and example config for WSL:

```javascript
{
    "sync-rsync.remote": "root@server:/root/folder/",
    "sync-rsync.local": "/mnt/c/Users/root/folder/",
    "sync-rsync.useWSL": true
}
```

## Mac OS Notes

If you are using the `shell` option to do something like `ssh -p 123` you will most likely have the set `sync-rsync.executableShell` to `/bin/bash`
