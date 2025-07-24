import {
    Injectable,
    Inject,
    Renderer2,
    RendererFactory2,
    EventEmitter,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";

export interface ITheme {
    name: string;
    baseColor?: string;
    isActive?: boolean;
}

@Injectable()
export class ThemeService {
    public onThemeChange: EventEmitter<ITheme> = new EventEmitter();

    public egretThemes: ITheme[] = [
        {
            name: "egret-navy",
            baseColor: "#10174c",
            isActive: false,
        },
        {
            name: "egret-navy-dark",
            baseColor: "#0081ff",
            isActive: false,
        },
    ];

    public activatedTheme: ITheme;

    private renderer: Renderer2;

    constructor(
        @Inject(DOCUMENT) private document: Document,
        rendererFactory: RendererFactory2
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    // Invoked in AppComponent and apply 'activatedTheme' on startup
    public applyMatTheme(themeName: string): void {
        this.activatedTheme = this.egretThemes.find(
            (t) => t.name === themeName
        );

        this.renderer.addClass(this.document.body, themeName);
    }

    public changeTheme(prevTheme, themeName: string): void {
        this.renderer.removeClass(this.document.body, prevTheme);
        this.renderer.addClass(this.document.body, themeName);
        this.onThemeChange.emit(this.activatedTheme);
    }
}
