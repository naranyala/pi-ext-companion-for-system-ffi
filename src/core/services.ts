/**
 * =================================================================================
 * SERVICES CONTAINER
 * =================================================================================
 *
 * This container holds all the core services used across the extension.
 * It implements a Dependency Injection (DI) pattern, allowing features
 * to access shared services without managing their lifecycles.
 *
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Store } from "./store";
import { ConfigValidator } from "./validation";
import { Logger } from "./logger";
import { FloatingContext } from "./floating-context";
import { InternalBus } from "./internal-bus";
import { ShellService } from "./shell-service";
import { NotificationService } from "./notification-service";
import { SystemToolService } from "./system-tool-service";
import { GnuUtilsService } from "./gnu-utils-service";
import { FFIDetectionService } from "./ffi-detection-service";
import { WebDocService } from "./web-doc-service";
import { FileSearchService } from "./file-search-service";
import { GitService } from "./git-service";

/**
 * Interface for services that support lifecycle methods.
 */
export interface LifecycleAware {
  init?(): Promise<void>;
  dispose?(): Promise<void>;
}

/**
 * Interface defining the available services in the extension.
 */
export interface Services {
  readonly api: ExtensionAPI;
  readonly store: Store;
  readonly config: ConfigValidator;
  readonly logger: Logger;
  readonly floatingContext: FloatingContext;
  readonly bus: InternalBus;
  readonly shell: ShellService;
  readonly notify: NotificationService;
  readonly systemTool: SystemToolService;
  readonly gnu: GnuUtilsService;
  readonly ffiDetection: FFIDetectionService;
  readonly webDoc: WebDocService;
  readonly fileSearch: FileSearchService;
  readonly git: GitService;
}

/**
 * Concrete implementation of the Services container.
 */
export class ServiceContainer implements Services {
  public readonly api: ExtensionAPI;
  public readonly store: Store;
  public readonly config: ConfigValidator;
  public readonly logger: Logger;
  public readonly floatingContext: FloatingContext;
  public readonly bus: InternalBus;
  public readonly shell: ShellService;
  public readonly notify: NotificationService;
  public readonly systemTool: SystemToolService;
  public readonly gnu: GnuUtilsService;
  public readonly ffiDetection: FFIDetectionService;
  public readonly webDoc: WebDocService;
  public readonly fileSearch: FileSearchService;
  public readonly git: GitService;

  constructor(api: ExtensionAPI) {
    this.api = api;

    // Initialize services in the required order of dependency
    this.logger = new Logger();
    this.config = new ConfigValidator(api);
    this.store = new Store(api, { sessionCount: 0, todoList: [] });
    this.floatingContext = new FloatingContext();
    this.bus = new InternalBus();
    this.notify = new NotificationService();
    this.shell = new ShellService(api, this.logger);
    this.systemTool = new SystemToolService(this.shell);
    this.gnu = new GnuUtilsService(this.shell, this.systemTool);
    this.fileSearch = FileSearchService.createDefault(this.shell, this.logger);
    this.ffiDetection = new FFIDetectionService(this.shell, this.logger, this.fileSearch);
    this.webDoc = new WebDocService(api, this.logger);
    this.git = new GitService(this.shell, this.logger);
  }

  /**
   * Initialize all services that have an init method.
   */
  async init(): Promise<void> {
    for (const key of Object.keys(this) as Array<keyof this>) {
      const service = this[key];
      if (service && typeof (service as any).init === 'function') {
        await (service as any).init();
      }
    }
  }

  /**
   * Dispose all services that have a dispose method.
   */
  async dispose(): Promise<void> {
    for (const key of Object.keys(this) as Array<keyof this>) {
      const service = this[key];
      if (service && typeof (service as any).dispose === 'function') {
        await (service as any).dispose();
      }
    }
  }
}
