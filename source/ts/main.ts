import {
    ServiceDiscoveryDNSSD
} from "./core/ServiceDiscoveryDNSSD"

let sd = new ServiceDiscoveryDNSSD({
    hostnames: ["arrowhead.ltu.se"],
});
sd.lookupTypes()
    .then(types => {
        types.forEach(type => {
            sd.lookupIdentifiers(type)
                .then(identifiers => identifiers.forEach(identifier => {
                    sd.lookupRecord(identifier)
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