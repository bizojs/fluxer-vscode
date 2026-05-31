import * as vscode from "vscode";
import * as path from "path";
import { CustomStatus } from "./FluxerClient";
import { IDLE_EMOTE } from "./emotes";
import { getEmoteParts, getFileEmote } from "./utils";

const LANGUAGE_NAMES: Record<string, string> = {
    typescriptreact: "TSX",
    javascriptreact: "JSX",
    typescript: "TypeScript",
    javascript: "JavaScript",
    python: "Python",
    rust: "Rust",
    go: "Go",
    cpp: "C++",
    c: "C",
    csharp: "C#",
    java: "Java",
    kotlin: "Kotlin",
    swift: "Swift",
    ruby: "Ruby",
    php: "PHP",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    json: "JSON",
    yaml: "YAML",
    markdown: "Markdown",
    shellscript: "Shell",
    dockerfile: "Dockerfile",
    sql: "SQL",
    vue: "Vue",
    svelte: "Svelte",
    dart: "Dart",
    elixir: "Elixir",
    haskell: "Haskell",
    lua: "Lua",
    r: "R",
    "objective-c": "Obj-C",
    perl: "Perl",
    powershell: "PowerShell",
    plaintext: "Plain Text",
};

function getLanguageName(languageId: string): string {
    return LANGUAGE_NAMES[languageId] ?? languageId;
}

function applyTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function buildStatus(): CustomStatus | null {
    const config = vscode.workspace.getConfiguration("fluxerPresence");

    const emojiName = config.get<string>("emojiName") || undefined;
    const emojiId = config.get<string>("emojiId") || undefined;

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        const idleText = config.get<string>("idleText") ?? "Idling in VS Code"
        const idleEmote = getEmoteParts(IDLE_EMOTE);
        return {
            text: idleText,
            emoji_name: idleEmote.name,
            emoji_id: idleEmote.id
        };
    }

    const document = editor.document;
    const filename = path.basename(document.fileName);
    const language = getLanguageName(document.languageId);

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const project = workspaceFolder ? workspaceFolder.name : "No Project";
    const workspace = vscode.workspace.name ?? workspaceFolder?.name ?? "No Workspace";
    const workspacePath = workspaceFolder?.uri.fsPath ?? "";

    const template = config.get<string>("statusTemplate") ?? "Editing {filename} in {project}";

    const emote = getEmoteParts(getFileEmote(document))

    const text = applyTemplate(template, {
        filename,
        project,
        language,
        workspace,
        workspacePath
    });

    const truncated = text.length > 128 ? text.slice(0, 125) + "..." : text;

    return {
        text: truncated,
        emoji_name: emote.name || emojiName,
        emoji_id: emote.id || emojiId
    };
}
