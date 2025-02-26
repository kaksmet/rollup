import * as ESTree from 'estree';
import { EventEmitter } from 'events';

export const VERSION: string;

export interface RollupError extends RollupLogProps {
	stack?: string;
}

export interface RollupWarning extends RollupLogProps {
	exporter?: string;
	exportName?: string;
	guess?: string;
	importer?: string;
	missing?: string;
	modules?: string[];
	names?: string[];
	reexporter?: string;
	source?: string;
	sources?: string[];
}

export interface RollupLogProps {
	code?: string;
	frame?: string;
	hook?: string;
	id?: string;
	loc?: {
		column: number;
		file?: string;
		line: number;
	};
	message: string;
	name?: string;
	plugin?: string;
	pluginCode?: string;
	pos?: number;
	url?: string;
}

export interface ExistingRawSourceMap {
	file?: string;
	mappings: string;
	names: string[];
	sourceRoot?: string;
	sources: string[];
	sourcesContent?: string[];
	version: number;
}

export type RawSourceMap = { mappings: '' } | ExistingRawSourceMap;

export interface SourceMap {
	file: string;
	mappings: string;
	names: string[];
	sources: string[];
	sourcesContent: string[];
	version: string;
	toString(): string;
	toUrl(): string;
}

export interface SourceDescription {
	ast?: ESTree.Program;
	code: string;
	map?: string | RawSourceMap;
	moduleSideEffects?: boolean | null;
}

export interface TransformSourceDescription extends SourceDescription {
	dependencies?: string[];
}

export interface TransformModuleJSON {
	ast: ESTree.Program;
	code: string;
	// note if plugins use new this.cache to opt-out auto transform cache
	customTransformCache: boolean;
	moduleSideEffects: boolean | null;
	originalCode: string;
	originalSourcemap: RawSourceMap | null;
	resolvedIds?: ResolvedIdMap;
	sourcemapChain: (RawSourceMap | { missing: true; plugin: string })[];
	transformDependencies: string[] | null;
}

export interface ModuleJSON extends TransformModuleJSON {
	dependencies: string[];
	id: string;
	transformAssets: Asset[] | undefined;
	transformChunks: EmittedChunk[] | undefined;
}

export interface EmittedChunk {
	id: string;
	options: { name?: string } | undefined;
}

export interface Asset {
	fileName: string;
	name: string;
	source: string | Buffer;
}

export interface PluginCache {
	delete(id: string): boolean;
	get<T = any>(id: string): T;
	has(id: string): boolean;
	set<T = any>(id: string, value: T): void;
}

export interface MinimalPluginContext {
	meta: PluginContextMeta;
}

export type EmitAsset = (name: string, source?: string | Buffer) => string;
export type EmitChunk = (name: string, options?: { name?: string }) => string;

export interface PluginContext extends MinimalPluginContext {
	addWatchFile: (id: string) => void;
	cache: PluginCache;
	emitAsset: EmitAsset;
	emitChunk: EmitChunk;
	error: (err: RollupError | string, pos?: { column: number; line: number }) => never;
	getAssetFileName: (assetReferenceId: string) => string;
	getChunkFileName: (chunkReferenceId: string) => string;
	getModuleInfo: (
		moduleId: string
	) => {
		hasModuleSideEffects: boolean;
		id: string;
		importedIds: string[];
		isEntry: boolean;
		isExternal: boolean;
	};
	/** @deprecated Use `this.resolve` instead */
	isExternal: IsExternal;
	moduleIds: IterableIterator<string>;
	parse: (input: string, options: any) => ESTree.Program;
	resolve: (
		source: string,
		importer: string,
		options?: { skipSelf: boolean }
	) => Promise<ResolvedId | null>;
	/** @deprecated Use `this.resolve` instead */
	resolveId: (source: string, importer: string) => Promise<string | null>;
	setAssetSource: (assetReferenceId: string, source: string | Buffer) => void;
	warn: (warning: RollupWarning | string, pos?: { column: number; line: number }) => void;
	/** @deprecated Use `this.addWatchFile` and the `watchChange` hook instead  */
	watcher: EventEmitter;
}

