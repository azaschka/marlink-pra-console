import { Directive, Output, EventEmitter, HostListener } from "@angular/core";

@Directive({
    selector: "[appDragDrop]",
})
export class DragDropDirective {
    @Output() public fileDropped = new EventEmitter<FileList>();

    //Drag over listener
    @HostListener("dragover", ["$event"]) public onDragOver(
        event: DragEvent
    ): void {
        event.preventDefault();
        event.stopPropagation();
    }

    //Drag leave listener
    @HostListener("dragleave", ["$event"]) public onDragLeave(
        event: DragEvent
    ): void {
        event.preventDefault();
        event.stopPropagation();
    }

    //Drop listener
    @HostListener("drop", ["$event"]) public ondrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        let files: FileList | undefined;
        if (event?.dataTransfer) {
            files = event.dataTransfer.files;
        }

        if (files && files.length > 0) {
            this.fileDropped.emit(files);
        }
    }
}
