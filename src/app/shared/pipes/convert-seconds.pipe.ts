import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "convertSeconds" })
export class ConvertSecondsPipe implements PipeTransform {
    public transform(seconds: string): string {
        if (!seconds) return "N/A";

        const convertedSeconds = parseInt(seconds, 10);
        const convertedHours = Math.floor(convertedSeconds / 3600);
        const convertedMinutes = Math.floor((convertedSeconds % 3600) / 60);
        const remainingSeconds = convertedSeconds % 60;

        let result = "";

        if (convertedHours > 0) result += `${convertedHours} hour(s) `;
        if (convertedMinutes > 0) result += `${convertedMinutes} minute(s) `;
        if (remainingSeconds > 0) result += `${remainingSeconds} second(s)`;

        return result;
    }
}
