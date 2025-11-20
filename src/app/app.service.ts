import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { BeyondtrustInstancesService } from "./views/dashboard/components/beyondtrust-instaces/beyondtrust-instances.service";
import { BeyondtrustInstance } from "./views/dashboard/components/beyondtrust-instaces/models";

@Injectable({ providedIn: "root" })
export class AppService {
    private static readonly DEFAULT_INSTANCE_ID = 1;

    private readonly instancesSubject = new BehaviorSubject<
        BeyondtrustInstance[]
    >([]);
    private readonly selectedInstanceIdSubject = new BehaviorSubject<
        number | null
    >(null);
    private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;

    /**
     * Observable stream of all BeyondTrust instances.
     * Subscribe to this in components for reactive updates when instances change.
     * Automatically triggers initialization if not yet initialized.
     *
     * @example
     * ```typescript
     * // In a component
     * ngOnInit() {
     *   this.appService.instances$.subscribe(instances => {
     *     this.dataSource.data = instances;
     *   });
     * }
     * ```
     */
    public readonly instances$: Observable<BeyondtrustInstance[]> =
        this.instancesSubject.asObservable();

    /**
     * Observable stream of the currently selected instance ID.
     * Subscribe to this in components that need to react to selection changes.
     *
     * @example
     * ```typescript
     * // In a component with instance-dependent data
     * ngOnInit() {
     *   this.appService.selectedInstanceId$.subscribe(instanceId => {
     *     if (instanceId) {
     *       this.loadDataForInstance(instanceId);
     *     }
     *   });
     * }
     * ```
     */
    public readonly selectedInstanceId$: Observable<number | null> =
        this.selectedInstanceIdSubject.asObservable();

    /**
     * Observable stream of loading state during initialization.
     * Subscribe to this if you need to show loading indicators during app startup.
     * Note: Individual components should manage their own loading state for CRUD operations.
     *
     * @example
     * ```typescript
     * // In AdminLayoutComponent
     * ngOnInit() {
     *   this.appService.isLoading$.subscribe(loading => {
     *     this.showSpinner = loading;
     *   });
     * }
     * ```
     */
    public readonly isLoading$: Observable<boolean> =
        this.isLoadingSubject.asObservable();

    constructor(
        private readonly beyondtrustInstancesService: BeyondtrustInstancesService
    ) {}

    /**
     * Initializes the BeyondTrust instance state on first access.
     * Loads all instances from API and selects default instance (ID 1 or first available).
     * Safe to call multiple times - subsequent calls return the same promise.
     *
     * **Called by:** Components that need instance data (automatic via ensureInitialized)
     *
     * @example
     * ```typescript
     * // In a component
     * async ngOnInit() {
     *   await this.appService.initialize(); // Safe to call multiple times
     *   const instanceId = this.appService.getSelectedInstanceId();
     * }
     * ```
     */
    public async initialize(): Promise<void> {
        // If already initialized, return immediately
        if (this.isInitialized) {
            return;
        }

        // If initialization is in progress, return the existing promise
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // Start new initialization
        this.initializationPromise = this.performInitialization();
        return this.initializationPromise;
    }

    private async performInitialization(): Promise<void> {
        try {
            this.isLoadingSubject.next(true);
            await this.loadInstances();

            const instances = this.instancesSubject.value;
            this.resetToDefaultInstance(instances);

            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize BeyondTrust instances:", error);
            // Reset so it can be retried
            this.initializationPromise = null;
        } finally {
            this.isLoadingSubject.next(false);
        }
    }

    /**
     * Reloads instances from API and updates the state.
     * Use this after CRUD operations or when you need fresh data.
     *
     * @example
     * ```typescript
     * // After creating/updating/deleting an instance
     * await this.appService.refreshInstances();
     * ```
     */
    public async refreshInstances(): Promise<void> {
        try {
            this.isLoadingSubject.next(true);
            const instances = await this.beyondtrustInstancesService.fetchAll();
            this.instancesSubject.next(instances || []);

            // Re-validate selected instance still exists
            const selectedId = this.selectedInstanceIdSubject.value;
            if (selectedId && !instances.some((i) => i.id === selectedId)) {
                this.resetToDefaultInstance(instances);
            }
        } catch (error) {
            console.error("Failed to refresh BeyondTrust instances:", error);
            throw error;
        } finally {
            this.isLoadingSubject.next(false);
        }
    }

    /**
     * @deprecated Use refreshInstances() instead. This method will be removed in a future version.
     */
    public setInstances(instances: BeyondtrustInstance[]): void {
        console.warn(
            "setInstances() is deprecated. Use refreshInstances() instead."
        );
        this.instancesSubject.next(instances);

        // Re-validate selected instance still exists
        const selectedId = this.selectedInstanceIdSubject.value;
        if (selectedId && !instances.some((i) => i.id === selectedId)) {
            this.resetToDefaultInstance(instances);
        }
    }

