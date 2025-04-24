import { Login } from "./login";
import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export class Pids {
    constructor(protected facebook: Login) {}

    async get(pageId?: string): Promise<string[]> {
        if (pageId === undefined) {
            throw new CredentialError("Page ID is required.");
        }

        try {
            const data = await this.facebook.client.get(`${pageId}/accounts`, {
                access_token: this.facebook.access.user.token,
            });

            return data.data.map((page: any) => page.id);
        } catch (error) {
            throw new UnauthorizedError("Error getting page IDs.", error);
        }
    }

    async validate(pageId?: string): Promise<boolean> {
        if (pageId === undefined) {
            throw new CredentialError("Page ID is required.");
        }

        try {
            const data = await this.facebook.client.get(`${pageId}`, {
                access_token: this.facebook.access.user.token,
            });

            return data.id === pageId;
        } catch (error) {
            throw new UnauthorizedError("Error validating page ID.", error);
        }
    }
} 