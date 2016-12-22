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

* `sync-rsync.remote`: the rsync remote location e.g. user@remote:path
* `sync-rsync.delete`: true or false if you want rsync to delete files
* `sync-rsync.flags`: rsync flags

### 0.4.1

Added ability to delete and specify flags

### 0.1.0

Initial release