export interface PluginContextMeta {
	rollupVersion: string;
}

export interface ResolvedId {
	external: boolean;
	id: string;
	moduleSideEffects: boolean;
}

export interface ResolvedIdMap {
	[key: string]: ResolvedId;
}

interface PartialResolvedId {
	external?: boolean;
	id: string;
	moduleSideEffects?: boolean | null;
}

export type ResolveIdResult = string | false | null | undefined | PartialResolvedId;

export type ResolveIdHook = (
	this: PluginContext,
	source: string,
	importer: string | undefined
) => Promise<ResolveIdResult> | ResolveIdResult;

export type IsExternal = (
	source: string,
	importer: string,
	isResolved: boolean
) => boolean | null | undefined;

export type IsPureModule = (id: string) => boolean | null | undefined;

export type HasModuleSideEffects = (id: string, external: boolean) => boolean;

export type LoadHook = (
	this: PluginContext,
	id: string
) => Promise<SourceDescription | string | null> | SourceDescription | string | null;

export type TransformResult = string | null | undefined | TransformSourceDescription;

export type TransformHook = (
	this: PluginContext,
	code: string,
	id: string
) => Promise<TransformResult> | TransformResult;

export type TransformChunkHook = (
	this: PluginContext,
	code: string,
	options: OutputOptions
) =>
	| Promise<{ code: string; map: RawSourceMap } | null | undefined>
	| { code: string; map: RawSourceMap }
	| null
	| undefined;

export type RenderChunkHook = (
	this: PluginContext,
	code: string,
	chunk: RenderedChunk,
	options: OutputOptions
) =>
	| Promise<{ code: string; map: RawSourceMap } | null>
	| { code: string; map: RawSourceMap }
	| string
	| null;

export type ResolveDynamicImportHook = (
	this: PluginContext,
	specifier: string | ESTree.Node,
	importer: string
) => Promise<ResolveIdResult> | ResolveIdResult;

export type ResolveImportMetaHook = (
	this: PluginContext,
	prop: string | null,
	options: { chunkId: string; format: string; moduleId: string }
) => string | null | undefined;

export type ResolveAssetUrlHook = (
	this: PluginContext,
	options: {
		assetFileName: string;
		chunkId: string;
		format: string;
		moduleId: string;
		relativeAssetPath: string;
	}
) => string | null | undefined;

export type ResolveFileUrlHook = (
	this: PluginContext,
	options: {
		assetReferenceId: string | null;
		chunkId: string;
		chunkReferenceId: string | null;
		fileName: string;
		format: string;
		moduleId: string;
		relativePath: string;
	}
) => string | null | undefined;

export type AddonHook = string | ((this: PluginContext) => string | Promise<string>);

/**
 * use this type for plugin annotation
 * @example
 * ```ts
 * interface Options {
 * ...
 * }
 * const myPlugin: PluginImpl<Options> = (options = {}) => { ... }
 * ```
 */
export type PluginImpl<O extends object = object> = (options?: O) => Plugin;

export interface OutputBundle {
	[fileName: string]: OutputAsset | OutputChunk;
}

interface OnGenerateOptions extends OutputOptions {
	bundle: OutputChunk;
}

interface OnWriteOptions extends OutputOptions {
	bundle: RollupBuild;
}

