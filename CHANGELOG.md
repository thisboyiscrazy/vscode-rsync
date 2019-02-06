# Change Log
All notable changes to the "sync-rsync" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Change Log

### 0.34.4

Fix for util.promisify not being present in older VSCode

### 0.34.3

Fix for breaking cygwin

### 0.34.2

removed skip localPaths that do not exist

Could not do reliably with cygwin, wls, linux, and mac os

### 0.34.1

Fix for when using cygwin

### 0.34.0

Context Menus for sync

### 0.33.0

skip localPaths that do not exist

### 0.32.0

automatically add trailing /

### 0.31.0

replace `${workspaceRoot}` in options

### 0.30.0

`Sync-Rsync: Sync Local to Remote (Single)`

`Sync-Rsync: Sync Remote to local (Single)`

`upOnly`: this site only sync Local to Remote.

`downOnly`: this site only sync Remote to Local.

### 0.29.0

`sync-rsync.useWSL`: Use WSL for executing rsync. See [Windows Notes](#windows-notes)

### 0.28.0

`sync-rsync.autoLoadIndividual` : do rsync on load to ensure the last file is available locally (defaults to false).

`sync-rsync.showProgress` : show progress during rsync (defaults to true).

### 0.27.1

`sync-rsync.autoShowOutputOnError`

### 0.27.0

`sync-rsync.include`

`sync-rsync.args`

### 0.26.0

Added notification option

### 0.25.0

Possible breaking changes
Imporoved Cygwin and WSL support thanks @idanpa.

### 0.24.0

Add support for workspaceFolder and workspaceFolderBasename

### 0.23.0

`sync-rsync.watchGlobs`

### 0.22.0

cygpath option and fix issue #33

### 0.21.0

executable option.

Should fix problems on windows.

### 0.20.0

onSaveIndividual

### 0.19.0

onSaveIndividual

### 0.18.2

fix error in remote replace code

### 0.18.1

commands fix

### 0.18.0

Extra rsync options

### 0.17.0

Replace of ${workspaceRoot}

### 0.16.1

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
