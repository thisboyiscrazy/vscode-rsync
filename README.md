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

If a sync is running clicking the status bar item will kill the running sync

## Requirements

Rsync installed both locally and remotely

## Extension Settings

This extension contributes the following settings:

* `sync-rsync.autoShowOutput`: Auto show rsync output when rsync is working
* `sync-rsync.autoHideOutput`: Auto hide rsync output when rsync is done
* `sync-rsync.onSave`: sync project on save (currently syncs entire project because I do not have an easy way to deal with excluded files)
* `sync-rsync.executableShell`: The executable shell to run rsync in (e.g. /bin/sh)

Default Site Options:

* `sync-rsync.local`: the local location defaults to workspace (must end in path separator)
* `sync-rsync.remote`: the rsync remote location e.g. user@remote:path (must end in path separator)
* `sync-rsync.delete`: true or false if you want rsync to delete files
* `sync-rsync.flags`: rsync flags
* `sync-rsync.exclude`: rsync exclude patterns e.g. [".git",".vscode"]
* `sync-rsync.shell`: Rsync's -e option e.g. ssh -p 1234
* `sync-rsync.chmod`: Rsync's --chmod option

Sites (Completely Optional, If no sites are defined Sync Rsync creates one using defaults):

* `sync-rsync.sites`: Multiple Site Support [Multiple Sites](#multiple-sites)

## Multiple Sites

Sites have these options, they are all optional sync-rsync will use the defaults if they are not defined:

* `localPath`: the local location defaults to workspace (must end in path separator)
* `remotePath`: the rsync remote location e.g. user@remote:path (must end in path separator)
* `deleteFiles`: true or false if you want rsync to delete files
* `flags`: rsync flags
* `exclude`: rsync exclude patterns e.g. [".git",".vscode"]
* `shell`: Rsync's -e option e.g. ssh -p 1234
* `chmod`: Rsync's --chmod option

Example :

```
{
    "sync-rsync.delete": true,
    "sync-rsync.sites": [
        {
            "remotePath":"user1@server1:/path1/",
            "shell":"ssh -p 1234"
        },
        {
            "remotePath":"user2@server2:/path2/",
        }
    ]
}
```

## Debian Notes

Because Debian links `/bin/sh` to `/bin/dash` and dash does not do process management for Sync Rsync to kill the running sync you must set 

```
"sync-rsync.executableShell": "/bin/bash"
```

See [Node Rsync](https://github.com/mattijs/node-rsync#executableshellshell)

## Windows Notes

If you are using rsync that uses cygwin you will need to set `"sync-rsync.local"` to use cygwin drives e.g.:

```
"sync-rsync.local": "/cygdrive/c/Users/joe/Documents/projects/sync_test/"
```

## Change Log

### 0.16.0

Kill running sync

### 0.15.0

Multisite support

### 0.14.0

Minor color scheme change

### 0.13.0

Lots of minor updates thanks to https://github.com/leshniak

### 0.12.0

added sync-rsync.autoShowOutput

### 0.11.5

revert breaking changes

### 0.10.0

local in config

### 0.9.3

readme fix

### 0.9.2

path seperator fix

### 0.9.0

chmod option

### 0.8.0

shell option

### 0.7.0

Auto hide rsync output when rsync is done


### 0.6.1

Upgraded rsync library

### 0.6.0

Sync on save

### 0.5.1

Exclude patterns

### 0.4.1

Added ability to delete and specify flags

### 0.1.0

Initial release
