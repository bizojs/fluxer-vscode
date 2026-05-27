# Fluxer Presence

Update your Fluxer Custom Status based on your Visual Studio Code activity.

## Features

- Automatic updates when changing files (with a delay)
- Custom emote support (Plutonium required)
- Custom template string supported with placeholders


## Enabling the Extension

To enable the plugin and get it working, you may need to run the command to set your Fluxer token:
1. Press `CTRL + SHIFT + P` to open the command picker
2. Type `Fluxer Presence: Set Token`
3. Click it and then paste your Fluxer account token in the input

> [!IMPORTANT]
> Your token is stored securely in Visual Studio Code's secrets storage. Your token is never saved elsewhere or logged.


## Status Template

The custom status string supports a custom template which offers the following values:

| Value | Description |
| ----- | ----------- |
| `{filename}` | The active file name |
| `{project}` | The workspace folder (project) containing the active file |
| `{language}` | The language of the active file |
| `{workspace}` | The name of the VS Code workspace |
| `{workspacePath}` | The absolute path to the workspace folder on disk |


## Settings

This plugin exposes settings via the settings modal (`CTRL + ,`). Once the settings modal is open, simply search "Fluxer" and you should see the settings there.

The following settings are available:

| Setting | Description | Default | Type |
| ------- | ----------- | ------- | ---- |
| `enabled` | Enable or disable Fluxer Presence | `true` | `string` |
| `apiBaseUrl` | Fluxer API base URL. | `https://api.fluxer.app/v1` | `string` |
| `statusTemplate` | Template for the status text. | `Editing {filename} in {project}` | `string` |
| `idleText` | Status text shown when no file is open. | `Idling in VS Code` | `string` |
| `emojiId` | Emoji ID to show in your status. Leave blank for no emoji. For standard Unicode emoji, use the name (e.g. 'computer'). For custom server emoji, use the numeric ID. | `""` | `string` |
| `emojiName` | Emoji name (required alongside emojiId for custom emoji, or just set this to a unicode emoji like 💻). | `""` | `string` |
| `clearOnClose` | Clear your Fluxer status when VS Code closes. | `true` | `boolean` |
| `updateIntervalMs` | Minimum milliseconds between status updates (debounce). | `5000` | `number` |

## Extension commands

This extension gives the following commands available via the command picker:

| Command | Title | Description |
| ----- | ------- | ----------- |
| `fluxer-presence.setToken` | Fluxer Presence: Set Token | Set your Fluxer account token |
| `fluxer-presence.clearToken` | Fluxer Presence: Clear Token & Disconnect | Clear your Fluxer account token |
| `fluxer-presence.enable` | Fluxer Presence: Enable | Enable the extension |
| `fluxer-presence.disable` | Fluxer Presence: Disable | Disable the extension |
| `fluxer-presence.clearStatus` | Fluxer Presence: Clear Status Now | Immediately clear your status |
