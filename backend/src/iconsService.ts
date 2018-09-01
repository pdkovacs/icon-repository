import { List } from "immutable";
import { Observable } from "rxjs/Rx";

import { IconFile, IconDescriptor, IconFileDescriptor, IconAttributes } from "./icon";
import { IconDAFs } from "./db/db";
import { GitAccessFunctions } from "./git";
import csvSplitter from "./utils/csvSplitter";

interface IconRepoConfig {
    readonly allowedFileFormats: List<string>;
    readonly allowedIconSizes: List<string>;
}

type GetIconRepoConfig = () => Observable<IconRepoConfig>;
export type DescribeAllIcons = () => Observable<List<IconDescriptor>>;
export type DescribeIcon = (iconName: string) => Observable<IconDescriptor>;
type GetIconFile = (iconName: string, fileFormat: string, iconSize: string) => Observable<Buffer>;
type CreateIcon = (
    initialIconFileInfo: IconFile,
    modifiedBy: string) => Observable<IconDescriptor>;
type UpdateIcon = (
    oldIconName: string,
    newIcon: IconAttributes,
    modifiedBy: string) => Observable<IconDescriptor>;
type DeleteIcon = (
    iconName: string,
    modifiedBy: string
) => Observable<void>;
type AddIconFile = (
    iconFile: IconFile,
    modifiedBy: string) => Observable<number>;
type UpdateIconFile = (
    iconFile: IconFile,
    modifiedBy: string) => Observable<void>;
type DeleteIconFile = (iconName: string, iconFileDesc: IconFileDescriptor, modifiedBy: string) => Observable<void>;

export interface IconService {
    readonly getRepoConfiguration: GetIconRepoConfig;
    readonly describeAllIcons: DescribeAllIcons;
    readonly describeIcon: DescribeIcon;
    readonly getIconFile: GetIconFile;
    readonly createIcon: CreateIcon;
    readonly updateIcon: UpdateIcon;
    readonly deleteIcon: DeleteIcon;
    readonly addIconFile: AddIconFile;
    readonly updateIconFile: UpdateIconFile;
    readonly deleteIconFile: DeleteIconFile;
}

export const iconFormatListParser = csvSplitter;

export const iconSizeListParser = csvSplitter;

export interface IconRepoSettings {
    readonly resetData: string;
    readonly allowedFormats: string;
    readonly allowedSizes: string;
}

const isNewRepoNeeded: (resetData: string, gitAFs: GitAccessFunctions) => Observable<boolean>
= (resetData, gitAFs) =>
    resetData === "always"
        ? Observable.of(true)
        : resetData === "init"
            ? gitAFs.isRepoInitialized().map(initialized => !initialized)
            : Observable.of(false);

const createNewRepoMaybe = (resetData: string, iconDAFs: IconDAFs, gitAFs: GitAccessFunctions) => {
    return isNewRepoNeeded(resetData, gitAFs)
    .flatMap(needed => needed
        ? iconDAFs.createSchema()
            .flatMap(gitAFs.createNewGitRepo)
        : Observable.of(undefined));
};

const iconServiceProvider: (
    iconRepoSettings: IconRepoSettings,
    iconDAFs: IconDAFs,
    gitAFs: GitAccessFunctions
) => Observable<IconService>
= (iconRepoConfig, iconDAFs, gitAFs) => {

    const getRepoConfiguration: GetIconRepoConfig = () => {
        return Observable.of({
            allowedFileFormats: iconFormatListParser(iconRepoConfig.allowedFormats),
            allowedIconSizes: iconSizeListParser(iconRepoConfig.allowedSizes)
        });
    };

    const describeAllIcons: DescribeAllIcons = () => iconDAFs.describeAllIcons();

    const describeIcon: DescribeIcon = iconName => iconDAFs.describeIcon(iconName);

    const getIconFile: GetIconFile = (iconId, fileFormat, iconSize) =>
        iconDAFs.getIconFile(iconId, fileFormat, iconSize);

    const createIcon: CreateIcon = (iconfFileInfo, modifiedBy) =>
        iconDAFs.createIcon(
            iconfFileInfo,
            modifiedBy,
            () => gitAFs.addIconFile(iconfFileInfo, modifiedBy));

    const updateIcon: UpdateIcon = (oldIconName, newIcon, modifiedBy) =>
        iconDAFs.updateIcon(
            oldIconName,
            newIcon,
            modifiedBy,
            (oldIconDescriptor: IconDescriptor) => gitAFs.updateIcon(oldIconDescriptor, newIcon, modifiedBy));

    const deleteIcon: DeleteIcon = (iconName: string, modifiedBy: string) =>
        iconDAFs.deleteIcon(
            iconName,
            modifiedBy,
            iconFileDescSet => gitAFs.deleteIcon(iconName, iconFileDescSet, modifiedBy)
        );

    const addIconFile: AddIconFile = (iconFile, modifiedBy) =>
        iconDAFs.addIconFileToIcon(
            iconFile,
            modifiedBy,
            () => gitAFs.addIconFile(iconFile, modifiedBy));

    const updateIconFile: UpdateIconFile = (iconFile, modifiedBy) =>
        iconDAFs.updateIconFile(
            iconFile,
            modifiedBy,
            () => gitAFs.updateIconFile(iconFile, modifiedBy));

    const deleteIconFile: DeleteIconFile = (iconName, iconFileDesc, modifiedBy) =>
        iconDAFs.deleteIconFile(
            iconName,
            iconFileDesc,
            modifiedBy,
            () => gitAFs.deleteIconFile(iconName, iconFileDesc, modifiedBy)
        );

    return createNewRepoMaybe(iconRepoConfig.resetData, iconDAFs, gitAFs)
    .mapTo({
        getRepoConfiguration,
        describeIcon,
        createIcon,
        updateIcon,
        deleteIcon,
        getIconFile,
        addIconFile,
        updateIconFile,
        deleteIconFile,
        describeAllIcons
    });
};

export default iconServiceProvider;
