declare module "dns" {
    export function getServers(): string[];

    export class Resolver {
        constructor();

        cancel();

        getServers(): string[];

        resolve(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve(hostname: string, rrtype: "A", callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve(hostname: string, rrtype: "AAAA", callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve(hostname: string, rrtype: "CNAME", callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve(hostname: string, rrtype: "MX", callback: (err: NodeJS.ErrnoException, addresses: MxRecord[]) => void): void;
        resolve(hostname: string, rrtype: "NAPTR", callback: (err: NodeJS.ErrnoException, addresses: NaptrRecord[]) => void): void;
        resolve(hostname: string, rrtype: "NS", callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve(hostname: string, rrtype: "PTR", callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve(hostname: string, rrtype: "SOA", callback: (err: NodeJS.ErrnoException, addresses: SoaRecord) => void): void;
        resolve(hostname: string, rrtype: "SRV", callback: (err: NodeJS.ErrnoException, addresses: SrvRecord[]) => void): void;
        resolve(hostname: string, rrtype: "TXT", callback: (err: NodeJS.ErrnoException, addresses: string[][]) => void): void;
        resolve(hostname: string, rrtype: string, callback: (err: NodeJS.ErrnoException, addresses: string[] | MxRecord[] | NaptrRecord[] | SoaRecord | SrvRecord[] | string[][]) => void): void;

        resolve4(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve4(hostname: string, options: ResolveWithTtlOptions, callback: (err: NodeJS.ErrnoException, addresses: RecordWithTtl[]) => void): void;
        resolve4(hostname: string, options: ResolveOptions, callback: (err: NodeJS.ErrnoException, addresses: string[] | RecordWithTtl[]) => void): void;

        resolve6(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolve6(hostname: string, options: ResolveWithTtlOptions, callback: (err: NodeJS.ErrnoException, addresses: RecordWithTtl[]) => void): void;
        resolve6(hostname: string, options: ResolveOptions, callback: (err: NodeJS.ErrnoException, addresses: string[] | RecordWithTtl[]) => void): void;

        resolveCname(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolveMx(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: MxRecord[]) => void): void;
        resolveNaptr(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: NaptrRecord[]) => void): void;
        resolveNs(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolvePtr(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[]) => void): void;
        resolveSoa(hostname: string, callback: (err: NodeJS.ErrnoException, address: SoaRecord) => void): void;
        resolveSrv(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: SrvRecord[]) => void): void;
        resolveTxt(hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[][]) => void): void;

        reverse(ip: string, callback: (err: NodeJS.ErrnoException, hostnames: string[]) => void): void;

        setServers(servers: string[]): void;
    }
}