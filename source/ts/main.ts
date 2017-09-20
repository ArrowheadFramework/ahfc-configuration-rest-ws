import * as core from "./core"


let serviceDiscovery = new core.ServiceDiscoveryDNSSD({
    hostnames: ["dns-sd.org"],
    nameServerAddresses: ["8.8.8.8"],
});

serviceDiscovery.lookupTypes()
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