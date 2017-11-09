# Arrowhead Configuration System (REST/WS)

[Arrowhead][arrow] Configuration System, useful for providing configuration
documents to requesting services. Configuration documents are specified using
a semantics-only encoding, meaning that they can be translated into other
encodings when requested. Also, added documents are automatically verified to
correct in relation to managed configuration templates.

_This repository contains a Proof-of-Concept (PoC) implementation. Some_
_important implementation details may be missing, making this application_
_unsuitable for production use._

## About Arrowhead

Arrowhead is a service-oriented automation framework, envisioned to enable the
creation of highly dynamic, scalable and resilient industrial automation
systems. It is centered around the idea of so-called
[Local Automation Clouds][clwik], which could be thought of as secured
intranets with real-time operation support. For more information, please refer
to the [Arrowhead Wiki][arwik].

## Running

### Standalone

The repository is managed using the [Node Package Manager][npmjs]. Download
and install it, clone this repository, browse into the cloned repository using
a terminal emulator, and enter the below commands:

```bash
$ npm install
$ npm start -d
```

The above commands may vary slightly if not using Bash, Z, or other related
terminal shell, such as is often the case when using a version of Windows.

To see what versions of Node are supported, refer to the `engines.node` entry
in [package.json][pajso].

### As Part of an Arrowhead Cluster

If the application is to run as part of an Arrowhead cluster, additional setup
is required. In particular, the application configuration file must be
modified. To determine the location of the configuration file, run the 
application in standalone and read the console output. One of the first lines
should contain `Configuration path:` followed by the path to the file.

When the file has been located, open it with a text editor. Configuration data
is specified in JSON. A full example is given below.

```json
{
    "dnssd": {
        "browsingDomains": "b._dns-sd._udp.services.arrowhead.eu.",
        "registrationDomains": "r._dns-sd._udp.services.arrowhead.eu.",
        "hostnames": ["services.arrowhead.eu."],
        "nameServers": ["192.168.1.223"],
        "transactionKey": {
            "name": "key.arrowhead.eu.",
            "secret": "qBClkn0Qkk6w5DACRllq1w==",
            "algorithm": "HMAC-MD5.SIG-ALG.REG.INT",
            "fudge": 300
        }
    },
    "endpoint": "node-23-1.arrowhead.eu",
    "port": 8080,
    "instanceName": "MyInstance"
}
```

If the service registry is a DNS server that is discovered automatically by a
local DHCP service, or equivalent, then only the `transactionKey` property
inside the `dnssd` object needs to be specified. Its `algorithm` and `fudge`
properties need only be specified if the values in the above example, which
should be the defaults, are not desired. The `secret` property must be
specified in Base64 form. The other `dnssd` properties may be specified as
required. Note that `nameServers` must be a list of IPv4 or IPv6 addresses.
Domain names may not be used.

Unless running in standalone mode, `endpoint` must be specified, as there is
currenly no mechanism for automatically resolving it. Lastly, `port` is set to
`8080` if not given, and `instanceName` is set to a random string of characters
unless specified.

## Demo

[An API demo][demop] is available as a [Postman][postm] collection. Download
the Postman client, import the file, and try the example API calls. Note that
the configuration system must be running for the Postman collection requests to
work as intended.

## Contributing

No further development is planned on this service. Feel free to make a fork
and continue development as you desire.

[arrow]: http://www.arrowhead.eu/
[arwik]: https://forge.soa4d.org/plugins/mediawiki/wiki/arrowhead-f/index.php/Main_Page
[clwik]: https://forge.soa4d.org/plugins/mediawiki/wiki/arrowhead-f/index.php/Local_automation_clouds
[postm]: https://www.getpostman.com/
[demop]: ArrowheadConfigurationSystem.postman_collection.json
[npmjs]: https://www.npmjs.com/
[pajso]: package.json