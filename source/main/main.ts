import * as ahfc from "ahf-core";

let serviceDiscovery = new ahfc.ServiceDiscoveryDNSSD({
    hostnames: ["arrowhead.eu"], // Name server hostname.
    nameServers: ["0.0.0.0"], // IP address of name server.
    transactionKey: {
        name: undefined, // TSIG key name.
        secret: undefined // TSIG key.
    },
});

serviceDiscovery
    .publish({
        serviceType: "_ahf-Configuration._http._tcp",
        serviceName: "MyInstance",
        endpoint: "example.com",
        port: 80,
        metadata: { crazy: "yes", encode: "xml" },
    })
    .then(_ => listAllServices())
    .then(_ => serviceDiscovery.unpublish({
        serviceType: "_ahf-Configuration._http._tcp",
        serviceName: "MyInstance",
    }))
    .then(_ => listAllServices())
    .catch(e => {
        console.log(e);
    });

function listAllServices(): Promise<void> {
    return serviceDiscovery.lookupTypes()
        .then(types => {
            types.forEach(type => {
                serviceDiscovery.lookupIdentifiers(type)
                    .then(identifiers => identifiers.forEach(identifier => {
                        serviceDiscovery.lookupRecord(identifier)
                            .then(record => console.log("" + record))
                            .catch(error => {
                                console.log(error);
                            });
                    }))
                    .catch(error => {
                        console.log(error);
                    });
            });
        })
        .catch(error => {
            console.log(error);
        });
}