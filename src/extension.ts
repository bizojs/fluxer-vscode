import * as vscode from "vscode";
import { FluxerClient, FluxerApiError } from "./FluxerClient";
import { buildStatus } from "./StatusBuilder";

let client: FluxerClient | null = null;

let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        10
    );
    statusBarItem.command = "fluxer-presence.setToken";
    context.subscriptions.push(statusBarItem);

    const token = await context.secrets.get("fluxerPresence.token");

    if (!token) {
        await vscode.window.showInformationMessage(
            "Fluxer: Please enter your token to get started.",
            "Set token"
        ).then(selection => {
            if (selection === "Set token") {
                cmdSetToken(context);
            }
        });
    }

    await tryInitClient(context);

    context.subscriptions.push(
        vscode.commands.registerCommand("fluxer-presence.setToken", () => cmdSetToken(context)),
        vscode.commands.registerCommand("fluxer-presence.clearToken", () => cmdClearToken(context)),
        vscode.commands.registerCommand("fluxer-presence.enable", () => {
            vscode.workspace
                .getConfiguration("fluxerPresence")
                .update("enabled", true, vscode.ConfigurationTarget.Global);
        }),
        vscode.commands.registerCommand("fluxer-presence.disable", () => {
            vscode.workspace
                .getConfiguration("fluxerPresence")
                .update("enabled", false, vscode.ConfigurationTarget.Global);
        }),
        vscode.commands.registerCommand("fluxer-presence.clearStatus", () => cmdClearStatus())
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => onEditorChange()),

        vscode.workspace.onDidOpenTextDocument(() => onEditorChange()),

        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("fluxerPresence")) {
                onConfigChange(context);
            }
        })
    );

    onEditorChange();
}

export async function deactivate() {
    const config = vscode.workspace.getConfiguration("fluxerPresence");
    if (client && config.get<boolean>("clearOnClose")) {
        client.cancelPending();
        try {
            await client.restoreStatus();
        } catch {}
    }
}

async function tryInitClient(context: vscode.ExtensionContext) {
    const token = await context.secrets.get("fluxerPresence.token");
    const config = vscode.workspace.getConfiguration("fluxerPresence");
    const baseUrl = config.get<string>("apiBaseUrl") ?? "https://api.canary.fluxer.app/v1";
    const debounce = config.get<number>("updateIntervalMs") ?? 5000;

    if (token) {
        if (client) {
            client.updateToken(token);
            client.updateBaseUrl(baseUrl);
            client.updateDebounce(debounce);
        } else {
            client = new FluxerClient(token, baseUrl, debounce);
        }
        setStatusBar("$(pass-filled) Fluxer", "Connected - click to change token");
    } else {
        client = null
        setStatusBar("$(circle-slash) Fluxer", "No token set - click to configure");
    }
}

function onEditorChange() {
    const config = vscode.workspace.getConfiguration("fluxerPresence");
    if (!client || !config.get<boolean>("enabled")) return;

    const status = buildStatus();
    if (!status) return;

    client.scheduleUpdate(status);
}

async function onConfigChange(context: vscode.ExtensionContext) {
    await tryInitClient(context);
    onEditorChange();
}

async function cmdSetToken(context: vscode.ExtensionContext) {
    const token = await vscode.window.showInputBox({
        title: "Fluxer Presence: Enter your Fluxer token",
        prompt: "Your token is stored securely in VS Code's secret storage and never logged.",
        password: true,
        placeHolder: "Paste your Fluxer user token here...",
        validateInput: (v) => v.trim().length === 0 ? "Token cannot be empty" : undefined
    });

    if (!token) return;

    await context.secrets.store("fluxerPresence.token", token);

    vscode.window.showInformationMessage("Fluxer Presence: Token saved. Connecting...");

    await tryInitClient(context);

    const status = buildStatus();
    if (client && status) {
        try {
            await client.sendUpdate(status);
            vscode.window.showInformationMessage("Fluxer Presence: Status updated!");
        } catch (error) {
            handleApiError(error);
        }
    }
}

async function cmdClearToken(context: vscode.ExtensionContext) {
    const confirm = await vscode.window.showWarningMessage(
        "Remove your Fluxer token and disconnect Fluxer Presence?",
        { modal: true },
        "Remove"
    );

    if (confirm !== "Remove") return;

    if (client) {
        try {
            await client.clearStatus();
        } catch {}
        client = null
    }

    await context.secrets.delete("fluxerPresence.token");
    setStatusBar("$(circle-slash) Fluxer", "No token set - click to configure");
    vscode.window.showInformationMessage("Fluxer Presence: Token removed.");
}

async function cmdClearStatus() {
    if (!client) {
        vscode.window.showInformationMessage("Fluxer Presence: No token set. Use 'Set Token' first.");
        return;
    }

    try {
        await client.clearStatus();
        vscode.window.showInformationMessage("Fluxer Presence: Status cleared on Fluxer.");
    } catch (error) {
        handleApiError(error);
    }
}

function setStatusBar(text: string, tooltip: string) {
    statusBarItem.text = text;
    statusBarItem.tooltip = tooltip;
    statusBarItem.show();
}

function handleApiError(err: unknown) {
    if (err instanceof FluxerApiError) {
        if (err.statusCode === 401) {
            vscode.window
                .showErrorMessage("Fluxer Presence: Invalid or expired token (401). Re-enter your token.")
                .then((action) => {
                    if (action === "Set Token") {
                        vscode.commands.executeCommand("fluxer-presence.setToken");
                    }
                });
        } else {
            vscode.window.showErrorMessage(`Fluxer Presence: API error ${err.statusCode}: ${err.body}`);
        }
    } else {
        vscode.window.showErrorMessage(`Fluxer Presence: Unexpected error: ${String(err)}`);
    }
}
