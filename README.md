# IndentNavKit

Speed up file navigation by jumping through indentation blocks

Modified version of indent navigation extension originally by Tony Malykh (https://github.com/mltony/vscode-indent-nav)
- made the indent block navigation a little more intuitive, similar to this plugin for sublime text: https://packagecontrol.io/packages/Jump%20Along%20Indent
- also adding commands to extend selection region while jumping by indent blocks

## Installation

### From VSCode

File -> Preferences -> Extensions -> Search for "indentnavkit", install

### Build it yourself

```
# from the repo base
sudo npm install -g vsce
npm install
vsce package
```

This should pop out a `indent-nav-kit-1.0.0.vsix` file

#### Installation via command line

```code --install-extension indent-nav-kit.vsix```

#### Installation from VSCode GUI

In VSCode, Press `Control+Shift+X` to navigate to extensions manager.
Then click on the actions menu, and select `Install from vsix`.

## Keystrokes

* Alt+Up/Down - jump to previous/next line with the same indentation level (or within the same indention block)
* Alt+Shift+Up/Down - same as above, but extending selection/highlight

## Issues/pull requests

https://github.com/apollokit/vscode-indent-nav