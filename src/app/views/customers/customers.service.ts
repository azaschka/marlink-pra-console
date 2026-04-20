import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    Customer,
    CustomerCreateRequest,
    CustomerLicenseUsage,
    CustomerModifyRequest,
    RetrieveCustomersParams,
} from "./models";

@Injectable()
export class CustomersService {
    constructor(private readonly http: HttpClient) {}

    public async fetchCustomers(
        params: RetrieveCustomersParams = {},
    ): Promise<Customer[]> {
        let httpParams = new HttpParams();
        httpParams = httpParams.set("pageSize", "9999");

        if (params.pageSize !== undefined) {
            httpParams = httpParams.set("pageSize", params.pageSize.toString());
        }
        if (params.pageNumber !== undefined) {
            httpParams = httpParams.set(
                "pageNumber",
                params.pageNumber.toString(),
            );
        }
        if (params.key !== undefined) {
            httpParams = httpParams.set("key", params.key);
        }
        if (params.name !== undefined) {
            httpParams = httpParams.set("name", params.name);
        }
        if (
            params.businessUnits !== undefined &&
            params.businessUnits.length > 0
        ) {
            params.businessUnits.forEach((unit) => {
                httpParams = httpParams.append("businessUnits", unit);
            });
        }

        return firstValueFrom(
            this.http.get<Customer[]>("customers", { params: httpParams }),
        );
    }

    public async createCustomer(
        body: CustomerCreateRequest,
    ): Promise<Customer> {
        return firstValueFrom(this.http.post<Customer>("customers", body));
    }

    public async modifyCustomer(
        id: number,
        body: CustomerModifyRequest,
    ): Promise<Customer> {
        return firstValueFrom(
            this.http.patch<Customer>(`customers/${id}`, body),
        );
    }

    public async deleteCustomer(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`customers/${id}`));
    }

    public async deactivateCustomer(id: number): Promise<void> {
        return firstValueFrom(
            this.http.post<void>(`customers/${id}/deactivate`, {}),
        );
    }

    public async reactivateCustomer(id: number): Promise<void> {
        return firstValueFrom(
            this.http.post<void>(`customers/${id}/reactivate`, {}),
        );
    }

    public async calculateLicenseUsage(
        id: number,
    ): Promise<CustomerLicenseUsage> {
        return firstValueFrom(
            this.http.post<CustomerLicenseUsage>(
                `license-usages/customers/${id}`,
                {},
            ),
        );
    }
}
