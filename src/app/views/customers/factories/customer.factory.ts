import { ParsedCustomer } from "../../../shared/services/site-excel-parser.service";
import { StringSanitizer } from "../../../shared/helpers";
import { CustomerCreateRequest } from "../models";
import { CustomerBusinessUnit } from "../enums";

export class CustomerFactoryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CustomerFactoryError";
    }
}

export class CustomerFactory {
    public static create(
        beyondtrustInstanceId: number,
        parsedCustomer: ParsedCustomer,
    ): CustomerCreateRequest {
        if (!parsedCustomer)
            throw new CustomerFactoryError("Customer input is missing.");

        const key = this.sanitizeKey(parsedCustomer.key);
        if (!key)
            throw new CustomerFactoryError("Customer id is missing or empty.");

        const name = this.sanitizeName(parsedCustomer.name);
        if (!name)
            throw new CustomerFactoryError(
                "Customer name is missing or empty.",
            );

        const businessUnit = this.mapBusinessUnit(parsedCustomer.businessUnit);

        return { key, name, businessUnit, beyondtrustInstanceId };
    }

    private static sanitizeKey(key: string): string {
        if (!key) return "";
        let out = key.trim();
        out = StringSanitizer.replaceSpecialCharacters(out);
        out = StringSanitizer.removeSpecialCharacters(out);
        return out;
    }

    private static sanitizeName(name: string): string {
        if (!name) return "";
        let out = name.trim();
        out = StringSanitizer.replaceWhitespaceWithUnderscore(out);
        out = StringSanitizer.replaceHyphensWithUnderscore(out);
        out = StringSanitizer.replaceSpecialCharacters(out);
        out = StringSanitizer.removeSpecialCharacters(out);
        return out.toUpperCase();
    }

    private static mapBusinessUnit(
        raw: string | undefined | null,
    ): CustomerBusinessUnit {
        if (!raw) return CustomerBusinessUnit.MT;
        // Extract the first two characters and convert to uppercase
        const code = raw.match(/^[A-Za-z]{2}/)?.[0]?.toUpperCase() ?? "";

        return this.isBusinessUnit(code)
            ? (code as CustomerBusinessUnit)
            : CustomerBusinessUnit.MT;
    }

    private static isBusinessUnit(
        value: string,
    ): value is CustomerBusinessUnit {
        return (Object.values(CustomerBusinessUnit) as string[]).includes(
            value,
        );
    }
}
