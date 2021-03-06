export type RowType = { [key: string]: any; };

//  Fields  ==============================================================
export type Number64 = string;
export type Range = [number | string, number | string];
export type Dataset = any[];
export type IFieldType = "boolean" | "number" | "number64" | "string" | "range" | "dataset" | "set" | "object";

export interface IFieldBoolean {
    type: "boolean";
    id: string;
    default?: boolean;
}

export interface IFieldNumber {
    type: "number";
    id: string;
    default?: number;
}

export interface IFieldNumber64 {
    type: "number64";
    id: string;
    default?: Number64;
}

export interface IFieldString {
    type: "string";
    id: string;
    default?: string;
}

export interface IFieldRange {
    type: "range";
    id: string;
    default?: Range;
}

export interface IFieldDataset {
    type: "dataset";
    id: string;
    default?: Dataset;
    children: IField[];
}

export interface IFieldSet {
    type: "set";
    id: string;
    default?: Array<string | number>;
    fieldType: "string" | "number";
}

export interface IFieldObject {
    type: "object";
    id: string;
    default?: object;
    fields: { [key: string]: IField };
}

export type IField = IFieldBoolean | IFieldNumber | IFieldNumber64 | IFieldString | IFieldRange | IFieldDataset | IFieldSet | IFieldObject;

//  Datasources  ==============================================================
export type IDatasourceType = "wuresult" | "logicalfile" | "roxie" | "hipie" | "rest" | "form" | "databomb";
export type DatasourceType = IWUResult | ILogicalFile | IRoxieService | IHipieService | IRestService | IForm | IDatabomb;

export interface IDatasource {
    type: IDatasourceType;
    id: string;
}

export interface IService extends IDatasource {
    url: string;
}

export interface IOutput {
    fields: IField[];
}

export type OutputDict = { [key: string]: IOutput };

export interface IWUResult extends IService {
    type: "wuresult";
    wuid: string;
    outputs: OutputDict;
}

export interface ILogicalFile extends IService {
    type: "logicalfile";
    logicalFile: string;
    fields: IField[];
}

export interface IRoxieService extends IService {
    type: "roxie";
    querySet: string;
    queryID: string;
    inputs: IField[];
    outputs: OutputDict;
}

export interface IHipieService extends IService {
    type: "hipie";
    querySet: string;
    queryID: string;
    inputs: IField[];
    outputs: OutputDict;
}

export interface IRestService extends IService {
    type: "rest";
    action: string;
    mode?: "get" | "post";
    inputs: IField[];
    outputs: OutputDict;
}

export interface IForm extends IDatasource {
    type: "form";
    fields: IField[];
}

export type IDatabombFormat = "csv" | "tsv" | "json";
export interface IDatabomb extends IDatasource {
    type: "databomb";
    fields: IField[];
    format: IDatabombFormat;
    payload?: string;
}

//  IDatasorceRef  ---
export interface IDatasourceBaseRef {
    id: string;
}

export interface IDatabombRef extends IDatasourceBaseRef {
}

export interface IWUResultRef extends IDatasourceBaseRef {
    output: string;
}

export interface IRestResultRef extends IDatasourceBaseRef {
    responseField: string;
}

export interface IHipieSqlRef extends IDatasourceBaseRef {
}

export interface IRequestField {
    localFieldID: string;
    source: string;
    remoteFieldID: string;
    value: string;
}

export interface IRoxieServiceRef extends IDatasourceBaseRef {
    request: IRequestField[];
    output: string;
}

export type IDatasourceRef = IDatabombRef | IWUResultRef | IRoxieServiceRef | IHipieSqlRef;

export function isDatabombRef(ref: IDatasourceRef): ref is IDatabombRef {
    return !isWUResultRef(ref) && !isRoxieServiceRef(ref);
}

export function isWUResultRef(ref: IDatasourceRef): ref is IWUResultRef {
    return (ref as IWUResultRef).output !== undefined && !isRoxieServiceRef(ref);
}

export function isRoxieServiceRef(ref: IDatasourceRef): ref is IRoxieServiceRef {
    return (ref as IRoxieServiceRef).request !== undefined;
}

//  Activities  ===============================================================
export type IActivityType = "filter" | "project" | "groupby" | "sort" | "limit" | "mappings";
export type ActivityType = IFilter | IProject | IGroupBy | ISort | ILimit | IMappings;

export interface IActivity {
    type: IActivityType;
}

//  Filter  ===================================================================
export type IMappingConditionType = "==" | "!=" | ">" | ">=" | "<" | "<=" | "range" | "in";
export interface IMapping {
    remoteFieldID: string;
    localFieldID: string;
    condition: IMappingConditionType;
    nullable: boolean;
}

export interface IFilterCondition {
    viewID: string;
    mappings: IMapping[];
}

export interface IFilterStaticCondition {
    localFieldID: string;
    condition: IMappingConditionType;
    value: string | number;
}

export type FilterCondition = IFilterCondition | IFilterStaticCondition;
export function isIFilterCondition(fc: FilterCondition): fc is IFilterCondition {
    return !!(fc as IFilterCondition).viewID;
}

export interface IFilter extends IActivity {
    type: "filter";
    conditions: FilterCondition[];
}
export function isFilterActivity(activity: IActivity): activity is IFilter {
    return activity.type === "filter";
}

