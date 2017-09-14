import { Buffer } from "buffer";
import * as crypto from "crypto";
import * as dns from "dns";
import * as os from "os";
import {
    ServiceDiscovery,
    ServiceType,
    ServiceIdentifier,
    ServiceRecord
} from "./ServiceDiscovery";

/**
 * Provides a `ServiceDiscovery` implementation based on the DNS-SD protocol.
 */
export class ServiceDiscoveryDNSSD implements ServiceDiscovery {
    private browsingDomains: () => Promise<string[]>;
    private registrationDomains: () => Promise<string[]>;
    private hostnames: () => Promise<string[]>;
    private resolver = new dns.Resolver();

    /**
     * Creates new DNS-SD `ServiceDiscovery` instance.
     * 
     * @param configuration DNS-SD configuration.
     */
    public constructor(configuration: ServiceDiscoveryDNSSDConfiguration = {}) {
        if (configuration.browsingDomains) {
            const domains = configuration.browsingDomains.slice();
            this.browsingDomains = () => Promise.resolve(domains);
        } else {
            this.browsingDomains = () => this.hostnames().then(hostnames =>
                this.resolveAll("PTR", hostnames
                    .map(domain => "b._dns-sd._udp." + domain)));
        }

        if (configuration.registrationDomains) {
            const domains = configuration.registrationDomains.slice();
            this.registrationDomains = () => Promise.resolve(domains);
        } else {
            this.browsingDomains = () => this.hostnames().then(hostnames =>
                this.resolveAll("PTR", hostnames
                    .map(domain => "r._dns-sd._udp." + domain)));
        }

        if (configuration.hostnames) {
            const hostnames = configuration.hostnames.slice();
            this.hostnames = () => Promise.resolve(hostnames);
        } else {
            this.hostnames = () =>
                this.reverseAll(externalNetworkInterfaceAddresses())
                    .then(names => names.reduce((hostnames, name) => {
                        const index = name.indexOf(".");
                        if (index >= 0) {
                            hostnames.push(name.substring(index + 1));
                        }
                        return hostnames;
                    }, new Array<string>()));

        }

        if (configuration.nameServerAddresses) {
            this.resolver.setServers(configuration.nameServerAddresses);
        }

        function externalNetworkInterfaceAddresses(): string[] {
            const nifGroups = os.networkInterfaces();
            return Object.getOwnPropertyNames(nifGroups)
                .map(nifGroupName => nifGroups[nifGroupName])
                .reduce((addresses, nifGroup) => {
                    nifGroup.forEach(nif => {
                        if (!nif.internal) {
                            addresses.push(nif.address);
                        }
                    });
                    return addresses;
                }, new Array<string>());
        }
    }

    public lookupTypes(): Promise<ServiceType[]> {
        return this.browsingDomains()
            .then(domains => this.resolveAll("PTR", domains
                .map(domain => "_services._dns-sd._udp." + domain)))
            .then(types => types.map(type => new ServiceTypeDNSSD(type)));
    }

    public lookupIdentifiers(type: ServiceType): Promise<ServiceIdentifier[]> {
        return this.resolve("PTR", type.toString())
            .then(rdata => rdata.map(item =>
                new ServiceIdentifierDNSSD(item)));
    }

    public lookupRecord(identifier: ServiceIdentifier): Promise<ServiceRecord> {
        const rrname = identifier.toString();
        return Promise.all([
            this.resolve("SRV", rrname),
            this.resolve("TXT", rrname)])
            .then(([srv, txt]) => new ServiceRecordDNSSD(identifier, srv, txt));
    }

    public publish(record: ServiceRecord): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public unpublish(record: ServiceRecord): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private resolve(rrtype: string, rrname: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.resolver.resolve(rrname, rrtype, (error, value) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(value);
                }
            });
        });
    }

    private resolveAll(rrtype: string, rrnames: string[]): Promise<any[]> {
        return dnsFlatMap((rrname, callback) =>
            this.resolver.resolve(rrname, rrtype, callback), rrnames);
    }

    private reverseAll(addresses: string[]): Promise<string[]> {
        return dnsFlatMap((address, callback) =>
            this.resolver.reverse(address, callback), addresses);
    }
}

type DnsCallback<T> = (error: NodeJS.ErrnoException, value: T) => void;
type DnsFunction<T> = (hostname: string, callback: DnsCallback<T>) => void;

function dnsMap<T>(f: DnsFunction<T>, rrnames: string[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const errors = new Array<NodeJS.ErrnoException>();
        const result = new Array<T>();

        let remaining = rrnames.length;
        rrnames.forEach(rrname => {
            f(rrname, (error, value) => {
                remaining -= 1;

                if (error) {
                    errors.push(error);
                } else {
                    result.push(value);
                }

                if (remaining == 0) {
                    if (result.length > 0) {
                        resolve(result);
                    } else {
                        reject(errors);
                    }
                }
            })
        });
    });
}

