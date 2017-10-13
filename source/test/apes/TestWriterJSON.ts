import * as apes from "../../main/apes";
import * as unit from "../unit";
import * as utils from "./utils";

function writeAndCompare(f: (writer: apes.Writer) => void, expected: string) {
    utils.writeAndCompare(sink => f(new apes.WriterJSON(sink)), expected);
}

export const TestWriterJSON: unit.Suite = {
    name: "WriterJSON",
    units: [
        {
            name: "Write Map with Null",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addNull("a")),
                '{"a":null}'),
        },
        {
            name: "Write Map with Booleans",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addBoolean("a", true)
                    .addBoolean("b", false)),
                '{"a":true,"b":false}'),
        },
        {
            name: "Write Map with Numbers",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addNumber("A", 1)
                    .addNumber("B", 12)
                    .addNumber("C", 123)),
                '{"A":1,"B":12,"C":123}'),
        },
        {
            name: "Write Map with Texts",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addText("alpha", "Hello")
                    .addText("beta", "World!")),
                '{"alpha":"Hello","beta":"World!"}'),
        },
        {
            name: "Write Map with Lists",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addList("a", writer => writer
                        .addNull()
                        .addNull())
                    .addList("b", writer => writer
                        .addNumber(1)
                        .addBoolean(false))),
                '{"a":[null,null],"b":[1,false]}'),
        },
        {
            name: "Write Map with Maps",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addMap("a", writer => writer
                        .addNull("a0")
                        .addNull("a1"))
                    .addMap("b", writer => writer
                        .addNumber("b0", 1)
                        .addBoolean("b1", false))),
                '{"a":{"a0":null,"a1":null},"b":{"b0":1,"b1":false}}'),
        },
        {
            name: "Write List with Nulls",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addNull()
                    .addNull()
                    .addNull()),
                '[null,null,null]'),
        },
        {
            name: "Write List with Booleans",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addBoolean(false)
                    .addBoolean(true)),
                '[false,true]'),
        },
        {
            name: "Write List with Number",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addNumber(1234)),
                '[1234]'),
        },
        {
            name: "Write List with Texts",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addText("Hello")
                    .addText("World!")),
                '["Hello","World!"]'),
        },
        {
            name: "Write List with Lists",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addList(writer => writer
                        .addNull()
                        .addNull())
                    .addList(writer => writer
                        .addNumber(1)
                        .addBoolean(false))),
                '[[null,null],[1,false]]'),
        },
        {
            name: "Write List with Maps",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addMap(writer => writer
                        .addNull("a0")
                        .addNull("a1"))
                    .addMap(writer => writer
                        .addNumber("b0", 1)
                        .addBoolean("b1", false))),
                '[{"a0":null,"a1":null},{"b0":1,"b1":false}]'),
        },
    ]
};