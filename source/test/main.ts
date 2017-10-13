import { TestWriterAnnotatedXML } from "./apes/TestWriterAnnotatedXML";
import { TestWriterJSON } from "./apes/TestWriterJSON";
import * as unit from "./unit";

new unit.ConsoleTester({ verbose: false })
    .register(TestWriterAnnotatedXML)
    .register(TestWriterJSON)
    .run()
    .then(status => process.exit(status));