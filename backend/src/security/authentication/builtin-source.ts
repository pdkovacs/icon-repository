import { Observable } from "rxjs";
import { List } from "immutable";
import { Credentials, Authenticator } from "./common";
import { readTextFile } from "../../utils/rx";
import { listenerCount } from "cluster";

const builtinCredentials = List([
    {
        username: "ux",
        password: "ux"
    },
    {
        username: "dev",
        password: "dev"
    }
]);

const readCredentialsFile: (pathToFile: string) => Observable<List<Credentials>>
= pathToFile =>
    readTextFile(pathToFile)
    .map(content => List(JSON.parse(content)));

const isEqual: (creds1: Credentials, creds2: Credentials) => boolean
= (creds1, creds2) => creds1.username === creds2.username && creds1.password === creds2.password;

const contains: (list: List<Credentials>, currentCredentials: Credentials) => boolean
= (list, currentCredentials) => !!list.find(creds => isEqual(creds, currentCredentials));

const builtInAuthenticationDataSource: (pathToCredentialsFile: string) => Authenticator
= pathToCredentialsFile =>
        currentCredentials =>
            pathToCredentialsFile
            ? readCredentialsFile(pathToCredentialsFile)
                .map(configedCredentials => contains(configedCredentials, currentCredentials))
            : Observable.of(contains(builtinCredentials, currentCredentials));

export default builtInAuthenticationDataSource;
