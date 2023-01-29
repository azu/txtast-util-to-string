// LICENSE : MIT
"use strict";
import assert from "assert";
import { parse } from "markdown-to-ast";
import StringSource from "../src/StringSource";
import { split as sentenceSplitter } from "sentence-splitter";

describe("StringSource", function () {
    describe("#toString", function () {
        it("should concat string", function () {
            let AST = parse("**str**");
            let source = new StringSource(AST);
            assert.equal(source + "!!", "str!!");
        });
    });
    context("Each Pattern", function () {
        it("should return relative position of the node", function () {
            let AST = parse(`1st P

**2nd** P`);
            let [p1st, p2nd] = AST.children;
            let source1st = new StringSource(p1st);
            assert.equal(source1st.toString(), "1st P");
            assert.equal(source1st.tokenMaps.length, 1);
            let token1st = source1st.tokenMaps[0];
            assert.deepEqual(token1st, {
                generated: [0, 5],
                intermediate: [0, 5],
                original: [0, 5],
                generatedValue: "1st P"
            });
            let source2nd = new StringSource(p2nd);
            assert.equal(source2nd.toString(), "2nd P");
            assert.equal(source2nd.tokenMaps.length, 2);
            // should return relative position from p2nd
            assert.deepEqual(source2nd.tokenMaps[0], {
                generated: [0, 3],
                intermediate: [2, 5],
                original: [0, 7],
                generatedValue: "2nd"
            });
            assert.deepEqual(source2nd.tokenMaps[1], {
                generated: [3, 5],
                intermediate: [7, 9],
                original: [7, 9],
                generatedValue: " P"
            });
        });
        it("Str", function () {
            let AST = parse("**str**");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "str");
            assert.equal(source.tokenMaps.length, 1);
            let token = source.tokenMaps[0];
            assert.deepEqual(token, {
                generated: [0, 3],
                intermediate: [2, 5],
                original: [0, 7],
                generatedValue: "str"
            });
        });
        it("Str that contain break line", function () {
            let AST = parse("**st\nr**");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "st\nr");
            assert.equal(source.tokenMaps.length, 1);
            let token = source.tokenMaps[0];
            assert.deepEqual(token, {
                generated: [0, 4],
                intermediate: [2, 6],
                original: [0, 8],
                generatedValue: "st\nr"
            });
        });
        it("Link", function () {
            let AST = parse("_[link](http://example)");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "_link");
            assert.equal(source.tokenMaps.length, 2);
            let tokenStr = source.tokenMaps[0];
            assert.deepEqual(tokenStr, {
                generated: [0, 1],
                intermediate: [0, 1],
                original: [0, 1],
                generatedValue: "_"
            });
            let tokenLink = source.tokenMaps[1];
            assert.deepEqual(tokenLink, {
                generated: [1, 5],
                intermediate: [2, 6],
                original: [1, 23],
                generatedValue: "link"
            });
        });

        it("Link's title should be ignored", function () {
            let AST = parse('_[link](http://example "title")');
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "_link");
            let tokenStr = source.tokenMaps[0];
            assert.deepEqual(tokenStr, {
                generated: [0, 1],
                intermediate: [0, 1],
                original: [0, 1],
                generatedValue: "_"
            });
            let tokenLink = source.tokenMaps[1];
            assert.deepEqual(tokenLink, {
                generated: [1, 5],
                intermediate: [2, 6],
                original: [1, 31],
                generatedValue: "link"
            });
        });
        it("Str + `Code` + Str", function () {
            let AST = parse("text`code`text");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "textcodetext");
            assert.equal(source.tokenMaps.length, 3);
            assert.deepEqual(source.tokenMaps[0], {
                generated: [0, 4],
                intermediate: [0, 4],
                original: [0, 4],
                generatedValue: "text"
            });
            assert.deepEqual(source.tokenMaps[1], {
                generated: [4, 8],
                intermediate: [5, 9],
                original: [4, 10],
                generatedValue: "code"
            });
            assert.deepEqual(source.tokenMaps[2], {
                generated: [8, 12],
                intermediate: [10, 14],
                original: [10, 14],
                generatedValue: "text"
            });
        });
        it("Header", function () {
            let AST = parse("# Header");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "Header");
            assert.equal(source.tokenMaps.length, 1);
            assert.deepEqual(source.tokenMaps[0], {
                generated: [0, 6],
                intermediate: [2, 8],
                original: [0, 8],
                generatedValue: "Header"
            });
        });
        it("Image + Str", function () {
            let AST = parse("![alt](http://example.png) text");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            assert.equal(source.tokenMaps.length, 2);
            assert.deepEqual(source.tokenMaps[0], {
                generated: [0, 3],
                intermediate: [2, 5],
                original: [0, 26],
                generatedValue: "alt"
            });
            assert.deepEqual(source.tokenMaps[1], {
                generated: [3, 8],
                intermediate: [26, 31],
                original: [26, 31],
                generatedValue: " text"
            });
        });
        it("Image's title should be ignored", function () {
            let AST = parse('![alt](http://example.png "title") text');
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            assert.equal(source.tokenMaps.length, 2);
            assert.deepEqual(source.tokenMaps[0], {
                generated: [0, 3],
                intermediate: [2, 5],
                original: [0, 34],
                generatedValue: "alt"
            });
            assert.deepEqual(source.tokenMaps[1], {
                generated: [3, 8],
                intermediate: [34, 39],
                original: [34, 39],
                generatedValue: " text"
            });
        });
        it("inline html tag", function () {
            const AST = parse("It is <p>TEST</p>");
            const source = new StringSource(AST);
            const result = source.toString();
            assert.strictEqual(result, "It is TEST");
            const indexOfGenerated = result.indexOf("TEST");
            const indexOfOriginal = source.originalIndexFromIndex(indexOfGenerated);
            assert.strictEqual(indexOfOriginal, 9);
            assert.strictEqual(source.tokenMaps.length, 2);
            assert.deepStrictEqual(source.tokenMaps[0], {
                generated: [0, 6],
                generatedValue: "It is ",
                intermediate: [0, 6],
                original: [0, 6]
            });
            assert.deepStrictEqual(source.tokenMaps[1], {
                generated: [6, 10],
                generatedValue: "TEST",
                intermediate: [9, 13],
                original: [9, 13]
            });
        });
        it("complex html tag", function () {
            const AST = parse(
                `<a href="http://example.com" title="example"><img src="http://example.com" />TEST1</a> **BOLD** <b>TEST2</b>`
            );
            const source = new StringSource(AST);
            const result = source.toString();
            assert.strictEqual(result, "TEST1 BOLD TEST2");
            const index1Generated = result.indexOf("TEST1");
            const index1Original = source.originalIndexFromIndex(index1Generated);
            assert.strictEqual(index1Original, 77);
            const index2Generated = result.indexOf("TEST2");
            const index2Original = source.originalIndexFromIndex(index2Generated);
            assert.strictEqual(index2Original, 99);
        });
        it("confusing pattern", function () {
            let AST = parse("![!](http://example.com)");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "!");
            assert.equal(source.tokenMaps.length, 1);
            assert.deepEqual(source.tokenMaps[0], {
                generated: [0, 1],
                intermediate: [2, 3],
                original: [0, 24],
                generatedValue: "!"
            });
        });
        it("Empty", function () {
            let AST = parse("");
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "");
            assert.equal(source.tokenMaps.length, 0);
        });
    });

    describe("#originalIndexFromIndex", function () {
        it("should correct **match** at end", function () {
            const AST = parse("**match** text");
            const source = new StringSource(AST);
            assert.equal(source.originalIndexFromIndex(0), 2);
            // isEnd
            assert.equal(source.originalIndexFromIndex(5, true), 7);
        });
        it("Str + Link", function () {
            var originalText = "This is [Example！？](http://example.com/)";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "This is Example！？");
            assert.ok(originalText.slice(9, 16) === "Example");
            var index1 = result.indexOf("Example");
            assert.equal(index1, 8);
            assert.equal(source.originalIndexFromIndex(index1), 9);
            var index2 = result.indexOf("！？");
            assert.equal(index2, 15);
            assert.equal(source.originalIndexFromIndex(index2), 16);
        });
        it("should return the original index of an index in a generated sentence", function () {
            var originalText = "![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            var indexOf = result.indexOf("text");
            assert.equal(indexOf, 4);
            assert.deepEqual(source.originalIndexFromIndex(indexOf), 27);
            assert.equal(originalText.slice(27), "text");
        });
        it("should return the original index (the end of a sentence)", function () {
            var originalText = "![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            const indexOf = result.indexOf("text");
            assert.equal(indexOf, 4);
            assert.equal(indexOf + ("text".length - 1), 7);
            assert.equal(originalText[30], "t");
            assert.equal(source.originalIndexFromIndex(indexOf + ("text".length - 1)), 30);
            assert.equal(originalText[source.originalIndexFromIndex(indexOf + ("text".length - 1))], "t");
        });
        it("should return null when the specified index is larger than the length of a generated sentence", function () {
            var originalText = "![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            assert.equal(source.originalIndexFromIndex(1000), null);
        });
        it("should return null when -1", function () {
            var originalText = "![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            assert.equal(source.originalIndexFromIndex(-1), null);
        });
        it("test for https://github.com/textlint/textlint-util-to-string/issues/4", function () {
            // related https://github.com/textlint/textlint-util-to-string/commit/1969f3b82bc490b435e2b2a631cf89a7158d80ed
            const originalText = "This link contains an [errror](index.html).";
            const AST = parse(originalText);
            const source = new StringSource(AST);
            const originalPosition = source.originalPositionFromIndex(22);
            assert.deepEqual(originalPosition, {
                line: 1,
                column: 23
            });
        });
    });
    describe("#originalPositionFromPosition", function () {
        it("Str + Link", function () {
            var originalText = "This is [Example！？](http://example.com/)";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "This is Example！？");
            assert.deepEqual(
                source.originalPositionFromPosition({
                    line: 1,
                    column: 8
                }),
                {
                    line: 1,
                    column: 9
                }
            );
            assert.deepEqual(
                source.originalPositionFromPosition({
                    line: 1,
                    column: 15
                }),
                {
                    line: 1,
                    column: 16
                }
            );
        });
        it("should return the original position from a position in a generated sentence", function () {
            var originalText = "First\n![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "First\nalt text");
            // 4
            var lines = result.split("\n");
            var indexOf = lines[1].indexOf("text");
            assert.deepEqual(
                source.originalPositionFromPosition({
                    line: lines.length,
                    column: indexOf
                }),
                {
                    line: 2,
                    column: 27
                }
            );
        });
        it("should return null when the specified position is invalid", function () {
            var originalText = "![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            assert.equal(
                source.originalPositionFromPosition({
                    line: -1,
                    column: -1
                }),
                null
            );
        });
        it("should throw error when the specified position is not an object", function () {
            var originalText = "![alt](http://example.png) text";
            let AST = parse(originalText);
            let source = new StringSource(AST);
            let result = source.toString();
            assert.equal(result, "alt text");
            assert.throws(function () {
                source.originalPositionFromPosition();
            });
        });
        it("with sentenceSplitter", function () {
            var originalText = "`1`st.\n" + "``2`nd.`\n" + "`3`rd Text.";
            let AST = parse(originalText);
            // Node -> Plain Text
            let source = new StringSource(AST);
            let result = source.toString();
            // Plain Text -> Sentences
            let sentences = sentenceSplitter(result).filter((node) => node.type === "Sentence");
            assert.equal(sentences.length, 3);
            let lastSentence = sentences[sentences.length - 1];
            // Find "text" in a Sentence
            let indexOf = lastSentence.raw.indexOf("Text");
            assert.equal(indexOf, 4);
            // position in a sentence
            let matchWordPosition = {
                line: lastSentence.loc.start.line,
                column: lastSentence.loc.start.column + indexOf
            };
            assert.deepEqual(matchWordPosition, {
                line: 3,
                column: 4
            });
            // position in original text
            let originalMatchWordPosition = source.originalPositionFromPosition(matchWordPosition);
            assert.deepEqual(originalMatchWordPosition, {
                line: 3,
                column: 6
            });
        });
    });
});
