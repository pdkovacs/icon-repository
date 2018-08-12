import { Observable } from "rxjs";

export interface Credentials {
    readonly username: string;
    readonly password: string;
}

export type Authenticator = (credentials: Credentials) => Observable<boolean>;
