import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

@Component({
    selector: "app-sidenav",
    templateUrl: "./sidenav.template.html",
})
export class SidenavComponent {
    @Input("items") public menuItems: any[] = [];
    @Input("hasIconMenu") public hasIconTypeMenuItem: boolean;
    @Input("iconMenuTitle") public iconTypeMenuTitle: string;
    @ViewChild("sidenav") sidenav: ElementRef;

    constructor(private readonly http: HttpClient) {}
    ngOnInit() {}
    ngAfterViewInit() {
        setTimeout(() => {
            const links = this.sidenav.nativeElement.querySelectorAll(
                "li[appdropdownlink]"
            );
            [...links].forEach((link) => {
                if (link.querySelector("a.open")) {
                    link.classList.add("open");
                }
            });
        });
    }

    // Only for demo purpose
    addMenuItem() {
        this.menuItems.push({
            name: "ITEM",
            type: "dropDown",
            tooltip: "Item",
            icon: "done",
            state: "material",
            sub: [
                { name: "SUBITEM", state: "cards" },
                { name: "SUBITEM", state: "buttons" },
            ],
        });
    }

    /**
     * Handle file downloads for menu items with type 'download'
     * @param fileUrl The URL/path to the file to download
     * @param fileName The name to save the file as
     */
    public async handleDownload(
        fileUrl: string,
        fileName: string
    ): Promise<void> {
        try {
            // Fetch the file as a blob
            const blob = await firstValueFrom(
                this.http.get(fileUrl, { responseType: "blob" })
            );

            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.click();

            // Clean up
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download file:", error);
        }
    }
}
