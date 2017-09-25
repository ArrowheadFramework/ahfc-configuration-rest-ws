/**
 * DNS message domain classes.
 */
export enum DClass {
    IN = 1, // Internet [RFC1035].
    CH = 3, // Chaos.
    HS = 4, // Heisod.
    NONE = 254, // QCLASS NONE [RFC2136].
    ANY = 255, // QCLASS ANY [RFC1035].
}

/**
 * DNS message operation codes.
 */
export enum OpCode {
    QUERY = 0, // Query [RFC1035].
    IQUERY = 1, // Obsolete [RFC3425].
    STATUS = 2, // Status [RFC1035].
    NOTIFY = 4, // Notify [RFC1996].
    UPDATE = 5, // Update [RFC2136].
}

/**
 * DNS message response codes.
 */
export enum RCode {
    NOERROR = 0, // No Error [RFC1035].
    FORMERR = 1, // Format Error [RFC1035].
    SERVFAIL = 2, // Server Failure [RFC1035].
    NXDOMAIN = 3, // Non-Existent Domain [RFC1035].
    NOTIMP = 4, // Not Implemented [RFC1035].
    REFUSED = 5, // Query Refused [RFC1035].
    YXDOMAIN = 6, // Name Exists when it should not [RFC2136][RFC6672].
    YXRRSET = 7, // RR Set Exists when it should not [RFC2136].
    NXRRSET = 8, // RR Set that should exist does not [RFC2136].
    NOTAUTH = 9, // Server not authoritative for zone [RFC2136][RFC2845].
    NOTZONE = 10, // Name not contained in zone [RFC2136].
    BADVERS = 16, // Bad OPT Version [RFC6891].
    BADSIG = 16, // TSIG Signature Failure [RFC2845].
    BADKEY = 17, // Key not recognized [RFC2845].
    BADTIME = 18, // Signature out of time window [RFC2845].
    BADMODE = 19, // Bad TKEY Mode [RFC2930].
    BADNAME = 20, // Duplicate key name [RFC2930].
    BADALG = 21, // Algorithm not supported [RFC2930].
    BADTRUNC = 22, // Bad Truncation [RFC4635].
    BADCOOKIE = 23, // Bad/missing Server Cookie [RFC7873].
}

/**
 * DNS resource data types.
 */
