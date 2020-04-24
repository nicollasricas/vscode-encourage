import * as vscode from "vscode";
import { defaultEncouragements, defaultDiscouragements } from "./defaults";

const decorationType = vscode.window.createTextEditorDecorationType({
  after: {
    margin: "0 0 0 3em",
    textDecoration: "none",
  },
  isWholeLine: true,
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
});

let encouragements: string[] = [];
let discouragements: string[] = [];
let seenEncouragements: string[] = [];
let seenDiscouragements: string[] = [];
let random: boolean = true;

export function activate(context: vscode.ExtensionContext) {
  loadConfiguration();

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((_) => onDocumentSaved())
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => onConfigurationChanged(e))
  );
}

export function deactivate() {}

function onDocumentSaved() {
  if (vscode.window.activeTextEditor) {
    haveDiagnostic() ? showDiscouragement() : showEncouragement();
  }
}

function loadConfiguration() {
  const configuration = vscode.workspace.getConfiguration("encourage");

  encouragements = configuration.get<string[]>("encouragements", []);

  if (!encouragements.length) {
    encouragements = defaultEncouragements;
  }

  encouragements = encouragements.concat(
    configuration.get<string[]>("additionalEncouragements", [])
  );

  discouragements = configuration.get<string[]>("discouragements", []);

  if (!discouragements.length) {
    discouragements = defaultDiscouragements;
  }

  discouragements = discouragements.concat(
    configuration.get<string[]>("additionalDiscouragements", [])
  );

  random = configuration.get<boolean>("random", true);
}

function onConfigurationChanged(e: vscode.ConfigurationChangeEvent) {
  if (e.affectsConfiguration("encourage")) {
    loadConfiguration();
  }
}

function haveDiagnostic() {
  const diagnostics = vscode.languages.getDiagnostics(
    vscode.window.activeTextEditor!.document.uri
  );

  for (const diagnostic of diagnostics) {
    if (
      diagnostic.severity === vscode.DiagnosticSeverity.Error ||
      diagnostic.severity === vscode.DiagnosticSeverity.Warning
    ) {
      return true;
    }
  }

  return false;
}

function showDiscouragement() {
  const discouragements = random
    ? getDiscouragement()
    : getNotSeenDiscouragement();

  setDecoration(discouragements);
}

function showEncouragement() {
  const encouragement = random ? getEncouragement() : getNotSeenEncouragement();

  setDecoration(encouragement);
}

function setDecoration(text: string) {
  const editor = vscode.window.activeTextEditor!;

  const decorationOptions: vscode.DecorationOptions = {
    range: new vscode.Range(editor.selection.start, editor.selection.end),
    renderOptions: {
      after: {
        contentText: text,
        fontWeight: "normal",
        fontStyle: "normal",
      },
    },
  };

  editor.setDecorations(decorationType, [decorationOptions]);

  setHideTimeout();
}

function getNotSeenEncouragement(): string {
  if (seenEncouragements.length === encouragements.length) {
    seenEncouragements = [];
  }

  for (const encouragement of encouragements) {
    if (seenEncouragements.includes(encouragement)) {
      continue;
    }

    seenEncouragements.push(encouragement);

    return encouragement;
  }

  return getEncouragement();
}

function getNotSeenDiscouragement(): string {
  if (seenDiscouragements.length === discouragements.length) {
    seenDiscouragements = [];
  }

  for (const discouragement of discouragements) {
    if (seenDiscouragements.includes(discouragement)) {
      continue;
    }

    seenEncouragements.push(discouragement);

    return discouragement;
  }

  return getDiscouragement();
}

function getEncouragement() {
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

function getDiscouragement() {
  return discouragements[Math.floor(Math.random() * discouragements.length)];
}

function setHideTimeout() {
  setTimeout(() => {
    vscode.window.activeTextEditor!.setDecorations(decorationType, []);
  }, 3500);
}
