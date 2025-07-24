import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    Customer,
    CustomerCreateRequest,
    CustomerLicenseUsage,
    CustomerModifyRequest,
} from "./models";

@Injectable()
export class CustomersService {
    constructor(private readonly http: HttpClient) {}

    public async fetchCustomers(): Promise<Customer[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<Customer[]>("customers", { params })
        );
    }

    public async createCustomer(
        body: CustomerCreateRequest
    ): Promise<Customer> {
        return firstValueFrom(this.http.post<Customer>("customers", body));
    }

    public async modifyCustomer(
        id: number,
        body: CustomerModifyRequest
    ): Promise<Customer> {
        return firstValueFrom(
            this.http.patch<Customer>(`customers/${id}`, body)
        );
    }

    public async deactivateCustomer(id: number): Promise<void> {
        return firstValueFrom(
            this.http.post<void>(`customers/${id}/deactivate`, {})
        );
    }

    public async calculateLicenseUsage(
        id: number
    ): Promise<CustomerLicenseUsage> {
        return firstValueFrom(
            this.http.post<CustomerLicenseUsage>(
                `customers/${id}/calculateLicenseUsage`,
                {}
            )
        );
    }
}
