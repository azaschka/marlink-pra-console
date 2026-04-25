import { Directive, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

import { JwtAuthService } from "../../services/auth/jwt-auth.service";
import { PraUser } from "../../models";
import { BusinessUnit } from "../../../views/pra-users/enums";

/**
 * Abstract base component for all protected PRA view components.
 *
 * Centralises the three pieces of boilerplate that were copy-pasted into
 * every view component:
 *
 *  1. `subscriptionsToClear` — a shared RxJS Subscription bag that is
 *     automatically unsubscribed in `ngOnDestroy`.
 *  2. `currentBusinessUnit` — kept in sync with the authenticated user by
 *     subscribing to `JwtAuthService.praUser` in the constructor.  Because
 *     `praUser` is a BehaviorSubject the value is available synchronously
 *     before `ngOnInit` runs, so `loadPage()` calls always see the correct
 *     business unit on the first render.
 *  3. `ngOnDestroy` — unsubscribes the shared bag.  Subclasses that need
 *     additional teardown should override and call `super.ngOnDestroy()`.
 *
 * ### Extending the class
 *
 * ```typescript
 * @Component({ ... })
 * export class MyComponent extends PraBaseComponent implements OnInit {
 *   constructor(
 *     private readonly myService: MyService,
 *     jwtAuthService: JwtAuthService,   // no access modifier — passed to super
 *   ) {
 *     super(jwtAuthService);
 *   }
 *
 *   public async ngOnInit(): Promise<void> {
 *     await this.loadPage();
 *   }
 * }
 * ```
 *
 * ### Reacting to user changes
 *
 * Override `onUserChanged()` when a component needs to derive additional
 * state from the authenticated user (e.g. role-based flags).  The base class
 * always calls this method after updating `currentBusinessUnit`, so both
 * pieces of state are consistent.
 *
 * ```typescript
 * protected override onUserChanged(user: PraUser): void {
 *   this.isSuperAdmin = user.role === AuthRole.SUPER_ADMIN;
 * }
 * ```
 *
 * ### Adding extra subscriptions
 *
 * Use the inherited `subscriptionsToClear` bag — it is cleaned up
 * automatically:
 *
 * ```typescript
 * public ngOnInit(): void {
 *   this.subscriptionsToClear.add(
 *     this.appService.selectedInstanceId$.subscribe(id => { ... }),
 *   );
 * }
 * ```
 *
 * ### Custom ngOnDestroy
 *
 * ```typescript
 * public override ngOnDestroy(): void {
 *   this.pollSubscription?.unsubscribe();
 *   super.ngOnDestroy();
 * }
 * ```
 *
 * ### Note on Angular DI
 *
 * No `@Directive()` decorator is needed on this abstract class.  Angular
 * resolves constructor parameters via the concrete `@Component()` subclass.
 * Each subclass must declare `jwtAuthService: JwtAuthService` (without an
 * access modifier) as a constructor parameter and pass it to `super()`.
 */
// @ts-ignore: Angular requires @Directive() on abstract base classes (Ivy).
// TypeScript's type system incorrectly rejects this for abstract classes,
// but Angular's compiler handles it correctly at runtime.
@Directive()
export abstract class PraBaseComponent implements OnDestroy {
    /**
     * Business unit of the currently authenticated user.
     * Populated synchronously from the BehaviorSubject before ngOnInit runs.
     */
    protected currentBusinessUnit: BusinessUnit | null | undefined;

    /**
     * Central RxJS subscription bag.
     * All subscriptions added here are unsubscribed in ngOnDestroy.
     */
    protected readonly subscriptionsToClear = new Subscription();

    constructor(protected readonly jwtAuthService: JwtAuthService) {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                this.currentBusinessUnit = user?.businessUnit;
                this.onUserChanged(user);
            }),
        );
    }

    /**
     * Called on every emission of `JwtAuthService.praUser`, after
     * `currentBusinessUnit` has already been updated.
     *
     * Override this in subclasses to derive additional state from the
     * authenticated user without having to set up a second subscription.
     *
     * The default implementation is a no-op.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onUserChanged(_user: PraUser): void {}

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }
}