export interface PluginHooks {
	buildEnd: (this: PluginContext, err?: Error) => Promise<void> | void;
	buildStart: (this: PluginContext, options: InputOptions) => Promise<void> | void;
	generateBundle: (
		this: PluginContext,
		options: OutputOptions,
		bundle: OutputBundle,
		isWrite: boolean
	) => void | Promise<void>;
	load: LoadHook;
	/** @deprecated Use `generateBundle` instead */
	ongenerate: (
		this: PluginContext,
		options: OnGenerateOptions,
		chunk: OutputChunk
	) => void | Promise<void>;
	/** @deprecated Use `writeBundle` instead */
	onwrite: (
		this: PluginContext,
		options: OnWriteOptions,
		chunk: OutputChunk
	) => void | Promise<void>;
	options: (this: MinimalPluginContext, options: InputOptions) => InputOptions | null | undefined;
	outputOptions: (this: PluginContext, options: OutputOptions) => OutputOptions | null | undefined;
	renderChunk: RenderChunkHook;
	renderError: (this: PluginContext, err?: Error) => Promise<void> | void;
	renderStart: (this: PluginContext) => Promise<void> | void;
	/** @deprecated Use `resolveFileUrl` instead */
	resolveAssetUrl: ResolveAssetUrlHook;
	resolveDynamicImport: ResolveDynamicImportHook;
	resolveFileUrl: ResolveFileUrlHook;
	resolveId: ResolveIdHook;
	resolveImportMeta: ResolveImportMetaHook;
	transform: TransformHook;
	/** @deprecated Use `renderChunk` instead */
	transformBundle: TransformChunkHook;
	/** @deprecated Use `renderChunk` instead */
	transformChunk: TransformChunkHook;
	watchChange: (id: string) => void;
	writeBundle: (this: PluginContext, bundle: OutputBundle) => void | Promise<void>;
}

export interface Plugin extends Partial<PluginHooks> {
	banner?: AddonHook;
	cacheKey?: string;
	footer?: AddonHook;
	intro?: AddonHook;
	name: string;
	outro?: AddonHook;
}

export interface TreeshakingOptions {
	annotations?: boolean;
	moduleSideEffects?: ModuleSideEffectsOption;
	propertyReadSideEffects?: boolean;
	/** @deprecated Use `moduleSideEffects` instead */
	pureExternalModules?: PureModulesOption;
	tryCatchDeoptimization?: boolean;
}

export type GetManualChunk = (id: string) => string | null | undefined;

export type ExternalOption = string[] | IsExternal;
export type PureModulesOption = boolean | string[] | IsPureModule;
export type GlobalsOption = { [name: string]: string } | ((name: string) => string);
export type InputOption = string | string[] | { [entryAlias: string]: string };
export type ManualChunksOption = { [chunkAlias: string]: string[] } | GetManualChunk;
export type ModuleSideEffectsOption = boolean | 'no-external' | string[] | HasModuleSideEffects;

export interface InputOptions {
	acorn?: any;
	acornInjectPlugins?: Function[];
	cache?: false | RollupCache;
	chunkGroupingSize?: number;
	context?: string;
	experimentalCacheExpiry?: number;
	experimentalOptimizeChunks?: boolean;
	experimentalTopLevelAwait?: boolean;
	external?: ExternalOption;
	inlineDynamicImports?: boolean;
	input?: InputOption;
	manualChunks?: ManualChunksOption;
	moduleContext?: ((id: string) => string) | { [id: string]: string };
	onwarn?: WarningHandlerWithDefault;
	perf?: boolean;
	plugins?: Plugin[];
	preserveModules?: boolean;
	preserveSymlinks?: boolean;
	shimMissingExports?: boolean;
	strictDeprecations?: boolean;
	treeshake?: boolean | TreeshakingOptions;
	watch?: WatcherOptions;
}

export type ModuleFormat =
	| 'amd'
	| 'cjs'
	| 'commonjs'
	| 'es'
	| 'esm'
	| 'iife'
	| 'module'
	| 'system'
	| 'umd';

export type OptionsPaths = Record<string, string> | ((id: string) => string);

