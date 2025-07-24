import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ConvertSecondsPipe } from "./convert-seconds.pipe";
import { ExcerptPipe } from "./excerpt.pipe";
import { GetValueByKeyPipe } from "./get-value-by-key.pipe";
import { RelativeTimePipe } from "./relative-time.pipe";

const PIPES = [
    ConvertSecondsPipe,
    ExcerptPipe,
    GetValueByKeyPipe,
    RelativeTimePipe,
];

@NgModule({
    imports: [CommonModule],
    declarations: PIPES,
    exports: PIPES,
})
export class SharedPipesModule {}
