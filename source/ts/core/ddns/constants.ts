/**
 * DNS message domain classes.
 */
export enum DClass {
    IN = 1,
    CS = 2, // Obsoleted by RFC 1035.
    CH = 3,
    HS = 4,
    NONE = 254,
    ANY = 255,
}

/**
 * DNS message operation codes.
 */
export enum OpCode {
    QUERY = 0,
    IQUERY = 1,
    STATUS = 2,
    UPDATE = 5, // Added by RFC 2136.
}

/**
 * DNS message response codes.
 */
export enum RCode {
    NOERROR = 0,
    FORMERR = 1,
    SERVFAIL = 2,
    NXDOMAIN = 3,
    NOTIMP = 4,
    REFUSED = 5,
    YXDOMAIN = 6, // Added by RFC 2136.
    YXRRSET = 7, // Added by RFC 2136.
    NXRRSET = 8, // Added by RFC 2136.
    NOTAUTH = 9, // Added by RFC 2136.
    NOTZONE = 10, // Added by RFC 2136.
    BADSIG = 16, // Added by RFC 2845.
    BADKEY = 17, // Added by RFC 2845.
    BADTIME = 18, // Added by RFC 2845.
}

/**
 * DNS resource data types.
 */
export enum Type {
    A = 1,
    NS = 2,
    MD = 3, // Obsoleted by RFC 1035.
    MF = 4, // Obsoleted by RFC 1035.
    CNAME = 5,
    SOA = 6,
    MB = 7, // Obsoleted by RFC 1035.
    MG = 8, // Obsoleted by RFC 1035.
    MR = 9, // Obsoleted by RFC 1035.
    NULL = 10, // Obsoleted by RFC 1035.
    WKS = 11, // Obsoleted by RFC 1123.
    PTR = 12,
    HINFO = 13, // Ignored.
    MINFO = 14, // Obsoleted by RFC 1035.
    MX = 15,
    TXT = 16,
    AAAA = 28, // Added by RFC 3596.
    SRV = 33, // Added by RFC 2728.
    TSIG = 250, // Added by RFC 2845.
    AXFR = 252, // Ignored.
    MAILB = 253, // Obsoleted by RFC 1035.
    MAILA = 254, // Obsoleted by RFC 1035.
    ANY = 255,
}