import path from "path";
import { KNOWN_EXTENSIONS, KNOWN_LANGUAGES } from "./constants";
import { DEFAULT_EMOTE, IMAGE_EMOTES } from "./emotes";
import { TextDocument } from "vscode";

export function resolveFileIcon(document: TextDocument) {
    const filename = path.basename(document.fileName);
    const findKnownExtension = Object.keys(KNOWN_EXTENSIONS).find((key) => {
        if (filename.endsWith(key)) {
            return true;
        }

        const match = /^\/(.*)\/([gimy]+)$/.exec(key);
        if (!match) {
            return false;
        }

        const regex = new RegExp(match[1] as string, match[2] as string);
        return regex.test(filename);
    });
    const findKnownLanguage = KNOWN_LANGUAGES.find((key) => key.language === document.languageId);
    const fileIcon = findKnownExtension
        ? KNOWN_EXTENSIONS[findKnownExtension]
        : findKnownLanguage
            ? findKnownLanguage.image
            : null;

    return typeof fileIcon === "string" ? fileIcon : (fileIcon?.image ?? "text");
}

export function getFileEmote(document: TextDocument): string {
  const imageKey = resolveFileIcon(document);
  return IMAGE_EMOTES[imageKey] ?? DEFAULT_EMOTE;
}

export function getEmoteParts(emote: string): { name: string; id: string } {
    const parts = emote.split(":");
    if (!parts[0] || !parts[1]) return { name: "", id: "" };
    return {
        name: parts[0],
        id: parts[1],
    };
}
