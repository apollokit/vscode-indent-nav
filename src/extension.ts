// modified from original at https://github.com/mltony/vscode-indent-nav

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { setFlagsFromString } from 'v8';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let indentNav = new IndentNav();
	console.log('indent-nav-kit is now active!');
	// vscode.window.showInformationMessage('indent-nav-kit is now active!');

	let nextSibling = vscode.commands.registerCommand('indent-nav.nextSibling', () => {
		indentNav.jumpToIndent(true, false);
	});
	context.subscriptions.push(nextSibling);
	let previousSibling = vscode.commands.registerCommand('indent-nav.previousSibling', () => {
		indentNav.jumpToIndent(false, false);
	});
	context.subscriptions.push(previousSibling);
	
	let nextSiblingWithSelection = vscode.commands.registerCommand('indent-nav.nextSiblingWithSelection', () => {
		indentNav.jumpToIndent(true, true);
	});
	context.subscriptions.push(nextSiblingWithSelection);
	let previousSiblingWithSelection = vscode.commands.registerCommand('indent-nav.previousSiblingWithSelection', () => {
		indentNav.jumpToIndent(false, true);
	});
	context.subscriptions.push(previousSiblingWithSelection);
}

export function deactivate() {}

class IndentNav {
	protected jumpTo(line:number, column:number, withSelection: boolean = false) {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		// the start, or "anchor", of the existing selection region, if there is any
		let startPosition = editor.selection.anchor;
		// the position we're jumping to
		let stopPosition = editor.selection.active.with(line, column);
		if (!withSelection) {
			startPosition = stopPosition;
		}
		editor.selection = new vscode.Selection(startPosition, stopPosition);
		editor.revealRange(new vscode.Range(startPosition, stopPosition));
	}

	public getLevel(line: any): number{
		if (line.text.toString().trimRight().length === 0) {
			return -1;
		} else {
			return line.firstNonWhitespaceCharacterIndex;
		}
	}

	/**
	* Jump to a desired location, based on indent block, from current location
	*
	* @remarks
	*  	- if currently in an indent block, will jump to the end/beginning of that block
	*	- otherwise, we'll jump to the next indent block at the same level
	*
	* @param forwards - whether we should jump to the next indent forwards, or backwards
	* @param withSelection - if true, the jump will be done while extending the selection region
	*/
	public jumpToIndent(forwards: boolean = true, withSelection: boolean = false) {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let numLines = editor.document.lineCount;

		// current line being considered in the seeking code below
		// make sure we choose the end of any current selection region
		let iCurrLine = editor.selection.end.line;
		let iLastLine = iCurrLine;

		// original level - the indent level that we are trying to match
		// use the position of the cursor as the original level
		let originalLevel = editor.selection.active.character;
		// though, if we're past the first non whitespace character of the line, then use that character
		let line = editor.document.lineAt(iCurrLine);
		let firstChar = this.getLevel(line);
		originalLevel = Math.min(firstChar, originalLevel);
		// if we're on a blank line (level == -1) then just assume 0 (i.e. any line at lowest indent)
		originalLevel = Math.max(originalLevel, 0);

		let found = false;
		// the line to jump to
		let iJump = -1;

		// if the previous line level matched the original level. Use this to keep track of whether 
		// or not we are in an indent block. Assume we are not, to start
		let prevWasMatch = false;
		let firstStep = true;

		let lineIncrement = 1;
		if (!forwards) {
			lineIncrement = -1;
		}
		while (!found) {
			iCurrLine += lineIncrement;

			// check if we're immediately stepping off the beginning/end of the doc
			if ((iCurrLine >= numLines) || (iCurrLine < 0)) {
				break;
			}			

			let line = editor.document.lineAt(iCurrLine);
			let level = this.getLevel(line);
			// if we're at the same level as the original line
			let levelMatches = level == originalLevel;
			
			// check first/last line of doc
			if ((iCurrLine == numLines - 1) || (iCurrLine == 0)) {
				if (levelMatches) {
					iJump = iCurrLine;
					found = true;
				}
				// if no match, then just leave us at the starting place
				break;
			}

			// we're at the beginning of a new indent block at the original level - we should stop
			if (levelMatches && !prevWasMatch && !firstStep) {
				iJump = iCurrLine;
				found = true;
			}
			// we're off the end of an indent block at the original level - we should stop
			if (!levelMatches && prevWasMatch) {
				iJump = iLastLine;
				found = true;
			}

			iLastLine = iCurrLine;
			prevWasMatch = levelMatches;
			firstStep = false;
		}

		if (found) {
			this.jumpTo(iJump, originalLevel, withSelection);
		}
		else {
			let message = '';
			if (forwards) {
				message = 'No next';
			}
			else {
				message = 'No previous';
			}
			vscode.window.showWarningMessage(message);
		}

	}
}
