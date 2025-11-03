import { Directive, Output, EventEmitter, HostListener } from "@angular/core";

@Directive({
    selector: "[appDragDrop]",
})
export class DragDropDirective {
    @Output() public fileDropped = new EventEmitter<FileList>();
    @Output() public hover = new EventEmitter<boolean>();

    @HostListener("dragover", ["$event"]) public onDragOver(
        event: DragEvent
    ): void {
        event.preventDefault();
        event.stopPropagation();
        this.hover.emit(true);
    }
    @HostListener("dragleave", ["$event"]) public onDragLeave(
        event: DragEvent
    ): void {
        event.preventDefault();
        event.stopPropagation();
        this.hover.emit(false);
    }
    @HostListener("drop", ["$event"]) public onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.hover.emit(false);
        let files: FileList | undefined;
        if (event?.dataTransfer) {
            files = event.dataTransfer.files;
        }
        if (files && files.length > 0) {
            this.fileDropped.emit(files);
        }
    }
}
