# sync-rsync

Basic sync using Rsync

## Features

This extension syncs with a remote server using rsync

With these commands:

* `Sync - Rsync: Local to Remote`
* `Sync - Rsync: Remote to local`

## Requirements

Rsync installed both locally and remotely

## Extension Settings

This extension contributes the following settings:

* `sync-rsync.remote`: the rsync remote location e.g. user@remote:path (must end in path separator)
* `sync-rsync.local`: the local location defaults to workspace (must end in path separator)
* `sync-rsync.delete`: true or false if you want rsync to delete files
* `sync-rsync.flags`: rsync flags
* `sync-rsync.exclude`: rsync exclude patterns e.g.  [".git",".vscode"]
* `sync-rsync.onSave`: sync project on save (currently syncs entire project because I do not have an easy way to deal with excluded files)
* `sync-rsync.autoShowOutput`: Auto show rsync output when rsync is working
* `sync-rsync.autoHideOutput`: Auto hide rsync output when rsync is done
* `sync-rsync.shell`: Rsync's -e option e.g. ssh -p 1234
* `sync-rsync.chmod`: Rsync's --chmod option

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