function dnsFlatMap<T>(f: DnsFunction<T[]>, rrnames: string[]): Promise<T[]> {
    return dnsMap(f, rrnames)
        .then(groups => groups.reduce((values, group) => {
            values.push(...group);
            return values;
        }, new Array<T>()))
}

/**
 * Options for creating `ServiceDiscoveryDNSSD` instances.
 */
export interface ServiceDiscoveryDNSSDConfiguration {
    /**
     * DNS-SD browsing domains.
     * 
     * If not given, browsing domains will be discovered using `hostnames`.
     */
    browsingDomains?: string[];

    /**
     * DNS-SD registration domains.
     * 
     * If not given, registration domains will be discovered using `hostnames`.
     */
    registrationDomains?: string[];

    /**
     * Relevant domain name server hostnames.
     * 
     * If not given, DNS hostnames are resolved by doing reverse DNS lookups on
     * the addresses of any local network interfaces, and then removing the
     * least significant local hostname parts. If the local network interface
     * "eth0" has IPv4 address 192.168.0.2 and a reverse DNS lookup yields
     * "node2.example.arrowhead.eu", then "example.arrowhead.eu" will be used as
     * hostname. Note, however, that the use of VPN tunnels or other kinds of
     * virtual network interfaces may lead to some hostnames not being resolved.
     */
    hostnames?: string[];

    /**
     * Addresses of used DNS/DNS-SD servers.
     *
     * If not set, any DNS servers provided by the system hosting the
     * application will be used.
     */
    nameServerAddresses?: string[];
}

class ServiceTypeDNSSD implements ServiceType {
    public hostname: string;
    public serviceType: string;

    constructor(data: string | ServiceType) {
        if (typeof data === "string") {
            let i = data.length - 1;
            while (data.charAt(i) === ".") {
                i--;
            }
            data = data.substring(0, i + 1);

            let divider = data.length;
            for (i = divider; i-- > 0;) {
                if (data.charAt(i) === ".") {
                    if (data.charAt(i + 1) === "_") {
                        break;
                    } else {
                        divider = i;
                    }
                }
            }
            this.hostname = data.substring(divider + 1);
            this.serviceType = data.substring(0, divider);
        } else {
            this.hostname = data.hostname;
            this.serviceType = data.serviceType;
        }
    }

    public toString(): string {
        return this.serviceType + "." + this.hostname + ".";
    }
}

class ServiceIdentifierDNSSD extends ServiceTypeDNSSD implements ServiceIdentifier {
    public serviceName: string;

    constructor(data: string | ServiceIdentifier) {
        super(data);

        if (typeof data === "string") {
            let offset = this.serviceType.indexOf(".");
            this.serviceName = this.serviceType.substring(0, offset);
            this.serviceType = this.serviceType.substring(offset + 1);
        } else {
            this.serviceName = data.serviceName;
        }
    }

    public toString(): string {
        return this.serviceName + "." + super.toString();
    }
}

class ServiceRecordDNSSD extends ServiceIdentifierDNSSD implements ServiceRecord {
    public endpoint: string;
    public port: number;
    public metadata;

    constructor(id: ServiceIdentifier, srv: dns.SrvRecord[], txt: string[][]) {
        super(id);

        const record = selectRecordFrom(srv);
        this.endpoint = record.name;
        this.port = record.port;
        this.metadata = createObjectFrom(txt);

        function selectRecordFrom(srv: dns.SrvRecord[]): dns.SrvRecord {
            let minPriority = 65536, options: dns.SrvRecord[] = [];
            srv.forEach(record => {
                if (minPriority > record.priority) {
                    minPriority = record.priority;
                    options = [record];
                } else if (record.priority === minPriority) {
                    options.push(record);
                }
            });
            let total = options.reduce((sum, option) => sum + option.weight, 0);
            const cutoff = (crypto.randomBytes(1).readUInt8(0) / 255) * total;
            return options.find(option => (total -= option.weight) <= cutoff);
        }

        function createObjectFrom(txt: string[][]) {
            const object = {};
            txt.forEach(record => {
                record.forEach(pair => {
                    const valueOffset = pair.indexOf("=");
                    let key, value;
                    if (valueOffset >= 0) {
                        key = pair.substring(0, valueOffset);
                        value = pair.substring(valueOffset + 1);
                    } else {
                        key = pair;
                        value = "";
                    }
                    object[key.trim()] = value.trim();
                });
            });
            return object;
        }
    }

    public toString(): string {
        const attributes: string[] = [
            "endpoint=" + this.endpoint,
            "port=" + this.port,
        ];
        Object.getOwnPropertyNames(this.metadata).forEach(key => {
            const value = this.metadata[key];
            attributes.push(key + (value ? ("=" + value) : ""));
        })
        return super.toString() + " {" + attributes.join(",") + "}";
    }
}
