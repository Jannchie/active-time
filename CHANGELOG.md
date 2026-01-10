## v0.6.3

[v0.6.2...v0.6.3](https://github.com/Jannchie/active-time/compare/v0.6.2...v0.6.3)

## v0.6.2

[v0.6.1...v0.6.2](https://github.com/Jannchie/active-time/compare/v0.6.1...v0.6.2)

### :wrench: Chores

- **npmrc**: add node-linker hoisted config - By [Jianqi Pan](mailto:jannchie@gmail.com) in [329f2dc](https://github.com/Jannchie/active-time/commit/329f2dc)

## v0.6.1

[v0.6.0...v0.6.1](https://github.com/Jannchie/active-time/compare/v0.6.0...v0.6.1)

### :adhesive_bandage: Fixes

- **build**: correct asarUnpack glob && update files for packaging - By [Jianqi Pan](mailto:jannchie@gmail.com) in [4ced903](https://github.com/Jannchie/active-time/commit/4ced903)

## v0.6.0

[v0.5.0...v0.6.0](https://github.com/Jannchie/active-time/compare/v0.5.0...v0.6.0)

### :wrench: Chores

- **build**: adjust scripts and eslint config && comment mac publish step - By [Jianqi Pan](mailto:jannchie@gmail.com) in [9c03acd](https://github.com/Jannchie/active-time/commit/9c03acd)
- **ci**: trigger publish on tag push - By [Jianqi Pan](mailto:jannchie@gmail.com) in [b6e01be](https://github.com/Jannchie/active-time/commit/b6e01be)
- **ci**: enable workflow dispatch and set write permissions - By [Jianqi Pan](mailto:jannchie@gmail.com) in [797553c](https://github.com/Jannchie/active-time/commit/797553c)
- **testing**: remove sample test and update ignore configs - By [Jianqi Pan](mailto:jannchie@gmail.com) in [b1122db](https://github.com/Jannchie/active-time/commit/b1122db)

## v0.5.0

[v0.4.0...v0.5.0](https://github.com/Jannchie/active-time/compare/v0.4.0...v0.5.0)

### :sparkles: Features

- **scripts**: add install-app-deps script with ci skip logic - By [Jianqi Pan](mailto:jannchie@gmail.com) in [9c0a061](https://github.com/Jannchie/active-time/commit/9c0a061)

### :adhesive_bandage: Fixes

- **build**: improve electron version handling && add install fallback in ci - By [Jianqi Pan](mailto:jannchie@gmail.com) in [8da2b49](https://github.com/Jannchie/active-time/commit/8da2b49)
- **build**: enable glob for source map deletion - By [Jianqi Pan](mailto:jannchie@gmail.com) in [4e77e14](https://github.com/Jannchie/active-time/commit/4e77e14)

### :art: Refactors

- **scripts**: replace rimraf with rimrafSync - By [Jianqi Pan](mailto:jannchie@gmail.com) in [85cc5c7](https://github.com/Jannchie/active-time/commit/85cc5c7)

### :wrench: Chores

- **ci**: remove explicit pnpm version from workflows - By [Jianqi Pan](mailto:jannchie@gmail.com) in [29adb0a](https://github.com/Jannchie/active-time/commit/29adb0a)

## v0.4.0

[v0.3.0...v0.4.0](https://github.com/Jannchie/active-time/compare/v0.3.0...v0.4.0)

### :rocket: Breaking Changes

- **activity-db**: remove title column from activity records and update related schema and ui - By [Jianqi Pan](mailto:jannchie@gmail.com) in [a4c5bf2](https://github.com/Jannchie/active-time/commit/a4c5bf2)
- **db**: migrate to drizzle-orm and better-sqlite3 - By [Jianqi Pan](mailto:jannchie@gmail.com) in [0e77256](https://github.com/Jannchie/active-time/commit/0e77256)
- **renderer**: migrate renderer from react to vue + nuxt ui - By [Jianqi Pan](mailto:jannchie@gmail.com) in [f8c41b6](https://github.com/Jannchie/active-time/commit/f8c41b6)

### :sparkles: Features

- **background-tracking**: add background app time tracking and display - By [Jianqi Pan](mailto:jannchie@gmail.com) in [e22aaf8](https://github.com/Jannchie/active-time/commit/e22aaf8)
- **i18n**: add multi-language support with vue-i18n and integrate app/locale switching - By [Jianqi Pan](mailto:jannchie@gmail.com) in [5c72542](https://github.com/Jannchie/active-time/commit/5c72542)
- **processes**: replace native process lookups with node native addon && add icon cache to disk && enhance process view sorting - By [Jianqi Pan](mailto:jannchie@gmail.com) in [206439c](https://github.com/Jannchie/active-time/commit/206439c)
- **processes**: add processes view and app icon support && implement foreground/background program tracking && add adjustable sampling interval - By [Jianqi Pan](mailto:jannchie@gmail.com) in [66276fe](https://github.com/Jannchie/active-time/commit/66276fe)

## v0.3.0

[v0.2.3...v0.3.0](https://github.com/Jannchie/active-time/compare/v0.2.3...v0.3.0)

### :sparkles: Features

- start on boot - By [Jannchie](mailto:jannchie@gmail.com) in [69a90d7](https://github.com/Jannchie/active-time/commit/69a90d7)

## v0.2.3

[v0.2.2...v0.2.3](https://github.com/Jannchie/active-time/compare/v0.2.2...v0.2.3)

### :sparkles: Features

- update package - By [Jannchie](mailto:jannchie@gmail.com) in [deb4f7b](https://github.com/Jannchie/active-time/commit/deb4f7b)

### :adhesive_bandage: Fixes

- time format - By [Jannchie](mailto:jannchie@gmail.com) in [aee54ef](https://github.com/Jannchie/active-time/commit/aee54ef)

## v0.2.2

[v0.2.1...v0.2.2](https://github.com/Jannchie/active-time/compare/v0.2.1...v0.2.2)

### :adhesive_bandage: Fixes

- time format - By [Jannchie](mailto:jannchie@gmail.com) in [846ee05](https://github.com/Jannchie/active-time/commit/846ee05)

## v0.2.1

[v0.2.0...v0.2.1](https://github.com/Jannchie/active-time/compare/v0.2.0...v0.2.1)

### :adhesive_bandage: Fixes

- db - By [Jannchie](mailto:jannchie@gmail.com) in [063267f](https://github.com/Jannchie/active-time/commit/063267f)

## v0.2.0

[v0.1.5...v0.2.0](https://github.com/Jannchie/active-time/compare/v0.1.5...v0.2.0)

### :sparkles: Features

- support daily & hourly data - By [Jannchie](mailto:jannchie@gmail.com) in [819e93b](https://github.com/Jannchie/active-time/commit/819e93b)

### :memo: Documentation

- update changelog & version - By [Jannchie](mailto:jannchie@gmail.com) in [f6d302b](https://github.com/Jannchie/active-time/commit/f6d302b)

## v0.1.5

[v0.1.4...v0.1.5](https://github.com/Jannchie/active-time/compare/v0.1.4...v0.1.5)

### :adhesive_bandage: Fixes

- windows tray - By [Jannchie](mailto:jannchie@gmail.com) in [813fda8](https://github.com/Jannchie/active-time/commit/813fda8)

## v0.1.4

[v0.1.3...v0.1.4](https://github.com/Jannchie/active-time/compare/v0.1.3...v0.1.4)

### :adhesive_bandage: Fixes

- icons - By [Jannchie](mailto:jannchie@gmail.com) in [3488354](https://github.com/Jannchie/active-time/commit/3488354)
- icon - By [Jannchie](mailto:jannchie@gmail.com) in [927e0ae](https://github.com/Jannchie/active-time/commit/927e0ae)
- icons - By [Jannchie](mailto:jannchie@gmail.com) in [4b3b1e7](https://github.com/Jannchie/active-time/commit/4b3b1e7)

## v0.1.3

[v0.1.2...v0.1.3](https://github.com/Jannchie/active-time/compare/v0.1.2...v0.1.3)

### :adhesive_bandage: Fixes

- icon - By [Jannchie](mailto:jannchie@gmail.com) in [afd1a86](https://github.com/Jannchie/active-time/commit/afd1a86)
- mac exit - By [Jannchie](mailto:jannchie@gmail.com) in [3b9efb6](https://github.com/Jannchie/active-time/commit/3b9efb6)

## v0.1.2

[v0.1.1...v0.1.2](https://github.com/Jannchie/active-time/compare/v0.1.1...v0.1.2)

### :sparkles: Features

- add index - By [Jannchie](mailto:jannchie@gmail.com) in [8ee7725](https://github.com/Jannchie/active-time/commit/8ee7725)
- about - By [Jannchie](mailto:jannchie@gmail.com) in [453cbbc](https://github.com/Jannchie/active-time/commit/453cbbc)

### :adhesive_bandage: Fixes

- bug & update: change log - By [Jannchie](mailto:jannchie@gmail.com) in [aea2634](https://github.com/Jannchie/active-time/commit/aea2634)
- theme - By [Jannchie](mailto:jannchie@gmail.com) in [48b052f](https://github.com/Jannchie/active-time/commit/48b052f)

## v0.1.1

[v0.1.0...v0.1.1](https://github.com/Jannchie/active-time/compare/v0.1.0...v0.1.1)

### :adhesive_bandage: Fixes

- mac adaptation - By [Jannchie](mailto:jannchie@gmail.com) in [56e47e1](https://github.com/Jannchie/active-time/commit/56e47e1)

## v0.1.0

[ac100e6c166eda104adfd242cc9a9b3a6e46601a...v0.1.0](https://github.com/Jannchie/active-time/compare/ac100e6c166eda104adfd242cc9a9b3a6e46601a...v0.1.0)

### :sparkles: Features

- use new boilerplate - By [Jannchie](mailto:jannchie@gmail.com) in [46e4cf6](https://github.com/Jannchie/active-time/commit/46e4cf6)

### :adhesive_bandage: Fixes

- mac adaptation - By [Jannchie](mailto:jannchie@gmail.com) in [e2d9589](https://github.com/Jannchie/active-time/commit/e2d9589)

# Change log

## [0.2.3 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.2.3)

**What's Changed**

- Fixed time format

## [0.2.2 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.2.2)

**What's Changed**

- Fixed time format

## [0.2.1 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.2.1)

**What's Changed**

- Fixed database bugs

## [0.2.0 - Collect Hourly & Daily Data](https://github.com/Jannchie/active-time/releases/tag/v0.2.0)

**What's Changed**

- Enable counting data by the hour and by the day.
- Added a new chart for statistics on the most commonly used applications in a period of time.
- Optimized animation and update effects for charts.
- Modified layout

## [0.1.5 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.1.5)

**What's Changed**

- Fixed exit & minimize behavior on Windows

## [0.1.4 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.1.4)

**What's Changed**

- Beautify tray icons on MacOS.
- Fix the bug of icon not display on macOS.

## [0.1.3 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.1.3)

**What's Changed**

- New window control logic is used:
  - On the Mac, clicking the Close window button will only hide the window.
  - The exit button in the tray will actually exit the program.
- Beautify the style.
- Fixed icon size issues.

## [0.1.2 - Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.1.2)

**What's Changed**

- Added a wait prompt when there is no data.
- Added the tray option to open the home screen.
- Beautify the light Mode chart color scheme
- Deleting data now frees up disk space.
- Fixed the issue that the chart flickers when updating data.
- Fixed the problem of incorrect theme switching.
- Optimized render process update strategy.

## [0.1.1 - Mac Bug Fix](https://github.com/Jannchie/active-time/releases/tag/v0.1.1)

**What's Changed**

- Fixed an issue where data could not be recorded on a Mac.

## [0.1.0 - 🚀 Started the project!](https://github.com/Jannchie/active-time/releases/tag/v0.1.0)

This is a desktop application that counts the time spent operating your computer.

Powered by Electron. Windows and Mac versions are currently available.
