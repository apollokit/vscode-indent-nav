// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { setFlagsFromString } from 'v8';
//import * as qqq from 'typescript/lib/lib.es5.d';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let indentNav = new IndentNav();
	console.log('indent-nav-kit is now active!');
	vscode.window.showInformationMessage('indent-nav-kit is now active!');

	// let wordRight = vscode.commands.registerCommand('indent-nav.wordRight', () => {
	// 	indentNav.moveByWord(1);
	// });
	// context.subscriptions.push(wordRight);
	// let wordLeft = vscode.commands.registerCommand('indent-nav.wordLeft', () => {
	// 	indentNav.moveByWord(-1);
	// });
	// context.subscriptions.push(wordLeft);

	let nextSibling = vscode.commands.registerCommand('indent-nav.nextSibling', () => {
		indentNav.jumpToIndent();
	});
	context.subscriptions.push(nextSibling);
	let previousSibling = vscode.commands.registerCommand('indent-nav.previousSibling', () => {
		indentNav.jumpToIndent(false);
	});
	context.subscriptions.push(previousSibling);
	
	// let nextSiblingForce = vscode.commands.registerCommand('indent-nav.nextSiblingForce', () => {
	// 	indentNav.jumpToIndent(1, 0, true);
	// });
	// context.subscriptions.push(nextSiblingForce);
	// let previousSiblingForce = vscode.commands.registerCommand('indent-nav.previousSiblingForce', () => {
	// 	indentNav.jumpToIndent(-1, 0, true);
	// });
	// context.subscriptions.push(previousSiblingForce);
	// let lastSibling = vscode.commands.registerCommand('indent-nav.lastSibling', () => {
	// 	indentNav.jumpToIndent(1, 0, false, true);
	// });
	// context.subscriptions.push(lastSibling);
	// let firstSibling = vscode.commands.registerCommand('indent-nav.firstSibling', () => {
	// 	indentNav.jumpToIndent(-1, 0, false, true);
	// });
	// context.subscriptions.push(firstSibling);

	// let nextChild = vscode.commands.registerCommand('indent-nav.nextChild', () => {
	// 	indentNav.jumpToIndent(1, 1);
	// });
	// context.subscriptions.push(nextChild);
	// let previousChild = vscode.commands.registerCommand('indent-nav.previousChild', () => {
	// 	indentNav.jumpToIndent(-1, 1);
	// });
	// context.subscriptions.push(previousChild);
	// let previousParent = vscode.commands.registerCommand('indent-nav.previousParent', () => {
	// 	indentNav.jumpToIndent(-1, -1, true);
	// });
	// context.subscriptions.push(previousParent);
	// let nextParent = vscode.commands.registerCommand('indent-nav.nextParent', () => {
	// 	indentNav.jumpToIndent(1, -1, true);
	// });
	// context.subscriptions.push(nextParent);
	// let startSelection = vscode.commands.registerCommand('indent-nav.startSelection', () => {
	// 	indentNav.startSelection();
	// });
	// context.subscriptions.push(startSelection);
	// let finishSelection = vscode.commands.registerCommand('indent-nav.finishSelection', () => {
	// 	indentNav.finishSelection();
	// });
	// context.subscriptions.push(finishSelection);

}

export function deactivate() {}

class IndentNav {
	protected jumpTo(line:number, column:number) {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let newPosition = editor.selection.active.with(line, column);
		editor.selection = new vscode.Selection(newPosition, newPosition);
		editor.revealRange(new vscode.Range(newPosition, newPosition));
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
	* 
	*
	* @param indentBlockIncrement - number of indent blocks to jump. Will first jump to beginning/end of current block, then to the next one
	* @param y - The second input number
	* @returns The arithmetic mean of `x` and `y`
	*
	* @beta
	*/
	public jumpToIndent(forwards: boolean = true) {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let numLines = editor.document.lineCount;

		// current line being considered in the seeking code below
		let iCurrLine = editor.selection.start.line;
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
			this.jumpTo(iJump, originalLevel);
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

	/* public moveByWord(increment:number) {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let lineCount = editor.document.lineCount;
		let lineIndex = editor.selection.start.line;
		let charIndex = editor.selection.start.character
		let regexp: RegExp = /(?!_\b)\w+/g;
		while (true) {
			let line = editor.document.lineAt(lineIndex).text.toString();
		
			let words = new Array();
			while(true) {
				let m = regexp.exec(line);
				if (!m) {
					break;
				}
				words.push(m.index);
			}
			let currentWordIndex:number = -1;
			let newWordIndex = currentWordIndex + increment;
			for (let i=0; i < words.length; i++) {
				if (words[i] == charIndex) {
					currentWordIndex = i;
					newWordIndex = currentWordIndex + increment;
					break;
				} else if (words[i] < charIndex) {
					currentWordIndex = i;
					if (increment > 0) {
						newWordIndex = i+1;
					} else {
						newWordIndex = i;
					}
				} else {
					break;
				}
			}
			if ((newWordIndex >= 0) && (newWordIndex < words.length)) {
				this.jumpTo(lineIndex, words[newWordIndex]);
				return;
			}
			let newLineIndex = lineIndex + increment;
			if ((newLineIndex < 0) || (newLineIndex >= lineCount)) {
				if (increment > 0) {
					this.jumpTo(lineIndex, line.length);
				} else {
					this.jumpTo(lineIndex, 0);
				}
				return;
			}
			lineIndex = newLineIndex;
			if (increment > 0) {
				charIndex = -1;
			} else {
				charIndex = 999999;
			}
		}
	}

	selectionLineIndex: number = -1;

	public startSelection() {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		this.selectionLineIndex = editor.selection.start.line;
		vscode.window.showInformationMessage('Selection start marked.');
	}

	public finishSelection() {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let lineIndex = editor.selection.start.line;
		let line1 = -1, line2 = -1;
		if (lineIndex > this.selectionLineIndex) {
			line1 = this.selectionLineIndex;
			line2 = lineIndex;
		} else {
			line2 = this.selectionLineIndex;
			line1 = lineIndex;
		}
		let position1 = editor.document.lineAt(line1).range.start;
		let position2 = editor.document.lineAt(line2).range.end;
		editor.selection = new vscode.Selection(position1, position2);
		editor.revealRange(new vscode.Range(position1, position2));

	} */
}
