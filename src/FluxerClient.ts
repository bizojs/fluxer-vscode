import { version, name, author } from "../package.json";

const extensionId = `"${author.name}.${name}"`;

export interface CustomStatus {
    text: string;
    emoji_name?: string | undefined;
    emoji_id?: string | undefined;
}

interface LastSent {
    text: string;
    emoji_name?: string | undefined;
    emoji_id?: string | undefined;
}

export class FluxerClient {
    private token: string;
    private baseUrl: string;
    private lastSent: LastSent | null = null;
    private originalStatus: CustomStatus | null = null;
    private hasInitialised: boolean = false;
    private pending: NodeJS.Timeout | null = null;
    private debounceMs: number;

    constructor(token: string, baseUrl: string, debounceMs = 5000) {
        this.token = token;
        this.baseUrl = baseUrl;
        this.debounceMs = debounceMs;
    }

    async fetchCurrentStatus(): Promise<CustomStatus | null> {
        const response = await fetch(`${this.baseUrl}/users/@me/settings`, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                "User-Agent": `${extensionId}/${version}`
            }
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "(no body)");
            throw new FluxerApiError(response.status, text);
        }

        const data = await response.json() as { custom_status?: CustomStatus | null };

        return data.custom_status ?? null;
    }

    updateToken(token: string) {
        this.token = token;
        this.lastSent = null;
    }

    updateBaseUrl(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.lastSent = null;
    }

    updateDebounce(debounceMs: number) {
        this.debounceMs = debounceMs;
    }

    scheduleUpdate(status: CustomStatus) {
        if (this.pending) {
            clearTimeout(this.pending);
        }

        this.pending = setTimeout(() => {
            this.pending = null;
            this.sendUpdate(status).catch(() => {});
        }, this.debounceMs);
    }

    async sendUpdate(status: CustomStatus): Promise<boolean> {
        if (!this.hasInitialised) {
            this.originalStatus = await this.fetchCurrentStatus();
            this.hasInitialised = true;
        }

        if (this.isSameAsLast(status)) {
            return false;
        }

        await this.patch({
            custom_status: {
                text: status.text,
                ...(status.emoji_name ? { emoji_name: status.emoji_name } : {}),
                ...(status.emoji_id ? { emoji_id: status.emoji_id } : {})
            }
        });

        this.lastSent = {
            text: status.text,
            emoji_name: status.emoji_name,
            emoji_id: status.emoji_id
        };

        return true;
    }

    async restoreStatus(): Promise<void> {
        await this.patch({ custom_status: this.originalStatus ?? null });
        this.lastSent = null;
        this.hasInitialised = false;
        this.originalStatus = null;
    }

    async clearStatus(): Promise<void> {
        await this.patch({ custom_status: null });
        this.lastSent = null;
    }

    cancelPending(): void {
        if (this.pending) {
            clearTimeout(this.pending);
            this.pending = null;
        }
    }

    private isSameAsLast(status: CustomStatus): boolean {
        if (!this.lastSent) return false;
        return (
            this.lastSent.text === status.text &&
            (this.lastSent.emoji_name ?? "") === (status.emoji_name ?? "") &&
            (this.lastSent.emoji_id ?? "") === (status.emoji_id ?? "")
        );
    }

    private async patch(body: unknown): Promise<void> {
        const url = `${this.baseUrl}/users/@me/settings`;

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
                "User-Agent": `${extensionId}/${version}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "(no body)");
            throw new FluxerApiError(response.status, text);
        }
    }
}

export class FluxerApiError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly body: string
    ) {
        super(`Fluxer API error ${statusCode}: ${body}`);
        this.name = "FluxerApiError";
    }
}