    /**
     * Loads instances from API and updates internal state.
     * Used internally during initialization. Components should use setInstances() instead.
     * @private
     */
    private async loadInstances(): Promise<void> {
        try {
            const instances = await this.beyondtrustInstancesService.fetchAll();
            this.instancesSubject.next(instances || []);
        } catch (error) {
            console.error("Failed to load BeyondTrust instances:", error);
            this.instancesSubject.next([]);
            throw error;
        }
    }

    /**
     * Resets selected instance to default (ID 1 or first available).
     * Used internally when selected instance becomes invalid.
     * @private
     */
    private resetToDefaultInstance(instances: BeyondtrustInstance[]): void {
        if (instances && instances.length > 0) {
            const defaultInstance =
                instances.find(
                    (i) => i.id === AppService.DEFAULT_INSTANCE_ID
                ) || instances[0];
            this.selectedInstanceIdSubject.next(defaultInstance.id);
        } else {
            this.selectedInstanceIdSubject.next(null);
        }
    }

    /**
     * Sets the currently selected BeyondTrust instance by ID.
     * Validates that the instance exists before updating. Selection is not persisted.
     *
     * **Called by:** Components when user changes instance selection (e.g., mat-select)
     *
     * @param instanceId - The ID of the instance to select
     *
     * @example
     * ```typescript
     * // In a component with instance selector
     * onInstanceChange(instanceId: number) {
     *   this.appService.setSelectedInstanceId(instanceId);
     * }
     * ```
     */
    public setSelectedInstanceId(instanceId: number): void {
        const instances = this.instancesSubject.value;
        const instanceExists = instances.some((i) => i.id === instanceId);

        if (!instanceExists) {
            console.warn(`Instance with ID ${instanceId} not found`);
            return;
        }

        this.selectedInstanceIdSubject.next(instanceId);
    }

    /**
     * Gets the currently selected BeyondTrust instance ID (synchronous).
     * Returns null if no instance is selected.
     *
     * **Use this when:** Making PRA API calls that require instance context
     *
     * @returns The selected instance ID or null
     *
     * @example
     * ```typescript
     * // In a service making PRA API calls
     * async fetchSites(): Promise<Site[]> {
     *   const instanceId = this.appService.getSelectedInstanceId();
     *   return this.http.get<Site[]>(`sites?instanceId=${instanceId}`);
     * }
     * ```
     */
    public getSelectedInstanceId(): number | null {
        return this.selectedInstanceIdSubject.value;
    }

    /**
     * Gets the currently selected BeyondTrust instance object (synchronous).
     * Returns null if no instance is selected.
     *
     * **Use this when:** You need the full instance object (e.g., apiBaseUrl, credentials)
     *
     * @returns The selected instance object or null
     *
     * @example
     * ```typescript
     * // Getting the API base URL of selected instance
     * const instance = this.appService.getSelectedInstance();
     * if (instance) {
     *   console.log(`Using instance: ${instance.name} at ${instance.apiBaseUrl}`);
     * }
     * ```
     */
    public getSelectedInstance(): BeyondtrustInstance | null {
        const selectedId = this.selectedInstanceIdSubject.value;
        if (!selectedId) return null;

        return (
            this.instancesSubject.value.find((i) => i.id === selectedId) || null
        );
    }

    /**
     * Gets all loaded BeyondTrust instances (synchronous).
     * Returns empty array if not yet loaded.
     *
     * **Use this when:** You need the full list for display/iteration (prefer instances$ for reactive)
     *
     * @returns Array of all instances
     *
     * @example
     * ```typescript
     * // Getting instances synchronously (one-time read)
     * const allInstances = this.appService.getInstances();
     * console.log(`Total instances: ${allInstances.length}`);
     *
     * // ✅ Better: Subscribe to reactive updates
     * this.appService.instances$.subscribe(instances => {
     *   this.instanceOptions = instances;
     * });
     * ```
     */
    public getInstances(): BeyondtrustInstance[] {
        return this.instancesSubject.value;
    }

    /**
     * Gets a specific BeyondTrust instance by ID (synchronous).
     * Returns undefined if instance not found.
     *
     * **Use this when:** You need to look up an instance by ID for display/validation
     *
     * @param id - The instance ID to look up
     * @returns The instance object or undefined
     *
     * @example
     * ```typescript
     * // Looking up an instance for validation
     * const instance = this.appService.getInstanceById(5);
     * if (instance) {
     *   console.log(`Instance #5: ${instance.name}`);
     * } else {
     *   console.warn('Instance #5 not found');
     * }
     * ```
     */
    public getInstanceById(id: number): BeyondtrustInstance | undefined {
        return this.instancesSubject.value.find((i) => i.id === id);
    }
}
