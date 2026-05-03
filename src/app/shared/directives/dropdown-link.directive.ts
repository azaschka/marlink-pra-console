import { Directive, HostBinding, Inject, Input, OnInit, OnDestroy, ElementRef, Optional, Self } from "@angular/core";
import { RouterLinkActive } from "@angular/router";
import { Subscription } from "rxjs";
import { AppDropdownDirective } from "./dropdown.directive";

@Directive({
    selector: "[appDropdownLink]",
})
export class DropdownLinkDirective implements OnInit, OnDestroy {
    @Input() public group: any;

    protected _open = false;
    protected nav: AppDropdownDirective;

    private rlaSub: Subscription;

    @HostBinding("class.open")
    @Input()
    get open(): boolean {
        return this._open;
    }

    set open(value: boolean) {
        this._open = value;
    }

    public constructor(
        @Inject(AppDropdownDirective) nav: AppDropdownDirective,
        private _elemRef: ElementRef,
        @Optional() @Self() private routerLinkActiveRef: RouterLinkActive,
    ) {
        this.nav = nav;
        this.rlaSub = new Subscription();
    }

    public ngOnInit(): void {
        this.nav.addLink(this);

        if (this.routerLinkActiveRef) {
            // Directly sync _open with Angular's RouterLinkActive state.
            // This prevents @HostBinding from conflicting with routerLinkActive="open"
            // and eliminates the "active on 2nd click" bug that occurred because
            // appDropdownToggle was calling toggle() (i.e. _open = !_open) on every
            // click, causing _open to flip to false for previously-visited items.
            this.rlaSub = this.routerLinkActiveRef.isActiveChange.subscribe((isActive) => {
                this._open = isActive;
            });
        } else {
            // Fallback for items that have no RouterLinkActive (e.g. dropdown parents
            // whose sub-items are rendered via ng-template outside the tracked view).
            setTimeout(() => {
                this._open = this._elemRef.nativeElement.classList.contains("open");
            }, 100);
        }
    }

    public ngOnDestroy(): void {
        this.nav.removeGroup(this);
        this.rlaSub.unsubscribe();
    }

    /** Used by DropdownAnchorDirective to expand/collapse dropdown sub-menus. */
    public toggle(): void {
        this.open = !this.open;
    }
}
