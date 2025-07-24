import { Component, forwardRef, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    selector: "app-weekday-toggle",
    templateUrl: "./weekday-toggle.component.html",
    styleUrls: ["./weekday-toggle.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => WeekDayToggleComponent),
            multi: true,
        },
    ],
})
export class WeekDayToggleComponent implements ControlValueAccessor {
    @Input() weekDays: { label: string; value: number }[] = [];

    value: number[] = [];

    // Method to update the model value when the component value changes
    onChange = (value: number[]) => {};
    onTouched = () => {};

    writeValue(value: number[]): void {
        this.value = value;
    }

    registerOnChange(fn: (value: number[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    onToggleChange(event: any): void {
        this.value = event.value;
        this.onChange(this.value);
    }
}
