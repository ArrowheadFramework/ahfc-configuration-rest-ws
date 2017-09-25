import { DClass, Type } from "./constants";
import * as crypto from "crypto";
import { Writer } from "./io";
import { TSIG } from "./ResourceData";
import { ResourceRecord } from "./ResourceRecord";

/**
 * An object used to create RFC 2845 Transaction SIGnatures (TSIGs).
 */
export class TransactionSigner {
    /**
     * Creates a new TSIG object.
     * 
     * If no algorithm is specified, `HMAC-MD5.SIG-ALG.REG.INT` is used by
     * default. Other standardised alternatives include `hmac-sha1`,
     * `hmac-sha224`, `hmac-sha256`, `hmac-sha384` and `hmac-sha512` (see RFC
     * 4635). The actual algorithms are provided by the system via OpenSSL,
     * which means they need to be installed to be useable.
     * 
     * @param key Secret key shared with remote host to receive transaction.
     * @param keyName Name of key.
     * @param algorithmName Name of hashing algorithm to use with key.
     * @param fudge Seconds of error permitted in created TSIG timestamps.
     */
    public constructor(
        public readonly key: string | Buffer,
        public readonly keyName: string,
        public readonly algorithmName: string = "HMAC-MD5.SIG-ALG.REG.INT",
        public readonly fudge = 300
    ) {
        if (fudge < 0 || fudge > 0x7fff) {
            fudge = 300;
        }
    }

    /**
     * Creates transaction signature record.
     * 
     * The created record must be added at the end of the ADDITIONALS section of
     * the signed message before transmission, wich may not include any further
     * changes. Also, the ADCOUNT of the message header must be incremented
     * after the message has been signed and this added to the end of the
     * message buffer.
     * 
     * See RFC 2845 for more details on transaction signatures.
     * 
     * @param messageID ID of signed message.
     * @param messageBuffer Buffer containing message to sign.
     */
    public sign(messageID: number, messageBuffer: Buffer): ResourceRecord {
        const timestamp = new Date().getTime() / 1000;
        const sslName = algorithmNameToSSLName(this.algorithmName);
        const mac = crypto.createHmac(sslName, this.key);

        mac.update(messageBuffer);

        const writer = new Writer(Buffer.alloc(22 + this.keyName.length +
            this.algorithmName.length));

        // See RFC 2845 section 3.4.2.
        writer.writeName(this.keyName);
        writer.writeU16(DClass.ANY);
        writer.writeU32(0);
        writer.writeName(this.algorithmName);
        writer.writeU48(timestamp);
        writer.writeU16(this.fudge);
        writer.writeU16(0);
        writer.writeU16(0);

        mac.update(writer.sink);

        return new ResourceRecord(this.keyName, Type.TSIG, DClass.ANY, 0,
            new TSIG(this.algorithmName, timestamp, this.fudge, mac.digest(),
                messageID, 0, Buffer.alloc(0)));

        function algorithmNameToSSLName(algorithmName: string): string {
            const algorithmNameUpper = algorithmName.toUpperCase();
            if (algorithmNameUpper === "HMAC-MD5.SIG-ALG.REG.INT") {
                return "MD5";
            }
            if (algorithmNameUpper.startsWith("HMAC-")) {
                return algorithmName.substring(5);
            }
            return algorithmName;
        }
    }
}