export interface OutputOptions {
	amd?: {
		define?: string;
		id?: string;
	};
	assetFileNames?: string;
	banner?: string | (() => string | Promise<string>);
	chunkFileNames?: string;
	compact?: boolean;
	// only required for bundle.write
	dir?: string;
	dynamicImportFunction?: string;
	entryFileNames?: string;
	esModule?: boolean;
	exports?: 'default' | 'named' | 'none' | 'auto';
	extend?: boolean;
	// only required for bundle.write
	file?: string;
	footer?: string | (() => string | Promise<string>);
	// this is optional at the base-level of RollupWatchOptions,
	// which extends from this interface through config merge
	format?: ModuleFormat;
	freeze?: boolean;
	globals?: GlobalsOption;
	importMetaUrl?: (chunkId: string, moduleId: string) => string;
	indent?: boolean;
	interop?: boolean;
	intro?: string | (() => string | Promise<string>);
	name?: string;
	namespaceToStringTag?: boolean;
	noConflict?: boolean;
	outro?: string | (() => string | Promise<string>);
	paths?: OptionsPaths;
	preferConst?: boolean;
	sourcemap?: boolean | 'inline';
	sourcemapExcludeSources?: boolean;
	sourcemapFile?: string;
	sourcemapPathTransform?: (sourcePath: string) => string;
	strict?: boolean;
}

export type WarningHandlerWithDefault = (
	warning: string | RollupWarning,
	defaultHandler: WarningHandler
) => void;
export type WarningHandler = (warning: string | RollupWarning) => void;

export interface SerializedTimings {
	[label: string]: [number, number, number];
}

export interface OutputAsset {
	code?: undefined;
	fileName: string;
	isAsset: true;
	source: string | Buffer;
}

export interface RenderedModule {
	originalLength: number;
	removedExports: string[];
	renderedExports: string[];
	renderedLength: number;
}

export interface RenderedChunk {
	dynamicImports: string[];
	exports: string[];
	facadeModuleId: string | null;
	fileName: string;
	imports: string[];
	isDynamicEntry: boolean;
	isEntry: boolean;
	modules: {
		[id: string]: RenderedModule;
	};
	name: string;
}

export interface OutputChunk extends RenderedChunk {
	code: string;
	map?: SourceMap;
}

export interface SerializablePluginCache {
	[key: string]: [number, any];
}

export interface RollupCache {
	modules?: ModuleJSON[];
	plugins?: Record<string, SerializablePluginCache>;
}

export interface RollupOutput {
	output: [OutputChunk, ...(OutputChunk | OutputAsset)[]];
}

export interface RollupBuild {
	cache: RollupCache;
	generate: (outputOptions: OutputOptions) => Promise<RollupOutput>;
	getTimings?: () => SerializedTimings;
	watchFiles: string[];
	write: (options: OutputOptions) => Promise<RollupOutput>;
}

export interface RollupOptions extends InputOptions {
	output?: OutputOptions;
}

export function rollup(options: RollupOptions): Promise<RollupBuild>;
// chokidar watch options
export interface WatchOptions {
	alwaysStat?: boolean;
	atomic?: boolean | number;
	awaitWriteFinish?:
		| {
				pollInterval?: number;
				stabilityThreshold?: number;
		  }
		| boolean;
	binaryInterval?: number;
	cwd?: string;
	depth?: number;
	disableGlobbing?: boolean;
	followSymlinks?: boolean;
	ignored?: any;
	ignoreInitial?: boolean;
	ignorePermissionErrors?: boolean;
	interval?: number;
	persistent?: boolean;
	useFsEvents?: boolean;
	usePolling?: boolean;
}

export interface WatcherOptions {
	chokidar?: boolean | WatchOptions;
	clearScreen?: boolean;
	exclude?: string[];
	include?: string[];
}

export interface RollupWatchOptions extends InputOptions {
	output?: OutputOptions | OutputOptions[];
	watch?: WatcherOptions;
}

export interface RollupWatcher extends EventEmitter {
	close(): void;
}

export function watch(configs: RollupWatchOptions[]): RollupWatcher;
