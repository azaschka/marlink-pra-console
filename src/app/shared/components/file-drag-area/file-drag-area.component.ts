import { EventEmitter } from "@angular/core";
import { Input } from "@angular/core";
import { Output } from "@angular/core";
import { Component } from "@angular/core";

@Component({
    selector: "app-file-drag-area",
    templateUrl: "./file-drag-area.component.html",
    styleUrls: ["./file-drag-area.component.scss"],
})
export class FileDragAreaComponent {
    @Output() importedFiles = new EventEmitter<FileList>();

    @Input() acceptedFileEndings: string[] = [];
    @Input() dragAreaHint: string | undefined;
    @Input() dragAreaHintHorizontalPadding: string | undefined;
    @Input() dragAreaHeight: string | undefined;
    @Input() mustHideIcon: boolean | undefined;
    @Input() multipleFiles = false;

    public isDragOver = false;

    public onFileDrop(fileList: FileList): void {
        this.isDragOver = false;

        if (!fileList || fileList.length === 0) {
            return;
        }

        this.importedFiles.emit(fileList);
    }

    public onFileInput(event: Event): void {
        const fileList: FileList | null = (event.target as HTMLInputElement)
            .files;

        if (!fileList || fileList.length === 0) {
            return;
        }

        this.importedFiles.emit(fileList);
    }
}
