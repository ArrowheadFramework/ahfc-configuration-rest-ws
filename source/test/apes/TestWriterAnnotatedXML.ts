import * as apes from "../../main/apes";
import * as unit from "../unit";
import * as utils from "./utils";

function writeAndCompare(f: (writer: apes.Writer) => void, expected: string) {
    utils.writeAndCompare(sink =>
        f(new apes.WriterAnnotatedXML(sink)), expected);
}

export const TestWriterAnnotatedXML: unit.Suite = {
    name: "WriterAnnotatedXML",
    units: [
        {
            name: "Write Map of Null",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addNull("a")),
                '<root semantics="APES" type="Map">' +
                '<entry key="a" type="Null">null</entry>' +
                '</root>'),
        },
        {
            name: "Write Map of Booleans",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addBoolean("a", true)
                    .addBoolean("b", false)),
                '<root semantics="APES" type="Map">' +
                '<entry key="a" type="Boolean">true</entry>' +
                '<entry key="b" type="Boolean">false</entry>' +
                '</root>'),
        },
        {
            name: "Write Map of Numbers",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addNumber("A", 1)
                    .addNumber("B", 12)
                    .addNumber("C", 123)),
                '<root semantics="APES" type="Map">' +
                '<entry key="A" type="Number">1</entry>' +
                '<entry key="B" type="Number">12</entry>' +
                '<entry key="C" type="Number">123</entry>' +
                '</root>'),
        },
        {
            name: "Write Map of Texts",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addText("alpha", "Hello")
                    .addText("beta", "<World!>")),
                '<root semantics="APES" type="Map">' +
                '<entry key="alpha" type="Text">Hello</entry>' +
                '<entry key="beta" type="Text">&lt;World!&gt;</entry>' +
                '</root>'),
        },
        {
            name: "Write Map of Lists",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addList("a", writer => writer
                        .addNull()
                        .addNull())
                    .addList("b", writer => writer
                        .addNumber(1)
                        .addBoolean(false))),
                '<root semantics="APES" type="Map">' +
                '<entry key="a" type="List">' +
                '<item type="Null">null</item>' +
                '<item type="Null">null</item>' +
                '</entry>' +
                '<entry key="b" type="List">' +
                '<item type="Number">1</item>' +
                '<item type="Boolean">false</item>' +
                '</entry>' +
                '</root>'),
        },
        {
            name: "Write Map of Maps",
            test: recorder => writeAndCompare(writer => writer
                .writeMap(writer => writer
                    .addMap("a", writer => writer
                        .addNull("a0")
                        .addNull("a1"))
                    .addMap("b", writer => writer
                        .addNumber("b0", 1)
                        .addBoolean("b1", false))),
                '<root semantics="APES" type="Map">' +
                '<entry key="a" type="Map">' +
                '<entry key="a0" type="Null">null</entry>' +
                '<entry key="a1" type="Null">null</entry>' +
                '</entry>' +
                '<entry key="b" type="Map">' +
                '<entry key="b0" type="Number">1</entry>' +
                '<entry key="b1" type="Boolean">false</entry>' +
                '</entry>' +
                '</root>'),
        },
        {
            name: "Write List of Nulls",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addNull()
                    .addNull()
                    .addNull()),
                '<root semantics="APES" type="List">' +
                '<item type="Null">null</item>' +
                '<item type="Null">null</item>' +
                '<item type="Null">null</item>' +
                '</root>'),
        },
        {
            name: "Write List of Booleans",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addBoolean(false)
                    .addBoolean(true)),
                '<root semantics="APES" type="List">' +
                '<item type="Boolean">false</item>' +
                '<item type="Boolean">true</item>' +
                '</root>'),
        },
        {
            name: "Write List of Number",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addNumber(1.234e+56)),
                '<root semantics="APES" type="List">' +
                '<item type="Number">1.234e+56</item>' +
                '</root>'),
        },
        {
            name: "Write List of Texts",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addText("Hello")
                    .addText("World!")),
                '<root semantics="APES" type="List">' +
                '<item type="Text">Hello</item>' +
                '<item type="Text">World!</item>' +
                '</root>'),
        },
        {
            name: "Write List of Lists",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addList(writer => writer
                        .addNull()
                        .addNull())
                    .addList(writer => writer
                        .addNumber(1)
                        .addBoolean(false))),
                '<root semantics="APES" type="List">' +
                '<item type="List">' +
                '<item type="Null">null</item>' +
                '<item type="Null">null</item>' +
                '</item>' +
                '<item type="List">' +
                '<item type="Number">1</item>' +
                '<item type="Boolean">false</item>' +
                '</item>' +
                '</root>'),
        },
        {
            name: "Write List of Maps",
            test: recorder => writeAndCompare(writer => writer
                .writeList(writer => writer
                    .addMap(writer => writer
                        .addNull("a0")
                        .addNull("a1"))
                    .addMap(writer => writer
                        .addNumber("b0", 1)
                        .addBoolean("b1", false))),
                '<root semantics="APES" type="List">' +
                '<item type="Map">' +
                '<entry key="a0" type="Null">null</entry>' +
                '<entry key="a1" type="Null">null</entry>' +
                '</item>' +
                '<item type="Map">' +
                '<entry key="b0" type="Number">1</entry>' +
                '<entry key="b1" type="Boolean">false</entry>' +
                '</item>' +
                '</root>'),
        },
    ]
};