export enum Type {
    A = 1, // A host address [RFC1035].
    NS = 2, // An authoritative name server [RFC1035].
    MD = 3, // A mail destination (OBSOLETE - use MX) [RFC1035].
    MF = 4, // A mail forwarder (OBSOLETE - use MX) [RFC1035].
    CNAME = 5, // The canonical name for an alias [RFC1035].
    SOA = 6, // Marks the start of a zone of authority [RFC1035].
    MB = 7, // A mailbox domain name (EXPERIMENTAL) [RFC1035].
    MG = 8, // A mail group member (EXPERIMENTAL) [RFC1035].
    MR = 9, // A mail rename domain name (EXPERIMENTAL) [RFC1035].
    NULL = 10, // A null RR (EXPERIMENTAL) [RFC1035].
    WKS = 11, // A well known service description [RFC1035].
    PTR = 12, // A domain name pointer [RFC1035].
    HINFO = 13, // Host information [RFC1035].
    MINFO = 14, // Mailbox or mail list information [RFC1035].
    MX = 15, // Mail exchange [RFC1035].
    TXT = 16, // Text strings [RFC1035].
    RP = 17, // For Responsible Person [RFC1183].
    AFSDB = 18, // For AFS Data Base location [RFC1183][RFC5864].
    X25 = 19, // For X.25 PSDN address [RFC1183].
    ISDN = 20, // For ISDN address [RFC1183].
    RT = 21, // For Route Through [RFC1183].
    NSAP = 22, // For NSAP address, NSAP style A record [RFC1706].
    NSAPPTR = 23, // For domain name pointer, NSAP style [RFC1348][RFC1637] ...
    SIG = 24, // For security signature [RFC4034][RFC3755][RFC2535][RFC2536] ...
    KEY = 25, // For security key [RFC4034][RFC3755][RFC2535][RFC2536] ...
    PX = 26, // X.400 mail mapping information [RFC2163].
    GPOS = 27, // Geographical Position [RFC1712].
    AAAA = 28, // IP6 Address [RFC3596].
    LOC = 29, // Location Information [RFC1876].
    NXT = 30, // Next Domain (OBSOLETE) [RFC3755][RFC2535].
    EID = 31, // Endpoint Identifier.
    NIMLOC = 32, // Nimrod Locator.
    SRV = 33, // Server selection [RFC2782].
    ATMA = 34, // ATM Address.
    NAPTR = 35, // Naming Authority Pointer [RFC2915][RFC2168][RFC3403].
    KX = 36, // Key Exchanger [RFC2230].
    CERT = 37, // Certificate [RFC4398].
    A6 = 38, // A6 (OBSOLETE - use AAAA) [RFC3226][RFC2874][RFC6563].
    DNAME = 39, // DNAME [RFC6672].
    SINK = 40, // SINK.
    OPT = 41, // OPT [RFC6891][RFC3225].
    APL = 42, // APL [RFC3123].
    DS = 43, // Delegation signer [RFC4034][RFC3658].
    SSHFP = 44, // SSH key fingerprint [RFC4255].
    IPSECKEY = 45, // IPSECKEY [RFC4025].
    RRSIG = 46, // RRSIG [RFC4034][RFC3755].
    NSEC = 47, // NSEC [RFC4034][RFC3755].
    DNSKEY = 48, // DNSKEY [RFC4034][RFC3755].
    DHCID = 49, // DHCID [RFC4701].
    NSEC3 = 50, // NSEC3 [RFC5155].
    NSEC3PARAM = 51, // NSEC3PARAM [RFC5155].
    TLSA = 52, // TLSA [RFC6698].
    SMIMEA = 53, // S/MIME cert association [RFC8162].
    HIP = 55, // Host Identity Protocol [RFC8005].
    NINFO = 56, // NINFO.
    RKEY = 57, // RKEY.
    TALINK = 58, // Trust Anchor LINK.
    CDS = 59, // Child DS [RFC7344].
    CDNSKEY = 60, // DNSKEY(s) the Child wants reflected in DS [RFC7344].
    OPENPGPKEY = 61, // OpenPGP Key [RFC7929].
    CSYNC = 62, // Child-to-parent SYNChronization [RFC7477].
    SPF = 99, // [RFC7208].
    UINFO = 100, // [IANA-Reserved].
    UID = 101, // [IANA-Reserved].
    GID = 102, // [IANA-Reserved].
    UNSPEC = 103, // [IANA-Reserved].
    NID = 104, // [RFC6742].
    L32 = 105, // [RFC6742].
    L64 = 106, // [RFC6742].
    LP = 107, // [RFC6742].
    EUI48 = 108, // an EUI-48 address [RFC7043].
    EUI64 = 109, // an EUI-64 address [RFC7043].
    TKEY = 249, // Transaction Key [RFC2930].
    TSIG = 250, // Transaction Signature [RFC2845].
    IXFR = 251, // incremental transfer [RFC1995].
    AXFR = 252, // transfer of an entire zone [RFC1035][RFC5936].
    MAILB = 253, // mailbox-related RRs (MB, MG or MR) [RFC1035].
    MAILA = 254, // mail agent RRs (OBSOLETE - see MX) [RFC1035].
    ANY = 255, // A request for all records available [RFC1035][RFC6895].
    URI = 256, // URI [RFC7553].
    CAA = 257, // Certification Authority Restriction [RFC6844].
    AVC = 258, // Application Visibility and Control.
    DOA = 259, // Digital Object Architecture.
    TA = 32768, // DNSSEC Trust Authorities.
    DLV = 32769, // DNSSEC Lookaside Validation [RFC4431].
}