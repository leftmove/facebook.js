import { Login } from "./login";
import { GraphError, UnauthorizedError, CredentialError } from "../errors";

export class Uids {
    constructor(protected facebook: Login) {}

    async get(userId?: string): Promise<string[]> {
        if (userId === undefined) {
            throw new CredentialError("User ID is required.");
        }

        try {
            const data = await this.facebook.client.get(`${userId}/accounts`, {
                access_token: this.facebook.access.user.token,
            });

            return data.data.map((user: any) => user.id);
        } catch (error) {
            throw new UnauthorizedError("Error getting user IDs.", error);
        }
    }

    async validate(userId?: string): Promise<boolean> {
        if (userId === undefined) {
            throw new CredentialError("User ID is required.");
        }

        try {
            const data = await this.facebook.client.get(`${userId}`, {
                access_token: this.facebook.access.user.token,
            });

            return data.id === userId;
        } catch (error) {
            throw new UnauthorizedError("Error validating user ID.", error);
        }
    }
} 