//  Project  ==================================================================
export interface IEquals {
    fieldID: string;
    type: "=";
    sourceFieldID: string;
    transformations?: MultiTransformationType[];
}
export type ICalculatedType = "+" | "-" | "*" | "/";
export interface ICalculated {
    fieldID: string;
    type: ICalculatedType;
    sourceFieldID1: string;
    sourceFieldID2: string;
}

export interface IScale {
    fieldID: string;
    type: "scale";
    sourceFieldID: string;
    factor: number;
}

export interface ITemplate {
    fieldID: string;
    type: "template";
    template: string;
}

export interface IMapMapping {
    value: any;
    newValue: any;
}

export interface IMap {
    fieldID: string;
    type: "map";
    sourceFieldID: string;
    default: any;
    mappings: IMapMapping[];
}

export type MultiTransformationType = IEquals | ICalculated | IScale | ITemplate | IMap;
export interface IMulti {
    fieldID: string;
    type: "multi";
    transformations: MultiTransformationType[];
}

export type ProjectTransformationType = MultiTransformationType | IMulti;
export interface IProject extends IActivity {
    type: "project";
    transformations: ProjectTransformationType[];
}
export function isProjectActivity(activity: IActivity): activity is IProject {
    return activity.type === "project";
}
export interface IMappings extends IActivity {
    type: "mappings";
    transformations: ProjectTransformationType[];
}
export function isMappingsActivity(activity: IActivity): activity is IMappings {
    return activity.type === "mappings";
}
//  GroupBy  ==================================================================
export type IAggregateType = "min" | "max" | "sum" | "mean" | "variance" | "deviation";
export interface IAggregate {
    fieldID: string;
    type: IAggregateType;
    inFieldID: string;
    baseCountFieldID?: string;
}

export interface ICount {
    fieldID: string;
    type: "count";
}

export type AggregateType = IAggregate | ICount;

export interface IGroupBy extends IActivity {
    type: "groupby";
    groupByIDs: string[];
    aggregates: AggregateType[];
}
export function isGroupByActivity(activity: IActivity): activity is IGroupBy {
    return activity.type === "groupby";
}

//  Sort  =====================================================================
export interface ISortCondition {
    fieldID: string;
    descending: boolean;
}

export interface ISort extends IActivity {
    type: "sort";
    conditions: ISortCondition[];
}
export function isSortActivity(activity: IActivity): activity is ISort {
    return activity.type === "sort";
}

//  Limit  ====================================================================
export interface ILimit extends IActivity {
    type: "limit";
    limit: number;
}
export function isLimitActivity(activity: IActivity): activity is ILimit {
    return activity.type === "limit";
}

//  Visualization  ============================================================
export interface IWidgetProperties {
    __class: string;
    [propID: string]: string | string[] | number | boolean | undefined | IWidgetProperties | IWidgetProperties[];
}

export interface IWidget {
    id: string;
    chartType: string;
    __class: string;
    properties: IWidgetProperties;
}

export type VisibilityType = "normal" | "flyout";
export const VisibilitySet: VisibilityType[] = ["normal", "flyout"];

export interface IVisualization extends IWidget {
    title: string;
    description?: string;
    visibility: VisibilityType;
    mappings: IMappings;
    secondaryDataviewID?: string;
}

//  View  =====================================================================
export interface IView {
    id: string;
    datasource: IDatasourceRef;
    activities: ActivityType[];
    visualization: IVisualization;
}

//  DDL  ======================================================================
export interface IProperties {
    [propID: string]: any;
}

export interface Schema {
    version: "2.2.1";
    createdBy: {
        name: string;
        version: string;
    };
    datasources: DatasourceType[];
    dataviews: IView[];
    properties?: IProperties;
    hipieProperties?: IProperties;

    //  The following defs are only provided to assist the Java code generation (from the the generated schema)  ---
    defs?: {
        fieldTypes: {
            number64: Number64;
            range: Range;
            dataset: Dataset;
            fieldType: IFieldType;
            fieldBoolean: IFieldBoolean;
            fieldNumber: IFieldNumber;
            fieldNumber64: IFieldNumber64
            fieldString: IFieldString;
            fieldRange: IFieldRange;
            fieldDataset: IFieldDataset;
            fieldSet: IFieldSet;
            fieldObject: IFieldObject;
            field: IField;
        };
        datasourceTypes: {
            datasource: IDatasource;
            logicalFile: ILogicalFile;
            form: IForm;
            databomb: IDatabomb;
            wuresult: IWUResult;
            hipieService: IHipieService;
            roxieService: IRoxieService;
        };
        datasourceRefTypes: {
            wuResultRef: IWUResultRef;
            roxieServiceRef: IRoxieServiceRef;
        };
        activityTypes: {
            filter: IFilter;
            project: IProject;
            groupby: IGroupBy;
            sort: ISort;
            limit: ILimit;
            mappings: IMappings;
        };
        aggregateTypes: {
            aggregate: IAggregate;
            count: ICount;
        };
        transformationTypes: {
            equals: IEquals;
            calculated: ICalculated;
            scale: IScale;
            template: ITemplate;
            map: IMap;
            multi: IMulti;
        };
    };
}
