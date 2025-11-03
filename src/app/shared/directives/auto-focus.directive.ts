import {
    Directive,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    Input,
} from "@angular/core";

/**
 * Directive to automatically focus an element after it has been rendered
 *
 * @example
 * Basic usage:
 * ```html
 * <input matInput appAutoFocus />
 * ```
 *
 * @example
 * With custom delay:
 * ```html
 * <input matInput appAutoFocus [autoFocusDelay]="200" />
 * ```
 *
 * @example
 * Conditionally apply:
 * ```html
 * <input matInput [appAutoFocus]="shouldFocus" />
 * ```
 */
@Directive({
    selector: "[appAutoFocus]",
})
export class AutoFocusDirective implements AfterViewInit, OnDestroy {
    /**
     * Delay in milliseconds before focusing the element
     * Useful for waiting for animations or modal transitions to complete
     * @default 100
     */
    @Input() public autoFocusDelay = 100;

    /**
     * Whether to apply autofocus or not
     * Allows conditional autofocus based on component logic
     * @default true
     */
    @Input() public appAutoFocus: boolean | string = true;

    private focusTimeout?: number;

    constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

    /**
     * Focuses the element after the view has been initialized
     * Uses a timeout to ensure the element is fully rendered and any
     * parent containers (like Material dialogs) have completed their animations
     */
    public ngAfterViewInit(): void {
        // Handle string values (from template bindings without value)
        const shouldFocus =
            this.appAutoFocus === "" || this.appAutoFocus === true;

        if (!shouldFocus) {
            return;
        }

        // Use setTimeout to push focus to the next event loop tick
        // This ensures DOM is fully rendered and animations are complete
        this.focusTimeout = window.setTimeout(() => {
            this.focusElement();
        }, this.autoFocusDelay);
    }

    /**
     * Clean up timeout on directive destroy to prevent memory leaks
     */
    public ngOnDestroy(): void {
        if (this.focusTimeout !== undefined) {
            window.clearTimeout(this.focusTimeout);
        }
    }

    /**
     * Focuses the native element if it's focusable
     * Handles both standard HTML elements and Angular Material components
     */
    private focusElement(): void {
        const element = this.elementRef.nativeElement;

        // Check if element exists and has focus method
        if (!element || typeof element.focus !== "function") {
            console.warn(
                "AutoFocusDirective: Element does not support focus()",
                element,
            );
            return;
        }

        // For Material form fields, we need to focus the input inside
        // Check if this is a mat-form-field wrapper
        if (element.tagName === "MAT-FORM-FIELD") {
            const input = element.querySelector("input, textarea");
            if (input && typeof (input as HTMLElement).focus === "function") {
                (input as HTMLElement).focus();
                return;
            }
        }

        // Focus the element directly
        try {
            element.focus();
        } catch (error) {
            console.warn(
                "AutoFocusDirective: Failed to focus element",
                element,
                error,
            );
        }
    }
}
