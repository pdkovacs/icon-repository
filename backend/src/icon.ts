import { Set } from "immutable";

export interface IAddIconRequestData {
    readonly iconName: string;
    readonly format: string;
    readonly size: string;
    readonly content: Buffer;
}

export interface IAddIconFileRequestData {
    readonly iconId: number;
    readonly format: string;
    readonly size: string;
    readonly content: Buffer;
}

export interface IconFileInfo {
    readonly format: string;
    readonly size: string;
}

export class IconInfo {
    public readonly id: number;
    public readonly iconName: string;
    public readonly iconFiles: Set<IconFileInfo>;

    constructor(id: number, iconName: string, iconFiles: Set<IconFileInfo>) {
        this.id = id;
        this.iconName = iconName;
        this.iconFiles = iconFiles;
    }

    public addIconFile(iconFile: IconFileInfo): IconInfo {
        return new IconInfo(this.id, this.iconName, this.iconFiles.add(iconFile));
    }

    public removeIconFile(iconFile: IconFileInfo): IconInfo {
        return new IconInfo(this.id, this.iconName, this.iconFiles.remove(iconFile));
    }
}
