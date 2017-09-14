/**
 * A service useful for registering, deregistering and discovering services.
 */
export interface ServiceDiscovery {
    /**
     * @return All service types available via discovered domains.
     */
    lookupTypes(): Promise<ServiceType[]>;

    /**
     * @param type A service type identifier.
     * @return All services instances of identified type.
     */
    lookupIdentifiers(type: ServiceType): Promise<ServiceIdentifier[]>;

    /**
     * @param identifier A service instance identifier.
     * @return A service instance record.
     */
    lookupRecord(identifier: ServiceIdentifier): Promise<ServiceRecord>;

    /**
     * Adds new record to discovery service.
     *
     * @param record Service record to add.
     * @return Promise used to track operation completion.
     */
    publish(record: ServiceRecord): Promise<void>;

    /**
     * Removes existing record from discovery service.
     *
     * @param record Service record to remove.
     * @return Promise used to track operation completion.
     */
    unpublish(record: ServiceRecord): Promise<void>;
}

/**
 * An Arrowhead service type identifier.
 */
export interface ServiceType {
    /**
     * Domain where service is registered.
     */
    readonly hostname: string;

    /**
     * Service type name.
     */
    readonly serviceType: string;
}

/**
 * An Arrowhead service identifier.
 */
export interface ServiceIdentifier extends ServiceType {
    /**
     * Name of concrete service type instance.
     */
    readonly serviceName: string;
}

/**
 * An Arrowhead service record.
 */
export interface ServiceRecord extends ServiceIdentifier {
    /**
     * Endpoint at which service is available.
     */
    readonly endpoint: string;

    /**
     * Port number through which service is available.
     */
    readonly port: number;

    /**
     * Any service metadata.
     */
    readonly metadata: {
        /**
         * Path associated with service.
         */
        readonly path?: string;

        /**
         * Message encoding used when communicating with service.
         */
        readonly encode?: string;

        /**
         * Compression algorithm applied to encoded service messages.
         */
        readonly comp?: string;

        /**
         * Semantics adhered to by service messages.
         */
        readonly sem?: string;

        /**
         * Service version identifier.
         */
        readonly version?: string;

        /**
         * Any other properties.
         */
        readonly [other: string]: string;
    };
}
